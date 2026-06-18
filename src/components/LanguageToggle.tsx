import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nature-200 dark:bg-nature-800 text-nature-700 dark:text-nature-200 hover:bg-nature-300 dark:hover:bg-nature-700 transition-colors focus:outline-none focus:ring-2 focus:ring-nature-700 font-medium"
      aria-label="Toggle Language"
    >
      <Globe className="w-5 h-5" />
      <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
