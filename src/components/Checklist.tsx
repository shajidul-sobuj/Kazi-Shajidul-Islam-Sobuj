import { CheckCircle2, AlertCircle, XCircle, HelpCircle, Calendar, FileText } from 'lucide-react';
import type { EvaluatedRequirement, Language, UploadedFile, OfficialStatus } from '../types';
import { translations, getStatusText, getStatusDescription } from '../i18n/translations';

interface Props {
  language: Language;
  evaluatedRequirements: EvaluatedRequirement[];
  files: UploadedFile[];
  onMatchChange: (reqId: string, fileId: string) => void;
  onExpiryChange: (reqId: string, date: string) => void;
}

export function Checklist({ language, evaluatedRequirements, files, onMatchChange, onExpiryChange }: Props) {
  const t = translations[language];

  const getAvailableFiles = (currentReqId: string, currentMatchId?: string) => {
    const assignedToOther = new Set(
      evaluatedRequirements
        .filter(er => er.requirement.id !== currentReqId && er.matchedFileId)
        .map(er => er.matchedFileId!)
    );
    const assignedHashesToOther = new Set(
      evaluatedRequirements
        .filter(er => er.requirement.id !== currentReqId && er.matchedFile)
        .map(er => er.matchedFile!.hash)
    );

    return files.filter(f => 
      !f.isCorrupted && 
      (f.id === currentMatchId || (!assignedToOther.has(f.id) && !assignedHashesToOther.has(f.hash)))
    );
  };

  const getStatusVisuals = (status: OfficialStatus) => {
    switch(status) {
      case 'OK': return { icon: <CheckCircle2 className="text-emerald-500" size={16} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Not provided': return { icon: <HelpCircle className="text-slate-400" size={16} />, color: 'bg-slate-50 text-slate-600 border-slate-200' };
      case 'Missing':
      case 'Expired': 
        return { icon: <XCircle className="text-red-500" size={16} />, color: 'bg-red-50 text-red-700 border-red-200' };
      case 'Expiry date needed':
        return { icon: <AlertCircle className="text-amber-500" size={16} />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-900">{t.checklistTitle}</h3>
        <p className="text-sm text-slate-500 mt-1">{t.checklistSubtitle}</p>
      </div>
      
      <div className="p-5 space-y-4">
        {evaluatedRequirements.map((er) => {
          const req = er.requirement;
          const title = language === 'en' ? req.title_en : req.title_bn;
          const availableFiles = getAvailableFiles(req.id, er.matchedFileId);
          const visuals = getStatusVisuals(er.status);
          
          return (
            <div key={req.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200">
              
              <div className="flex flex-col sm:flex-row">
                
                {/* Left side: Requirements info */}
                <div className="flex-1 p-4 sm:p-5 flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm border border-slate-200">
                    {req.order.toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 leading-snug">{title}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${req.mandatory ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {req.mandatory ? t.mandatory : t.optional}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{req.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 max-w-sm">
                        <select
                          value={er.matchedFileId || ''}
                          onChange={(e) => onMatchChange(req.id, e.target.value)}
                          className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        >
                          <option value="">{t.selectFile}</option>
                          {availableFiles.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.pageCount} {t.pages})
                            </option>
                          ))}
                        </select>
                      </div>

                      {req.has_expiry && (
                        <div className="relative w-full sm:w-auto shrink-0">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                            <Calendar size={14} />
                          </div>
                          <input
                            type="date"
                            value={er.expiryDate || ''}
                            onChange={(e) => onExpiryChange(req.id, e.target.value)}
                            disabled={!er.matchedFileId}
                            className={`pl-8 pr-3 py-2 text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full bg-white
                              ${!er.matchedFileId ? 'opacity-50 cursor-not-allowed border-slate-200' : 
                                !er.expiryDate ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500' : 'border-slate-300'}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Status panel */}
                <div className={`sm:w-64 p-4 sm:p-5 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-100 ${er.isBlocking ? 'bg-red-50/30' : 'bg-slate-50/50'}`}>
                  
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border w-fit ${visuals.color}`}>
                    {visuals.icon}
                    <span>{getStatusText(er.status, language)}</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {getStatusDescription(er.status, language)}
                  </p>
                  
                  {er.matchedFile && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <FileText size={12} className="shrink-0" />
                      <span className="truncate">{er.matchedFile.name}</span>
                    </div>
                  )}

                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
