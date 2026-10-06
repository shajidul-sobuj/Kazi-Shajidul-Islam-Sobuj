import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { JSONLoader } from './components/JSONLoader';
import { PDFUploaderDropzone, PDFReviewTable } from './components/PDFUploader';
import { Checklist } from './components/Checklist';
import type { Language, RequirementsData, UploadedFile, PackageGenerationProgress } from './types';
import { evaluateAllRequirements } from './utils/status';
import { suggestAutoMatches } from './utils/autoMatch';
import { exportChecklistCsv } from './utils/csv';
import { generateTenderPackagePdf } from './utils/pdf';
import { translations, getStatusText } from './i18n/translations';
import { FileDown, Download, CheckCircle2, AlertTriangle, Wand2, FileSpreadsheet, ListChecks, FileText, XCircle, FolderCheck } from 'lucide-react';
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
  }, [files.length]);

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles(prev => {
      const updatedFiles = [...prev, ...newFiles];
      
      // Auto-match newly added files if tenderData exists
      if (tenderData) {
        setTimeout(() => {
          setMatches(currentMatches => {
            const newMatches = suggestAutoMatches(tenderData.requirements, updatedFiles, currentMatches, tenderData.tender.submission_deadline);
            
            if (Object.keys(newMatches).length > Object.keys(currentMatches).length) {
              setExpiryDates(prevExpiries => {
                const nextExpiries = { ...prevExpiries };
                Object.entries(newMatches).forEach(([reqId, fileId]) => {
                  const file = updatedFiles.find(f => f.id === fileId);
                  if (file && file.detectedExpiryDate && !nextExpiries[reqId]) {
                    nextExpiries[reqId] = file.detectedExpiryDate;
                  }
                });
                return nextExpiries;
              });
              return newMatches;
            }
            return currentMatches;
          });
        }, 0);
      }
      
      return updatedFiles;
    });
  };

  const handleFileRemoved = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
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

    if (fileId) {
      const file = files.find(f => f.id === fileId);
      if (file && file.detectedExpiryDate) {
        setExpiryDates(prev => ({ ...prev, [reqId]: file.detectedExpiryDate! }));
      }
    }
  };

  const handleExpiryChange = (reqId: string, date: string) => {
    setExpiryDates(prev => ({ ...prev, [reqId]: date }));
  };

  const handleAutoMatch = () => {
    if (!tenderData) return;
    const newMatches = suggestAutoMatches(tenderData.requirements, files, matches, tenderData.tender.submission_deadline);
    setMatches(newMatches);

    // Also auto-populate expiry dates for the new matches
    setExpiryDates(prev => {
      const next = { ...prev };
      Object.entries(newMatches).forEach(([reqId, fileId]) => {
        const file = files.find(f => f.id === fileId);
        if (file && file.detectedExpiryDate && !next[reqId]) {
          next[reqId] = file.detectedExpiryDate;
        }
      });
      return next;
    });
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
  const progressPercent = tenderData ? Math.round((satisfiedCount / tenderData.requirements.length) * 100) : 0;

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {!tenderData ? (
          <JSONLoader language={language} onDataLoaded={setTenderData} />
        ) : (
          <>
            {/* Tender Summary Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">{tenderData.tender.tender_id}</span>
                    <h2 className="text-lg font-bold text-white">{tenderData.tender.title}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t.submissionDeadline}</p>
                  <p className="text-amber-400 font-bold text-sm">{tenderData.tender.submission_deadline}</p>
                </div>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-0.5">{t.procuringEntity}</p>
                  <p className="font-medium text-slate-900">{tenderData.tender.procuring_entity}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-0.5">{t.bidder}</p>
                  <p className="font-medium text-slate-900">{tenderData.tender.bidder}</p>
                </div>
              </div>
            </div>

            {/* Readiness Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                
                <div className="flex-1 w-full">
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{t.readinessTitle}</h3>
                  <div className="flex items-center justify-between text-sm mb-1.5 font-medium">
                    <span className="text-slate-600">{satisfiedCount} / {tenderData.requirements.length} {t.requirementsSatisfied}</span>
                    <span className={isReady ? 'text-emerald-600' : 'text-slate-600'}>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[100px]">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <ListChecks size={14} />
                      <span className="text-xs font-semibold uppercase">{t.requirementsTotal}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{tenderData.requirements.length}</p>
                  </div>
                  
                  <div className={`border rounded-lg p-3 min-w-[100px] ${blockingIssues.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${blockingIssues.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      <AlertTriangle size={14} />
                      <span className="text-xs font-semibold uppercase">{t.blockingIssues}</span>
                    </div>
                    <p className={`text-xl font-bold ${blockingIssues.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>{blockingIssues.length}</p>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[100px]">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <FileText size={14} />
                      <span className="text-xs font-semibold uppercase">{t.documentsCount}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{files.length}</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex flex-col gap-8 max-w-5xl mx-auto">
              
              <PDFUploaderDropzone
                language={language}
                files={files}
                onFilesAdded={handleFilesAdded}
              />

              <Checklist 
                language={language}
                evaluatedRequirements={evaluatedRequirements}
                files={files}
                onMatchChange={handleMatchChange}
                onExpiryChange={handleExpiryChange}
              />

              <PDFReviewTable
                language={language}
                files={files}
                evaluatedRequirements={evaluatedRequirements}
                onFileRemoved={handleFileRemoved}
              />

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">{t.actions || 'Package Generation'}</h3>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button 
                    onClick={handleAutoMatch}
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-lg shadow-sm transition-colors font-medium border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <Wand2 size={18} className="text-purple-500" />
                    <span>{t.autoMatchBtn}</span>
                  </button>
                  
                  <button 
                    onClick={() => exportChecklistCsv(tenderData.tender, evaluatedRequirements)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-lg shadow-sm transition-colors font-medium border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <FileSpreadsheet size={18} className="text-emerald-500" />
                    <span>{t.exportCsvBtn}</span>
                  </button>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer mb-6 p-2 hover:bg-slate-50 rounded-lg transition-colors text-sm text-slate-600 select-none border border-transparent w-fit">
                  <input 
                    type="checkbox" 
                    checked={includeIndex} 
                    onChange={(e) => setIncludeIndex(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>{t.includeIndexPage}</span>
                </label>

                <hr className="border-slate-100 mb-6" />

                {blockingIssues.length > 0 ? (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-3">
                      <XCircle size={18} />
                      Resolve {blockingIssues.length} blocking issues to generate the package.
                    </div>
                    <ul className="text-sm space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {blockingIssues.map((issue) => (
                        <li key={issue.requirement.id} className="text-slate-600 flex gap-2">
                          <span className="text-red-500 shrink-0 mt-0.5">•</span>
                          <span>
                            <span className="font-medium text-slate-800">{language === 'en' ? issue.requirement.title_en : issue.requirement.title_bn}</span> 
                            {' — '} {getStatusText(issue.status, language)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                    <p className="text-sm font-medium text-emerald-800">{t.readyToGenerate}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!isReady || genStatus.status === 'generating'}
                  className={`w-full flex flex-col items-center justify-center gap-1 px-4 py-4 rounded-xl shadow-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isReady 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-lg">
                    <FileDown size={24} />
                    <span>{t.generatePackageBtn}</span>
                  </div>
                  {isReady && <span className="text-xs font-medium text-blue-200">Create the final tender PDF package</span>}
                </button>

                {genStatus.status === 'generating' && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-xs text-blue-700 font-medium mb-2">
                      <span>{genStatus.message}</span>
                      <span>{genStatus.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${genStatus.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {genStatus.status === 'success' && genStatus.downloadUrl && (
                  <div className="mt-6 bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="text-emerald-800 text-base font-bold mb-1">Package Ready</p>
                    <p className="text-emerald-600 text-sm mb-4">Your tender package has been generated successfully.</p>
                    <a 
                      href={genStatus.downloadUrl} 
                      download={genStatus.filename}
                      className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-semibold"
                    >
                      <Download size={18} /> {t.downloadPackage}
                    </a>
                  </div>
                )}
                
                {genStatus.status === 'error' && (
                   <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg text-center flex items-center justify-center gap-2">
                   <AlertTriangle className="text-red-500" size={20} />
                   <p className="text-red-700 text-sm font-medium">{genStatus.message}</p>
                 </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-8 py-8 mt-12 border-t border-slate-200 text-slate-500 text-xs">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded shadow-sm">
              <FolderCheck size={14} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-700">Tender Package Builder</span>
            <span>·</span>
            <span>All document processing happens locally in your browser.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026</span>
            <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
