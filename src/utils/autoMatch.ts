import { Requirement, UploadedFile } from '../types';

/**
 * Clean and tokenize a string for fuzzy matching.
 */
function tokenize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['pdf', 'and', 'the', 'for', 'ltd'].includes(w));
}

/**
 * Suggest optimal file matches for requirements based on filename heuristics.
 * Respects 1-to-1 matching and avoids assigning duplicate files.
 */
export function suggestAutoMatches(
  requirements: Requirement[],
  files: UploadedFile[],
  currentMatches: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = { ...currentMatches };
  const assignedFileIds = new Set<string>(Object.values(currentMatches));
  const assignedHashes = new Set<string>();

  // Track hashes already used
  files.forEach((f) => {
    if (assignedFileIds.has(f.id)) {
      assignedHashes.add(f.hash);
    }
  });

  // Filter out corrupted files and already assigned files/hashes
  const availableFiles = files.filter(
    (f) => !f.isCorrupted && !assignedFileIds.has(f.id) && !assignedHashes.has(f.hash)
  );

  // Score matrix between unmatched requirements and available files
  requirements
    .filter((r) => !result[r.id])
    .sort((a, b) => a.order - b.order)
    .forEach((req) => {
      const reqTokens = tokenize(req.title_en);
      let bestFile: UploadedFile | null = null;
      let highestScore = 0;

      for (const file of availableFiles) {
        if (assignedFileIds.has(file.id) || assignedHashes.has(file.hash)) continue;

        const fileTokens = tokenize(file.name);
        let score = 0;

        for (const rToken of reqTokens) {
          for (const fToken of fileTokens) {
            if (fToken === rToken) {
              score += 3;
            } else if (fToken.includes(rToken) || rToken.includes(fToken)) {
              score += 1.5;
            }
          }
        }

        // Slight bonus if filename matches order prefix like "01_", "02_"
        const orderPrefix = req.order.toString().padStart(2, '0');
        if (file.name.startsWith(orderPrefix)) {
          score += 2;
        }

        if (score > highestScore && score >= 2) {
          highestScore = score;
          bestFile = file;
        }
      }

      if (bestFile) {
        result[req.id] = (bestFile as UploadedFile).id;
        assignedFileIds.add((bestFile as UploadedFile).id);
        assignedHashes.add((bestFile as UploadedFile).hash);
      }
    });

  return result;
}
