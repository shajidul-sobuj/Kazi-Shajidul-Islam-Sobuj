import type { Language } from '../types';
import { translations } from '../i18n/translations';
import { FileText, Globe } from 'lucide-react';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Header({ language, onLanguageChange }: Props) {
  const t = translations[language];

  return (
    <header className="bg-slate-800 text-slate-100 p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <FileText size={28} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-bold">{t.appTitle}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">{t.appSubtitle}</p>
        </div>
      </div>
      
      <button
        onClick={() => onLanguageChange(language === 'en' ? 'bn' : 'en')}
        className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm transition-colors"
      >
        <Globe size={16} />
        <span>{t.langToggle}</span>
      </button>
    </header>
  );
}
