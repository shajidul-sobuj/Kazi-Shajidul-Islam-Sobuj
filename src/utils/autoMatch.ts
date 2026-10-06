import type { Requirement, UploadedFile } from '../types';

const GENERIC_WORDS = new Set([
  'scan', 'document', 'file', 'copy', 'final', 'new', 'old', 
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15',
  'pdf', 'and', 'the', 'for', 'ltd', 'of', 'in', 'to', 'with'
]);

const GENERIC_PREFIXES = /^(?:0[1-9]|[1-9]\d*)\s+/;

function normalizeString(str: string): string {
  let s = str.toLowerCase();
  s = s.replace(/\.pdf$/, '');
  s = s.replace(/[_\-\(\)\[\],;.]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(GENERIC_PREFIXES, '');
  return s.trim();
}

function getTokens(normalizedStr: string): string[] {
  return normalizedStr
    .split(/\s+/)
    .filter(w => w.length > 2 && !GENERIC_WORDS.has(w));
}

function scoreTokens(rTokens: string[], fTokens: string[]): number {
  if (rTokens.length === 0 || fTokens.length === 0) return 0;
  let score = 0;
  let matches = 0;
  
  for (const rToken of rTokens) {
    if (fTokens.includes(rToken)) {
      matches++;
      score += 15; // Stronger exact token match
    } else if (fTokens.some(f => f.includes(rToken) || rToken.includes(f))) {
      matches++;
      score += 5; // Partial match
    }
  }
  
  if (matches === 0) return 0;
  
  const missing = rTokens.length - matches;
  const extra = fTokens.length - matches;
  
  score -= (missing * 8); // Heavy penalty for missing requirement words
  score -= (extra * 4);   // Mild penalty for extra random words
  
  if (matches < Math.ceil(rTokens.length / 2.0)) {
    score -= 20; // Must match at least half of the meaningful words
  }
  
  return score;
}

export function calculateMatchScore(req: Requirement, file: UploadedFile): number {
  const reqEnNorm = normalizeString(req.title_en);
  const reqBnNorm = req.title_bn ? normalizeString(req.title_bn) : '';
  const fileNorm = normalizeString(file.name);

  // 1. Exact Phrase Match
  if (fileNorm === reqEnNorm || (reqBnNorm && fileNorm === reqBnNorm)) {
    return 100;
  }

  // 2. Strong Sub-phrase Match
  if (fileNorm.includes(reqEnNorm) || (reqBnNorm && fileNorm.includes(reqBnNorm))) {
    return 80;
  }

  // 3. Token-based Match
  const fileTokens = getTokens(fileNorm);
  const scoreEn = scoreTokens(getTokens(reqEnNorm), fileTokens);
  const scoreBn = reqBnNorm ? scoreTokens(getTokens(reqBnNorm), fileTokens) : 0;
  
  let baseScore = Math.max(scoreEn, scoreBn);

  // 4. Filename order prefix bonus
  const orderPrefix = req.order.toString().padStart(2, '0');
  if (file.name.startsWith(orderPrefix) || file.name.startsWith(`${orderPrefix}_`) || file.name.startsWith(`${orderPrefix}-`)) {
    baseScore += 15;
  }

  // 5. Level 2 - PDF Content Matching (Semantic Rescue)
  if (file.pdfText) {
    const textNorm = file.pdfText.toLowerCase();
    
    // Exact phrase in text is a massive signal
    if (textNorm.includes(reqEnNorm)) {
      baseScore += 40;
    } else {
      let contentBoost = 0;
      
      // VAT synonyms
      if (reqEnNorm.includes('vat') && (textNorm.includes('vat registration') || textNorm.includes('value added tax') || textNorm.includes('bin'))) {
        contentBoost = Math.max(contentBoost, 30);
      }
      // TIN synonyms
      if (reqEnNorm.includes('tin') && (textNorm.includes('taxpayer identification number') || textNorm.includes('tax identification'))) {
        contentBoost = Math.max(contentBoost, 30);
      }
      // Solvency synonyms
      if (reqEnNorm.includes('solvency') && (textNorm.includes('solvency certificate') || textNorm.includes('financial institution'))) {
        contentBoost = Math.max(contentBoost, 30);
      }
      // Experience synonyms
      if (reqEnNorm.includes('experience') && (textNorm.includes('experience certificate') || textNorm.includes('successfully completed') || textNorm.includes('supplied'))) {
        contentBoost = Math.max(contentBoost, 30);
      }
      // Manufacturer
      if (reqEnNorm.includes('manufacturer') && (textNorm.includes('authorized distributor') || textNorm.includes('authorization'))) {
        contentBoost = Math.max(contentBoost, 30);
      }
      
      baseScore += contentBoost;
    }
  }

  return baseScore;
}

export function suggestAutoMatches(
  requirements: Requirement[],
  files: UploadedFile[],
  currentMatches: Record<string, string>,
  submissionDeadline: string
): Record<string, string> {
  const result: Record<string, string> = { ...currentMatches };
  const assignedFileIds = new Set<string>(Object.values(currentMatches));
  const assignedHashes = new Set<string>();

  files.forEach((f) => {
    if (assignedFileIds.has(f.id)) {
      assignedHashes.add(f.hash);
    }
  });

  const availableFiles = files.filter(
    (f) => !f.isCorrupted && !assignedFileIds.has(f.id) && !assignedHashes.has(f.hash)
  );

  requirements
    .filter((r) => !result[r.id])
    .sort((a, b) => a.order - b.order)
    .forEach((req) => {
      let bestFile: UploadedFile | null = null;
      let highestScore = 0;
      let bestExpiryStr = "";

      for (const file of availableFiles) {
        if (assignedFileIds.has(file.id) || assignedHashes.has(file.hash)) continue;

        const score = calculateMatchScore(req, file);

        // A minimum score of 10 ensures it's a semantic candidate
        if (score >= 10) {
          if (req.has_expiry) {
            if (!file.detectedExpiryDate) continue;
            if (file.detectedExpiryDate < submissionDeadline) continue;
            
            if (bestFile) {
              if (file.detectedExpiryDate > bestExpiryStr) {
                highestScore = score;
                bestFile = file;
                bestExpiryStr = file.detectedExpiryDate;
              } else if (file.detectedExpiryDate === bestExpiryStr && score > highestScore) {
                highestScore = score;
                bestFile = file;
              }
              continue;
            } else {
              highestScore = score;
              bestFile = file;
              bestExpiryStr = file.detectedExpiryDate;
              continue;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            bestFile = file;
          }
        }
      }

      if (bestFile) {
        result[req.id] = bestFile.id;
        assignedFileIds.add(bestFile.id);
        assignedHashes.add(bestFile.hash);
      }
    });

  return result;
}

export function hasCandidateFiles(req: Requirement, files: UploadedFile[]): boolean {
  return files.some(file => {
    if (file.isCorrupted) return false;
    const score = calculateMatchScore(req, file);
    return score >= 10;
  });
}
