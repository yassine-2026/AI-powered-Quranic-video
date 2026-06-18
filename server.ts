import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ffmpeg from 'fluent-ffmpeg';

// AI Tools configuration from .env
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LLAMA_MODEL = process.env.LLAMA_MODEL || 'llama3';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-large-v3';
const STABLE_DIFFUSION_MODEL = process.env.STABLE_DIFFUSION_MODEL || 'stable-diffusion-xl';
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://localhost:8188';
const FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';

ffmpeg.setFfmpegPath(FFMPEG_PATH);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure directories
const VIDEOS_DIR = path.join(process.cwd(), 'public', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

interface JobState {
  id: string;
  status: 'processing' | 'completed' | 'error';
  videoUrl?: string;
  error?: string;
}

const jobs = new Map<string, JobState>();

async function generateQuranicVideoProcess(jobId: string, params: any) {
  const { surah, ayahs, reciter, style, format } = params;
  try {
    const workDir = path.join(process.cwd(), 'temp_uploads', jobId);
    fs.mkdirSync(workDir, { recursive: true });

    // 1. Analyze text & scene with Ollama
    let sceneDescription = "A beautiful serene landscape covering historical majestic vibes.";
    try {
      const ollamaRes = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: LLAMA_MODEL,
        prompt: `Provide a short English prompt to generate an image for Quranic verse (Surah ${surah}, Ayah ${ayahs}) with ${style} style. No explanations, just the prompt.`,
        stream: false
      }, { timeout: 30000 });
      sceneDescription = ollamaRes.data.response.trim();
    } catch (e) {
      console.warn("Ollama unavailable, using fallback prompt.");
    }

    // 2. Generate Image via ComfyUI / SDXL
    const imagePath = path.join(workDir, 'background.jpg');
    try {
      const comfyRes = await axios.post(`${COMFYUI_URL}/prompt`, {
        prompt: {
          "3": {
            "class_type": "KSampler",
            "inputs": { "seed": Math.floor(Math.random()*(1e14)), "steps": 20, "cfg": 8, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }
          },
          "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": STABLE_DIFFUSION_MODEL } },
          "5": { "class_type": "EmptyLatentImage", "inputs": { "batch_size": 1, "height": format === '16:9' ? 1080 : format === '9:16' ? 1920 : 1080, "width": format === '16:9' ? 1920 : format === '9:16' ? 1080 : 1080 } },
          "6": { "class_type": "CLIPTextEncode", "inputs": { "text": sceneDescription, "clip": ["4", 1] } },
          "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "bad quality, blurry", "clip": ["4", 1] } },
          "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
          "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": jobId, "images": ["8", 0] } }
        }
      }, { timeout: 10000 });
      // In a real pipeline, we'd poll or wait for WebSocket, for demo we assume image gets generated.
      // But we will place a fallback image if it fails/doesn't exist
    } catch (e) {
      console.warn("ComfyUI unavailable, generating solid color fallback image.");
    }

    // Create a fallback solid block if image missing
    if (!fs.existsSync(imagePath)) {
      // Create a solid image using ffmpeg for fallback
      await new Promise((resolve, reject) => {
        const w = format === '9:16' ? 1080 : 1920;
        const h = format === '9:16' ? 1920 : 1080;
        ffmpeg()
          .input(`color=c=black:s=${w}x${h}`)
          .inputFormat('lavfi')
          .frames(1)
          .save(imagePath)
          .on('end', resolve)
          .on('error', reject);
      });
    }

    // 3. Audio / Whisper alignment (Mocked audio with Silence for fallback)
    const audioPath = path.join(workDir, 'audio.mp3');
    await new Promise((resolve, reject) => {
      // Generating 5 seconds of silent audio or basic tone
      ffmpeg()
        .input('anullsrc=r=44100:cl=mono')
        .inputFormat('lavfi')
        .duration(5)
        .audioCodec('libmp3lame')
        .save(audioPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // 4. Subtitles (SRT)
    const srtPath = path.join(workDir, 'subtitles.srt');
    fs.writeFileSync(srtPath, `1\n00:00:00,000 --> 00:00:04,500\n[Surah ${surah} - Ayahs ${ayahs}]\nEnjoy the recitation by ${reciter}.`);

    // 5. Build final Video with FFmpeg
    const outputFileName = `quran_${jobId}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputFileName);
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop(5)
        .input(audioPath)
        // using simple complex filter to burn subtitles
        .outputOptions([
          '-c:v libx264',
          '-tune stillimage',
          '-c:a aac',
          '-b:a 192k',
          '-pix_fmt yuv420p',
          '-shortest',
          `-vf subtitles=${srtPath}`
        ])
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // 6. Cleanup temp files (optional, leaving for debug usually)
    // fs.rmSync(workDir, { recursive: true, force: true });

    const videoUrl = `/videos/${outputFileName}`;
    jobs.set(jobId, { id: jobId, status: 'completed', videoUrl });

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    jobs.set(jobId, { id: jobId, status: 'error', error: error?.message || 'Unknown error' });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);

  // Security and Middleware
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for dev preview ease
  app.use(cors());
  app.use(express.json());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  // Serve static videos
  app.use('/videos', express.static(VIDEOS_DIR));

  // Data Loading Routes
  app.get('/api/surahs', (req, res) => {
    try {
      const data = fs.readFileSync(path.join(__dirname, 'src/data/surahs.json'), 'utf8');
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Failed to load Surahs' });
    }
  });

  app.get('/api/reciters', (req, res) => {
    try {
      const data = fs.readFileSync(path.join(__dirname, 'src/data/reciters.json'), 'utf8');
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Failed to load Reciters' });
    }
  });

  // Video Generation Start Endpoint
  app.post('/api/generate', (req, res) => {
    const jobId = uuidv4();
    jobs.set(jobId, { id: jobId, status: 'processing' });
    
    // Start background processing
    generateQuranicVideoProcess(jobId, req.body);

    res.json({ 
      success: true, 
      jobId, 
      message: 'Video generation started successfully.',
      estimatedTimeMs: 15000
    });
  });

  // Check Status Endpoint
  app.get('/api/status/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const job = jobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
