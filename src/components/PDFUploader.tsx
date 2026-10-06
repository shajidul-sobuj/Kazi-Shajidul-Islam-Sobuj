import { useRef, useState } from 'react';
import type { Language, UploadedFile } from '../types';
import { translations } from '../i18n/translations';
import { inspectPdfFile } from '../utils/pdf';
import { calculateSHA256 } from '../utils/crypto';
import { UploadCloud, FileIcon, Trash2, AlertTriangle, FileWarning, CopyPlus } from 'lucide-react';

interface Props {
  language: Language;
  files: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemoved: (fileId: string) => void;
}

const MAX_FILES = 30;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

export function PDFUploader({ language, files, onFilesAdded, onFileRemoved }: Props) {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalCurrentSize = files.reduce((acc, f) => acc + f.size, 0);

  const handleFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    
    const processedFiles: UploadedFile[] = [];
    let hasNonPdf = false;
    let sizeExceeded = false;
    let countExceeded = false;

    let incomingSize = 0;

    for (let i = 0; i < newFiles.length; i++) {
      if (files.length + processedFiles.length >= MAX_FILES) {
        countExceeded = true;
        break;
      }

      const file = newFiles[i];
      
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        hasNonPdf = true;
        continue;
      }

      if (totalCurrentSize + incomingSize + file.size > MAX_TOTAL_SIZE) {
        sizeExceeded = true;
        break;
      }

      incomingSize += file.size;

      const id = Math.random().toString(36).substring(2, 10) + Date.now();
      let pageCount = 0;
      let hash = '';
      let rawBytes = new Uint8Array(0);
      let isCorrupted = false;
      let errorMessage = undefined;

      try {
        const result = await inspectPdfFile(file);
        pageCount = result.pageCount;
        rawBytes = result.rawBytes as any;
        hash = await calculateSHA256(rawBytes.buffer);
      } catch (err: any) {
        isCorrupted = true;
        errorMessage = err.message || t.fileCorrupted;
      }

      processedFiles.push({
        id,
        name: file.name,
        size: file.size,
        pageCount,
        hash,
        file,
        rawBytes,
        isDuplicate: false,
        isCorrupted,
        errorMessage
      });
    }

    if (countExceeded) {
      setErrorMsg(t.fileCountLimit);
    } else if (sizeExceeded) {
      setErrorMsg(t.fileSizeLimit);
    } else if (hasNonPdf) {
      setErrorMsg(t.nonPdfRejected);
    }

    onFilesAdded(processedFiles);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <CopyPlus size={18} className="text-slate-400" />
        {t.uploadPdfTitle}
      </h3>
      
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}
      
      <div 
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer mb-5"
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!isProcessing) handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className={`mx-auto mb-3 ${isProcessing ? 'text-slate-300 animate-pulse' : 'text-blue-500'}`} size={32} />
        <p className="font-medium text-slate-700">
          {isProcessing ? 'Processing files...' : (
            <>
              {t.dropzoneText} <span className="text-blue-600">{t.dropzoneBrowse}</span>
            </>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-1.5">{t.dropzoneSubtext}</p>
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
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-slate-700">{t.uploadedFilesCount}</h4>
            <span className="text-xs font-medium text-slate-500">{files.length} / {MAX_FILES}</span>
          </div>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 group hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-md ${f.isCorrupted ? 'bg-red-100 text-red-600' : 'bg-white border border-slate-200 text-blue-600 shadow-sm'}`}>
                    {f.isCorrupted ? <FileWarning size={16} /> : <FileIcon size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate" title={f.name}>{f.name}</p>
                    {f.isCorrupted ? (
                      <p className="text-xs text-red-600 truncate mt-0.5">{f.errorMessage}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{f.pageCount} {t.pages}</span>
                        <span className="text-slate-300">•</span>
                        <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {f.isDuplicate && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wide" title={t.duplicateWarning}>
                      {t.duplicateBadge}
                    </span>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onFileRemoved(f.id); }}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title={t.removeFile}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
