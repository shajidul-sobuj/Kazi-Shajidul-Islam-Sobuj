import React from 'react';
import { Language, RequirementsData } from '../types';
import { translations } from '../i18n/translations';
import { UploadCloud } from 'lucide-react';

interface Props {
  language: Language;
  onDataLoaded: (data: RequirementsData) => void;
}

export function JSONLoader({ language, onDataLoaded }: Props) {
  const t = translations[language];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.tender && json.requirements) {
          onDataLoaded(json as RequirementsData);
        } else {
          alert("Invalid requirements.json format.");
        }
      } catch (err) {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    // clear input
    event.target.value = '';
  };

  return (
    <div className="border-2 border-dashed border-slate-600 rounded-lg p-10 text-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <UploadCloud className="mx-auto text-blue-400 mb-4" size={48} />
      <h2 className="text-xl font-semibold mb-2">{t.uploadPrompt}</h2>
      <p className="text-slate-400 mb-6">{t.uploadJsonHelper}</p>
      
      <label className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded shadow cursor-pointer transition-colors inline-block font-medium">
        {t.loadRequirements}
        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
      </label>
    </div>
  );
}
