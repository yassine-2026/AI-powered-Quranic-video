import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Settings, Loader2, Sparkles, Video, Clapperboard, MonitorPlay } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import axios from 'axios';

import surahsData from './data/surahs.json';
import recitersData from './data/reciters.json';

interface Surah { id: number; name: string; transliteration: string; verses: number; }
interface Reciter { id: string; name: string; language: string; }

export default function App() {
  const { t, i18n } = useTranslation();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  
  const [selectedSurah, setSelectedSurah] = useState<string>('');
  const [selectedAyahs, setSelectedAyahs] = useState<string>('1-5');
  const [selectedReciter, setSelectedReciter] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [selectedFormat, setSelectedFormat] = useState<string>('16:9');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Set initial dir
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    // Load local json data directly
    setSurahs(surahsData);
    setReciters(recitersData);
    
    // Load persisted settings
    const savedSurah = localStorage.getItem('selectedSurah');
    if (savedSurah) setSelectedSurah(savedSurah);
    const savedReciter = localStorage.getItem('selectedReciter');
    if (savedReciter) setSelectedReciter(savedReciter);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setVideoUrl(null);
    localStorage.setItem('selectedSurah', selectedSurah);
    localStorage.setItem('selectedReciter', selectedReciter);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await axios.post(`${apiUrl}/api/generate`, {
        surah: selectedSurah,
        ayahs: selectedAyahs,
        reciter: selectedReciter,
        style: selectedStyle,
        format: selectedFormat
      });
      const jobId = res.data.jobId;
      
      // Poll for status
      const poll = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${apiUrl}/api/status/${jobId}`);
          if (statusRes.data.status === 'completed') {
            clearInterval(poll);
            setVideoUrl(statusRes.data.videoUrl);
            setIsGenerating(false);
          }
        } catch (e) {
          clearInterval(poll);
          setIsGenerating(false);
        }
      }, 3000);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-50 dark:bg-nature-900 text-nature-900 dark:text-nature-50 transition-colors duration-300 font-serif">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-nature-900/80 backdrop-blur-lg border-b border-nature-300 dark:border-nature-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-nature-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-nature-700/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-nature-700 dark:text-nature-400">
              {t('app_title')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
          >
            {t('subtitle')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-nature-500 dark:text-nature-400 max-w-2xl mx-auto"
          >
            Powered by modern open-source AI (Ollama, Stable Diffusion, ComfyUI, Whisper) running entirely independent of external DBs.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Controls Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 bg-white dark:bg-nature-800 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 p-6 md:p-8 border border-nature-300 dark:border-nature-700"
          >
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('surah')}</label>
                <select 
                  required
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(e.target.value)}
                  className="w-full bg-nature-50 dark:bg-nature-900 border border-nature-300 dark:border-nature-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-700 focus:border-nature-700 transition-all outline-none"
                >
                  <option value="" disabled>{t('select_surah')}</option>
                  {surahs.map(s => (
                    <option key={s.id} value={s.id}>{s.id}. {i18n.language === 'ar' ? s.name : s.transliteration}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{t('ayah')}</label>
                <input 
                  type="text" 
                  value={selectedAyahs}
                  onChange={(e) => setSelectedAyahs(e.target.value)}
                  placeholder="e.g. 1-5 or 1,2,3"
                  className="w-full bg-nature-50 dark:bg-nature-900 border border-nature-300 dark:border-nature-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-700 focus:border-nature-700 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{t('reciter')}</label>
                <select 
                  required
                  value={selectedReciter}
                  onChange={(e) => setSelectedReciter(e.target.value)}
                  className="w-full bg-nature-50 dark:bg-nature-900 border border-nature-300 dark:border-nature-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-700 focus:border-nature-700 transition-all outline-none"
                >
                  <option value="" disabled>{t('select_reciter')}</option>
                  {reciters.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('video_style')}</label>
                  <select 
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-nature-50 dark:bg-nature-900 border border-nature-300 dark:border-nature-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-700 focus:border-nature-700 transition-all outline-none"
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="documentary">Documentary</option>
                    <option value="artistic">Artistic</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('video_format')}</label>
                  <select 
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full bg-nature-50 dark:bg-nature-900 border border-nature-300 dark:border-nature-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-700 focus:border-nature-700 transition-all outline-none"
                  >
                    <option value="16:9">16:9 (Horizontal)</option>
                    <option value="9:16">9:16 (Vertical/Shorts)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full mt-6 bg-nature-700 hover:bg-nature-800 disabled:opacity-70 text-white font-bold py-4 px-6 rounded-xl flex justify-center items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-nature-700/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{t('generating')}</span>
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-6 h-6" />
                    <span>{t('generate_video')}</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Preview Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7"
          >
            <div className="bg-nature-300 dark:bg-nature-800 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden border-4 border-white dark:border-nature-900 h-full min-h-[400px] flex flex-col relative group">
              
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-nature-50/90 dark:bg-nature-900/90 backdrop-blur-sm z-10 p-8 text-center"
                  >
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-4 border-nature-300 dark:border-nature-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-nature-700 dark:border-nature-400 rounded-full animate-spin border-t-transparent dark:border-t-transparent"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-nature-700 dark:text-nature-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Analyzing Verses with Ollama/Llama3...</h3>
                    <p className="text-sm text-nature-500 dark:text-nature-400">Generating images via ComfyUI & syncing audio.</p>
                  </motion.div>
                ) : videoUrl ? (
                  <motion.div
                    key="video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 w-full h-full relative bg-black"
                  >
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-nature-500 dark:text-nature-400"
                  >
                    <MonitorPlay className="w-20 h-20 mb-6 opacity-20" />
                    <p className="text-lg text-center max-w-md">
                      Select your parameters on the left to generate a stunning AI Quranic video directly in your browser.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Bar (Only shows when video is ready) */}
              <AnimatePresence>
                {videoUrl && !isGenerating && (
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4"
                  >
                    <a 
                      href={videoUrl} 
                      download="quran-video.mp4"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-2 font-medium transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      {t('download')}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

