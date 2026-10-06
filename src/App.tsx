import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { JSONLoader } from './components/JSONLoader';
import { PDFUploader } from './components/PDFUploader';
import { Checklist } from './components/Checklist';
import type { Language, RequirementsData, UploadedFile, PackageGenerationProgress } from './types';
import { evaluateAllRequirements } from './utils/status';
import { suggestAutoMatches } from './utils/autoMatch';
import { exportChecklistCsv } from './utils/csv';
import { generateTenderPackagePdf } from './utils/pdf';
import { translations } from './i18n/translations';
import { FileDown, Download, CheckCircle2, AlertTriangle, Wand2, FileSpreadsheet } from 'lucide-react';
import './App.css';

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [tenderData, setTenderData] = useState<RequirementsData | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [includeIndex, setIncludeIndex] = useState(false);
  const [genStatus, setGenStatus] = useState<PackageGenerationProgress>({ status: 'idle', message: '', progressPercent: 0 });

  const t = translations[language];

  // Re-evaluate duplicates whenever files change
  useEffect(() => {
    const hashCounts = new Map<string, number>();
    files.forEach(f => {
      if (!f.isCorrupted && f.hash) {
        hashCounts.set(f.hash, (hashCounts.get(f.hash) || 0) + 1);
      }
    });

    setFiles(prevFiles => prevFiles.map(f => {
      if (!f.isCorrupted && f.hash && (hashCounts.get(f.hash) || 0) > 1) {
        return { ...f, isDuplicate: true };
      }
      return { ...f, isDuplicate: false };
    }));
  }, [files.length]); // Simple dependency, might need refinement if file contents change but lengths don't

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemoved = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    // Remove from matches if matched
    setMatches(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(reqId => {
        if (next[reqId] === fileId) delete next[reqId];
      });
      return next;
    });
  };

  const handleMatchChange = (reqId: string, fileId: string) => {
    setMatches(prev => {
      const next = { ...prev };
      if (!fileId) {
        delete next[reqId];
      } else {
        next[reqId] = fileId;
      }
      return next;
    });
  };

  const handleExpiryChange = (reqId: string, date: string) => {
    setExpiryDates(prev => ({ ...prev, [reqId]: date }));
  };

  const handleAutoMatch = () => {
    if (!tenderData) return;
    const newMatches = suggestAutoMatches(tenderData.requirements, files, matches);
    setMatches(newMatches);
  };

  const evaluatedRequirements = useMemo(() => {
    if (!tenderData) return [];
    return evaluateAllRequirements(
      tenderData.requirements,
      matches,
      expiryDates,
      files,
      tenderData.tender.submission_deadline
    );
  }, [tenderData, matches, expiryDates, files]);

  const blockingIssues = evaluatedRequirements.filter(er => er.isBlocking);
  const isReady = tenderData && blockingIssues.length === 0;
  const satisfiedCount = evaluatedRequirements.filter(er => er.status === 'OK' || er.status === 'Not provided').length;

  const handleGenerate = async () => {
    if (!tenderData || !isReady) return;
    setGenStatus({ status: 'generating', message: t.generating, progressPercent: 10 });
    
    try {
      const pdfBytes = await generateTenderPackagePdf({
        tender: tenderData.tender,
        evaluatedRequirements,
        includeIndexPage: includeIndex,
        onProgress: (percent, msg) => setGenStatus({ status: 'generating', message: msg, progressPercent: percent })
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const filename = `${tenderData.tender.tender_id}_Package.pdf`;

      setGenStatus({ status: 'success', message: t.packageGeneratedSuccess, progressPercent: 100, downloadUrl: url, filename });
      
      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      setGenStatus({ status: 'error', message: err.message || 'Error generating PDF.', progressPercent: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {!tenderData ? (
          <div className="max-w-2xl mx-auto mt-12">
            <JSONLoader language={language} onDataLoaded={setTenderData} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Tender Overview Card */}
                <div className="bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-900/50 text-blue-300 text-xs font-bold px-2 py-0.5 rounded border border-blue-800 uppercase">{tenderData.tender.tender_id}</span>
                      <h2 className="text-xl font-bold text-slate-100">{tenderData.tender.title}</h2>
                    </div>
                    <div className="text-sm text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3">
                      <p><strong className="text-slate-300">{t.procuringEntity}:</strong> {tenderData.tender.procuring_entity}</p>
                      <p><strong className="text-slate-300">{t.bidder}:</strong> {tenderData.tender.bidder}</p>
                      <p><strong className="text-slate-300">{t.submissionDeadline}:</strong> <span className="text-amber-400 font-medium">{tenderData.tender.submission_deadline}</span></p>
                    </div>
                  </div>
                  
                  {/* Circular Progress or Readiness Badge */}
                  <div className="shrink-0 text-right bg-slate-900/50 p-3 rounded-lg border border-slate-700 w-full sm:w-auto">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{t.overallStatus}</p>
                    {isReady ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 /> <span>{t.readyToGenerate}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <AlertTriangle /> <span>{t.blockedByIssues}</span>
                      </div>
                    )}
                    <div className="mt-2 text-sm">
                      <span className="text-slate-300">{t.requirementsSatisfied}: </span>
                      <span className="font-bold text-slate-100">{satisfiedCount} / {tenderData.requirements.length}</span>
                    </div>
                  </div>
                </div>

                <PDFUploader 
                  language={language}
                  files={files}
                  onFilesAdded={handleFilesAdded}
                  onFileRemoved={handleFileRemoved}
                />

                <Checklist 
                  language={language}
                  evaluatedRequirements={evaluatedRequirements}
                  files={files}
                  onMatchChange={handleMatchChange}
                  onExpiryChange={handleExpiryChange}
                />
              </div>

              {/* Sidebar Action Panel */}
              <div className="space-y-6">
                
                <div className="bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-700 sticky top-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">{t.actions}</h3>
                  
                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={handleAutoMatch}
                      className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2.5 rounded shadow-sm transition-colors font-medium border border-slate-600"
                    >
                      <Wand2 size={18} className="text-purple-400" />
                      <span>{t.autoMatchBtn}</span>
                    </button>
                    
                    <button 
                      onClick={() => exportChecklistCsv(tenderData.tender, evaluatedRequirements)}
                      className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2.5 rounded shadow-sm transition-colors font-medium border border-slate-600"
                    >
                      <FileSpreadsheet size={18} className="text-emerald-400" />
                      <span>{t.exportCsvBtn}</span>
                    </button>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-700/50 rounded transition-colors text-sm text-slate-300 select-none">
                      <input 
                        type="checkbox" 
                        checked={includeIndex} 
                        onChange={(e) => setIncludeIndex(e.target.checked)}
                        className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-900"
                      />
                      <span>{t.includeIndexPage}</span>
                    </label>
                  </div>

                  <hr className="border-slate-700 mb-6" />

                  {blockingIssues.length > 0 ? (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                      <h4 className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
                        <AlertTriangle size={16} />
                        {t.blockingNoticeTitle}
                      </h4>
                      <p className="text-xs text-red-300/80 mb-3">{t.blockingNoticeDesc}</p>
                      <ul className="text-xs space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {blockingIssues.map((issue) => (
                          <li key={issue.requirement.id} className="bg-red-900/40 p-2 rounded border border-red-800/50 text-red-200">
                            <strong>#{issue.requirement.order} {language === 'en' ? issue.requirement.title_en : issue.requirement.title_bn}</strong>: {issue.blockReason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <button
                    onClick={handleGenerate}
                    disabled={!isReady || genStatus.status === 'generating'}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded shadow font-bold transition-all ${
                      isReady 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <FileDown size={20} />
                    <span>{t.generatePackageBtn}</span>
                  </button>

                  {genStatus.status === 'generating' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-blue-300 mb-1">
                        <span>{genStatus.message}</span>
                        <span>{genStatus.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${genStatus.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {genStatus.status === 'success' && genStatus.downloadUrl && (
                    <div className="mt-4 bg-emerald-900/30 border border-emerald-500/30 p-3 rounded-lg text-center">
                      <p className="text-emerald-400 text-sm font-medium mb-2">{genStatus.message}</p>
                      <a 
                        href={genStatus.downloadUrl} 
                        download={genStatus.filename}
                        className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 text-xs font-bold underline"
                      >
                        <Download size={14} /> Click here if download didn't start
                      </a>
                    </div>
                  )}
                  
                  {genStatus.status === 'error' && (
                     <div className="mt-4 bg-red-900/30 border border-red-500/30 p-3 rounded-lg text-center">
                     <p className="text-red-400 text-sm font-medium">{genStatus.message}</p>
                   </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
