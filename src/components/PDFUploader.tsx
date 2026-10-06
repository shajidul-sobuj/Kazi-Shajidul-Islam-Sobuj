import { useRef, useState } from 'react';
import type { Language, UploadedFile } from '../types';
import { translations } from '../i18n/translations';
import { inspectPdfFile } from '../utils/pdf';
import { calculateSHA256 } from '../utils/crypto';
import { UploadCloud, FileIcon, Trash2, AlertTriangle, FileWarning } from 'lucide-react';

interface Props {
  language: Language;
  files: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemoved: (fileId: string) => void;
}

export function PDFUploader({ language, files, onFilesAdded, onFileRemoved }: Props) {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    
    const processedFiles: UploadedFile[] = [];
    let hasNonPdf = false;

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        hasNonPdf = true;
        continue; // reject non-pdf
      }

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

    if (hasNonPdf) {
      setErrorMsg(t.nonPdfRejected);
    }

    onFilesAdded(processedFiles);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-5 shadow-sm border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">{t.uploadPdfTitle}</h3>
      
      {errorMsg && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded mb-4 flex items-start gap-2">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}
      
      <div 
        className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:bg-slate-700/50 transition-colors cursor-pointer mb-4"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="mx-auto text-blue-400 mb-2" size={32} />
        <p className="font-medium text-slate-200">{isProcessing ? 'Processing files...' : t.dropzoneText}</p>
        <p className="text-sm text-slate-400 mt-1">{t.dropzoneSubtext}</p>
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
          <h4 className="text-sm font-semibold text-slate-300 mb-2">{t.uploadedFilesCount} ({files.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-slate-900 p-2.5 rounded border border-slate-700">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded ${f.isCorrupted ? 'bg-red-900/50 text-red-400' : 'bg-slate-800 text-blue-400'}`}>
                    {f.isCorrupted ? <FileWarning size={16} /> : <FileIcon size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate" title={f.name}>{f.name}</p>
                    {f.isCorrupted ? (
                      <p className="text-xs text-red-400 truncate">{f.errorMessage}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{f.pageCount} {t.pages}</span>
                        <span>•</span>
                        <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {f.isDuplicate && (
                    <span className="text-[10px] font-bold bg-amber-900/60 text-amber-300 px-2 py-1 rounded border border-amber-700/50 uppercase whitespace-nowrap" title={t.duplicateWarning}>
                      {t.duplicateBadge}
                    </span>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onFileRemoved(f.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
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
