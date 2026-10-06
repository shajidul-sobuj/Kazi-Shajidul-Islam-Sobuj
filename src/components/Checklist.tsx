
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, Calendar } from 'lucide-react';
import type { EvaluatedRequirement, Language, UploadedFile, OfficialStatus } from '../types';
import { translations, getStatusText } from '../i18n/translations';

interface Props {
  language: Language;
  evaluatedRequirements: EvaluatedRequirement[];
  files: UploadedFile[];
  onMatchChange: (reqId: string, fileId: string) => void;
  onExpiryChange: (reqId: string, date: string) => void;
}

export function Checklist({ language, evaluatedRequirements, files, onMatchChange, onExpiryChange }: Props) {
  const t = translations[language];

  // Get uncorrupted files that are either assigned to this req, or NOT assigned to any req yet, OR are not duplicates that have already been assigned.
  // Actually, to keep it simple, just show all valid files in the dropdown. 
  // We can add logic to disable ones that are already assigned to OTHER requirements or are duplicates of assigned files.
  const getAvailableFiles = (currentReqId: string, currentMatchId?: string) => {
    const assignedToOther = new Set(
      evaluatedRequirements
        .filter(er => er.requirement.id !== currentReqId && er.matchedFileId)
        .map(er => er.matchedFileId!)
    );
    // Also track hashes of files assigned to OTHER requirements
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

  const getStatusIcon = (status: OfficialStatus) => {
    switch(status) {
      case 'OK': return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'Not provided': return <HelpCircle className="text-slate-400" size={18} />;
      case 'Missing':
      case 'Expired': 
        return <XCircle className="text-red-400" size={18} />;
      case 'Expiry date needed':
        return <AlertCircle className="text-amber-400" size={18} />;
    }
  };

  const getStatusBg = (status: OfficialStatus) => {
    if (status === 'OK') return 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200';
    if (status === 'Not provided') return 'bg-slate-800 border-slate-600 text-slate-300';
    if (status === 'Expiry date needed') return 'bg-amber-900/30 border-amber-500/30 text-amber-200';
    return 'bg-red-900/30 border-red-500/30 text-red-200'; // Blocking/Missing/Expired
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-lg font-semibold text-slate-100">{t.checklistTitle}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">{t.document}</th>
              <th className="px-4 py-3 font-medium">{t.type}</th>
              <th className="px-4 py-3 font-medium min-w-[200px]">{t.matchedFile}</th>
              <th className="px-4 py-3 font-medium">{t.expiryDate}</th>
              <th className="px-4 py-3 font-medium text-right">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {evaluatedRequirements.map((er) => {
              const req = er.requirement;
              const title = language === 'en' ? req.title_en : req.title_bn;
              const availableFiles = getAvailableFiles(req.id, er.matchedFileId);
              
              return (
                <tr key={req.id} className="hover:bg-slate-750/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-300">{req.order}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{title}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{req.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${req.mandatory ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                      {req.mandatory ? t.mandatory : t.optional}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={er.matchedFileId || ''}
                        onChange={(e) => onMatchChange(req.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none"
                      >
                        <option value="">{t.selectFile}</option>
                        {availableFiles.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.pageCount} {t.pages})
                          </option>
                        ))}
                      </select>
                      {er.matchedFileId && (
                        <button 
                          onClick={() => onMatchChange(req.id, '')}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          title={t.unmatch}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {req.has_expiry && er.matchedFileId ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Calendar size={14} />
                        </div>
                        <input
                          type="date"
                          value={er.expiryDate || ''}
                          onChange={(e) => onExpiryChange(req.id, e.target.value)}
                          className={`bg-slate-900 border text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 p-1.5 outline-none ${!er.expiryDate ? 'border-amber-500/50 text-amber-200' : 'border-slate-700 text-slate-200'}`}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic">
                        {req.has_expiry ? t.statusMissing : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${getStatusBg(er.status)}`}>
                        {getStatusIcon(er.status)}
                        <span className="whitespace-nowrap">{getStatusText(er.status, language)}</span>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
