import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_title": "Quranic AI Video Studio",
      "subtitle": "Create cinematic, AI-generated Quranic videos in seconds.",
      "generate_video": "Generate Video",
      "surah": "Surah",
      "ayah": "Ayahs",
      "reciter": "Reciter",
      "translation_lang": "Translation Language",
      "video_style": "Video Style",
      "video_format": "Video Format",
      "resolution": "Resolution",
      "dark_mode": "Dark Mode",
      "light_mode": "Light Mode",
      "language": "Language",
      "generating": "Generating Video (AI Processing)...",
      "download": "Download Video",
      "preview": "Preview",
      "select_surah": "Select a Surah",
      "select_reciter": "Select Reciter"
    }
  },
  ar: {
    translation: {
      "app_title": "استوديو الفيديوهات القرآنية بالذكاء الاصطناعي",
      "subtitle": "أنشئ فيديوهات قرآنية سينمائية بالذكاء الاصطناعي في ثوانٍ.",
      "generate_video": "إنشاء الفيديو",
      "surah": "السورة",
      "ayah": "الآيات",
      "reciter": "القارئ",
      "translation_lang": "لغة الترجمة",
      "video_style": "نمط الفيديو",
      "video_format": "أبعاد الفيديو",
      "resolution": "الدقة",
      "dark_mode": "الوضع الليلي",
      "light_mode": "الوضع النهاري",
      "language": "اللغة",
      "generating": "جاري إنشاء الفيديو (معالجة الذكاء الاصطناعي)...",
      "download": "تحميل الفيديو",
      "preview": "معاينة",
      "select_surah": "اختر سورة",
      "select_reciter": "اختر القارئ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'ar',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
