import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

export async function extractTextFromPdfBuffer(data: Uint8Array): Promise<{ fullText: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return { fullText, pageCount: pdf.numPages };
  } catch (error: any) {
    console.error('PDF text extraction failed', error);
    // If it fails to parse completely, we still want to let it pass if it's a valid PDF structurally (scanned).
    // But if pdf.js can't open it at all, we might have 0 pages.
    throw new Error(error.message || 'PDF could not be parsed by pdf.js');
  }
}

export function detectExpiryDate(text: string): string | null {
  if (!text || text.trim().length === 0) return null;
  
  // Clean up excessive whitespace
  const normalizedText = text.replace(/\s+/g, ' ');
  
  // 1. Look for explicit keyword phrases
  const keywords = [
    'VALID UNTIL (EXPIRY DATE)',
    'VALID UNTIL',
    'EXPIRY DATE',
    'EXPIRY',
    'VALID THROUGH',
    'VALID UP TO',
    'VALID TILL',
    'EXPIRES ON',
    'EXPIRATION DATE'
  ];
  
  const dateRegexes = [
    // YYYY-MM-DD
    /\b(20[2-9]\d-[0-1]\d-[0-3]\d)\b/i,
    // DD MMMM YYYY (e.g. 30 June 2027)
    /\b([0-3]?\d\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20[2-9]\d)\b/i,
    // DD/MM/YYYY or DD-MM-YYYY
    /\b([0-3]\d[\/\-][0-1]\d[\/\-]20[2-9]\d)\b/i
  ];

  // Search for the closest date after a keyword
  for (const keyword of keywords) {
    const keywordIndex = normalizedText.toUpperCase().indexOf(keyword.toUpperCase());
    if (keywordIndex !== -1) {
      // Extract the substring after the keyword to look for a date
      const textAfterKeyword = normalizedText.substring(keywordIndex, keywordIndex + 100); // look ahead 100 chars
      
      for (const dRegex of dateRegexes) {
        const match = textAfterKeyword.match(dRegex);
        if (match) {
          return standardizeDate(match[1]);
        }
      }
    }
  }

  return null;
}

function standardizeDate(dateStr: string): string {
  // YYYY-MM-DD is already fine
  if (/^20\d\d-[0-1]\d-[0-3]\d$/.test(dateStr)) {
    return dateStr;
  }
  
  // DD/MM/YYYY or DD-MM-YYYY
  const partsMatch = dateStr.match(/^([0-3]\d)[\/\-]([0-1]\d)[\/\-](20\d\d)$/);
  if (partsMatch) {
    return `${partsMatch[3]}-${partsMatch[2]}-${partsMatch[1]}`;
  }
  
  // Parse generic JS date string (like "30 June 2027")
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const d = parsed.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  return dateStr;
}
