import type { ChangeEvent } from 'react';
import type { Language, RequirementsData } from '../types';
import { translations } from '../i18n/translations';
import { UploadCloud, FileJson, FolderCheck } from 'lucide-react';

interface Props {
  language: Language;
  onDataLoaded: (data: RequirementsData) => void;
}

export function JSONLoader({ language, onDataLoaded }: Props) {
  const t = translations[language];

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let content = e.target?.result as string;
        content = content.replace(/^\uFEFF/, ''); // BOM
        content = content.replace(/,\s*([\]}])/g, '$1'); // trailing commas
        
        const json = JSON.parse(content);
        if (json.tender && json.requirements) {
          onDataLoaded(json as RequirementsData);
        } else {
          alert("Invalid requirements.json format. Missing 'tender' or 'requirements' fields.");
        }
      } catch (err: any) {
        console.error("JSON Parse Error:", err);
        alert(`Failed to parse JSON: ${err.message}. Please check if the file is a valid JSON document.`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      <div className="bg-slate-50 border-b border-slate-200 p-8 text-center">
        <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <FolderCheck size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.appTitle}</h2>
        <p className="text-slate-500 max-w-md mx-auto">{t.emptyStateTitle}</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8 text-center sm:text-left">
          
          <div className="flex flex-col items-center sm:items-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-3">1</div>
            <p className="text-sm font-semibold text-slate-900">{t.emptyStep1}</p>
          </div>
          
          <div className="flex flex-col items-center sm:items-start">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm mb-3">2</div>
            <p className="text-sm font-medium text-slate-500">{t.emptyStep2}</p>
          </div>
          
          <div className="flex flex-col items-center sm:items-start">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm mb-3">3</div>
            <p className="text-sm font-medium text-slate-500">{t.emptyStep3}</p>
          </div>
          
          <div className="flex flex-col items-center sm:items-start">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm mb-3">4</div>
            <p className="text-sm font-medium text-slate-500">{t.emptyStep4}</p>
          </div>

        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors">
          <FileJson className="mx-auto text-blue-500 mb-3" size={40} strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.uploadPrompt}</h3>
          <p className="text-sm text-slate-500 mb-6">{t.uploadJsonHelper}</p>
          
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors inline-flex items-center gap-2 font-medium">
            <UploadCloud size={18} />
            <span>{t.loadRequirements}</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
      
    </div>
  );
}
