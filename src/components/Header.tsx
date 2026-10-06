import type { Language } from '../types';
import { translations } from '../i18n/translations';
import { FolderCheck } from 'lucide-react';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Header({ language, onLanguageChange }: Props) {
  const t = translations[language];

  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
          <FolderCheck size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-none">{t.appTitle}</h1>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">{t.appSubtitle}</p>
        </div>
      </div>
      
      <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
        <button
          onClick={() => onLanguageChange('en')}
          className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${language === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          EN
        </button>
        <button
          onClick={() => onLanguageChange('bn')}
          className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${language === 'bn' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          বাংলা
        </button>
      </div>
    </header>
  );
}
