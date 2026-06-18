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

// AI Tools configuration from .env
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LLAMA_MODEL = process.env.LLAMA_MODEL || 'llama3';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen3';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-large-v3';
const STABLE_DIFFUSION_MODEL = process.env.STABLE_DIFFUSION_MODEL || 'stable-diffusion-xl';
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://localhost:8188';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);

  // Security and Middleware
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for dev preview ease, normally configure strict CSP
  app.use(cors());
  app.use(express.json());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  // Storage for temporary video exports
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = './temp_uploads';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, uuidv4() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage: storage });

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

  // Video Generation Mock Endpoint
  app.post('/api/generate', async (req, res) => {
    const { surah, ayahs, reciter, style, resolution } = req.body;
    
    // In a real production scenario, this orchestrates calls to:
    // 1. Ollama/Llama3 for semantic analysis, translating the surah to visual prompts.
    // 2. ComfyUI / Stable Diffusion to generate images.
    // 3. Whisper for forced alignment with audio (syncing subs).
    // 4. FFmpeg for combining audio, images, and subtitles.
    
    // We send back an orchestration ID and start async processing.
    const jobId = uuidv4();
    
    // Simulated Orchestration:
    /*
      axios.post(`${OLLAMA_BASE_URL}/api/generate`, { model: LLAMA_MODEL, prompt: \`Describe cinematic visuals for surah ${surah} ayahs ${ayahs}\` });
    */

    res.json({ 
      success: true, 
      jobId, 
      message: 'Video generation started successfully.',
      estimatedTimeMs: 15000
    });
  });

  app.get('/api/status/:jobId', (req, res) => {
    // Simulated status check
    res.json({
      jobId: req.params.jobId,
      status: 'completed',
      // Return a placeholder video URL for the preview (since real AI rendering isn't active in this sandbox)
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
    });
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
    // Provide a wildcard fallback that removes the leading `/` from Express
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
