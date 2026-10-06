import { useRef, useState } from 'react';
import type { Language, UploadedFile, EvaluatedRequirement } from '../types';
import { translations } from '../i18n/translations';
import { inspectPdfFile } from '../utils/pdf';
import { extractTextFromPdfBuffer, detectExpiryDate } from '../utils/pdfText';
import { calculateSHA256 } from '../utils/crypto';
import { UploadCloud, FileIcon, Trash2, AlertTriangle, FileWarning } from 'lucide-react';

interface DropzoneProps {
  language: Language;
  files: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
}

const MAX_FILES = 30;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

export function PDFUploaderDropzone({ language, files, onFilesAdded }: DropzoneProps) {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalCurrentSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    const validFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length !== newFiles.length) {
      setErrorMsg(t.invalidPdf);
    }

    if (files.length + validFiles.length > MAX_FILES) {
      setErrorMsg(`You can only upload up to ${MAX_FILES} files.`);
      setIsProcessing(false);
      return;
    }

    const newSize = validFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalCurrentSize + newSize > MAX_TOTAL_SIZE) {
      setErrorMsg(`Total file size cannot exceed 50 MB.`);
      setIsProcessing(false);
      return;
    }

    const processedFiles: UploadedFile[] = [];

    for (const file of validFiles) {
      let isCorrupted = false;
      let errorMessage = undefined;
      let pageCount = 0;
      let hash = '';
      let pdfText = undefined;
      let detectedExpiryDate = undefined;
      let rawBytes: Uint8Array = new Uint8Array();

      try {
        const result = await inspectPdfFile(file);
        rawBytes = new Uint8Array(result.rawBytes);
        hash = await calculateSHA256(rawBytes.buffer);
        
        try {
          const pdfJsBytes = new Uint8Array(rawBytes);
          const extracted = await extractTextFromPdfBuffer(pdfJsBytes);
          pageCount = extracted.pageCount;
          
          if (extracted.fullText) {
            pdfText = extracted.fullText;
            const expiry = detectExpiryDate(pdfText);
            if (expiry) {
              detectedExpiryDate = expiry;
            }
          }
        } catch (e: any) {
          throw new Error(e.message || t.fileCorrupted);
        }
      } catch (err: any) {
        isCorrupted = true;
        errorMessage = err.message || t.fileCorrupted;
      }

      processedFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        isCorrupted,
        errorMessage,
        pageCount,
        hash,
        isDuplicate: false,
        rawBytes: isCorrupted ? undefined : rawBytes,
        pdfText,
        detectedExpiryDate
      });
    }

    onFilesAdded(processedFiles);
    setIsProcessing(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{t.uploadTitle}</h2>
        <p className="text-sm text-slate-500 mt-1">Add the PDFs you want to include in this tender package.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
        </div>
      )}

      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
          isProcessing 
            ? 'border-slate-200 bg-slate-50 opacity-70 pointer-events-none' 
            : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 mb-3 text-blue-600">
          <UploadCloud size={24} />
        </div>
        <p className="text-slate-700 font-medium mb-1">
          {isProcessing ? t.processing : (
            <>
              {t.dropzoneText} <span className="text-blue-600 underline decoration-blue-200 underline-offset-4">{t.dropzoneBrowse}</span>
            </>
          )}
        </p>
        <p className="text-sm text-slate-500">PDF only &middot; Up to 30 files &middot; 50 MB limit</p>
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept=".pdf,application/pdf" 
          className="hidden" 
          onChange={(e) => handleFiles(e.target.files)} 
        />
      </div>

      {files.length > 0 && (
        <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden divide-x divide-slate-200">
          <div className="flex flex-col items-center flex-1 p-3">
            <span className="text-lg font-bold text-slate-800">{files.length}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PDFs</span>
          </div>
          <div className="flex flex-col items-center flex-1 p-3">
            <span className="text-lg font-bold text-slate-800">{files.reduce((a, f) => a + (f.isCorrupted ? 0 : f.pageCount), 0)}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pages</span>
          </div>
          <div className="flex flex-col items-center flex-1 p-3">
            <span className={`text-lg font-bold ${files.some(f => f.isDuplicate) ? 'text-amber-600' : 'text-slate-800'}`}>
              {files.filter(f => f.isDuplicate).length}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${files.some(f => f.isDuplicate) ? 'text-amber-600' : 'text-slate-500'}`}>
              Duplicates
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


interface TableProps {
  language: Language;
  files: UploadedFile[];
  evaluatedRequirements: EvaluatedRequirement[];
  onFileRemoved: (fileId: string) => void;
}

export function PDFReviewTable({ language, files, evaluatedRequirements, onFileRemoved }: TableProps) {
  const t = translations[language];

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Uploaded Documents</h2>
        <p className="text-sm text-slate-500 mt-1">Review all processed files and their matched requirements.</p>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-5/12">File</th>
                <th className="px-4 py-3 w-1/12 text-center">Pages</th>
                <th className="px-4 py-3 w-4/12">Matched Requirement</th>
                <th className="px-4 py-3 w-2/12 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-sm">
              {files.map(f => {
                const reqMatch = evaluatedRequirements?.find(er => er.matchedFile?.id === f.id);
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${f.isCorrupted ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                          {f.isCorrupted ? <FileWarning size={16} /> : <FileIcon size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate max-w-[240px]" title={f.name}>{f.name}</p>
                          {f.isCorrupted ? (
                            <p className="text-xs text-red-600 truncate mt-0.5">{f.errorMessage}</p>
                          ) : (
                            <p className="text-xs text-slate-500 mt-0.5">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-center font-medium">{f.isCorrupted ? '-' : f.pageCount}</td>
                    <td className="px-4 py-3">
                      {reqMatch ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-800 font-medium text-sm truncate max-w-[220px]" title={language === 'en' ? reqMatch.requirement.title_en : reqMatch.requirement.title_bn}>
                            {language === 'en' ? reqMatch.requirement.title_en : reqMatch.requirement.title_bn}
                          </span>
                          <span className="text-xs mt-0.5">
                            {reqMatch.status === 'OK' ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tight">✓ Mapped</span>
                            ) : (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-tight">⚠ Issue</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px] uppercase bg-slate-50 px-2 py-1 rounded">Unmatched</span>
                      )}
                      {f.isDuplicate && (
                        <span className="inline-block mt-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wider" title={t.duplicateWarning}>
                          Duplicate Content
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onFileRemoved(f.id); }}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors focus:opacity-100"
                        title={t.removeFile}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="sm:hidden divide-y divide-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
          {files.map(f => {
            const reqMatch = evaluatedRequirements?.find(er => er.matchedFile?.id === f.id);
            return (
              <div key={f.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg shrink-0 ${f.isCorrupted ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                      {f.isCorrupted ? <FileWarning size={16} /> : <FileIcon size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate" title={f.name}>{f.name}</p>
                      {f.isCorrupted ? (
                        <p className="text-xs text-red-600 truncate mt-0.5">{f.errorMessage}</p>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{f.pageCount} {t.pages}</span>
                          <span>•</span>
                          <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => onFileRemoved(f.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="pl-12">
                  {reqMatch ? (
                     <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                       <span className="truncate font-medium text-slate-700">{language === 'en' ? reqMatch.requirement.title_en : reqMatch.requirement.title_bn}</span>
                     </p>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium uppercase mt-1 bg-slate-50 inline-block px-1.5 py-0.5 rounded">Unmatched</p>
                  )}
                  {f.isDuplicate && (
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-1.5 inline-block bg-amber-50 px-1.5 py-0.5 rounded">Duplicate Content</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
