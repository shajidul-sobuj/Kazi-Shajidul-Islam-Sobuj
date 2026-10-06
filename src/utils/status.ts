import { Requirement, UploadedFile, OfficialStatus, EvaluatedRequirement } from '../types';

/**
 * Compare two YYYY-MM-DD date strings safely without timezone shifts.
 * Returns true if expiryDate is strictly before submissionDeadline.
 */
export function isDateExpired(expiryDate: string, submissionDeadline: string): boolean {
  if (!expiryDate || !submissionDeadline) return false;
  // Clean date strings in case of whitespace
  const exp = expiryDate.trim();
  const sub = submissionDeadline.trim();
  return exp < sub;
}

/**
 * Calculate the exact official status for a requirement according to Section 5.
 */
export function calculateRequirementStatus(
  req: Requirement,
  matchedFile: UploadedFile | undefined,
  expiryDate: string | undefined,
  submissionDeadline: string
): { status: OfficialStatus; isBlocking: boolean; blockReason?: string } {
  // Case 1: No file matched
  if (!matchedFile) {
    if (req.mandatory) {
      return {
        status: 'Missing',
        isBlocking: true,
        blockReason: 'Mandatory document has no matched file.',
      };
    } else {
      return {
        status: 'Not provided',
        isBlocking: false,
      };
    }
  }

  // File is matched
  if (req.has_expiry) {
    if (!expiryDate || expiryDate.trim() === '') {
      return {
        status: 'Expiry date needed',
        isBlocking: true,
        blockReason: 'Document requires an expiry date to be verified.',
      };
    }

    if (isDateExpired(expiryDate, submissionDeadline)) {
      return {
        status: 'Expired',
        isBlocking: true,
        blockReason: `Document expired on ${expiryDate}, before submission deadline ${submissionDeadline}.`,
      };
    }
  }

  return {
    status: 'OK',
    isBlocking: false,
  };
}

/**
 * Evaluate all requirements with matched files, duplicate constraints, and expiry dates.
 */
export function evaluateAllRequirements(
  requirements: Requirement[],
  matches: Record<string, string>, // reqId -> fileId
  expiryDates: Record<string, string>, // reqId -> YYYY-MM-DD
  files: UploadedFile[],
  submissionDeadline: string
): EvaluatedRequirement[] {
  // Sort requirements strictly by order
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  const fileMap = new Map<string, UploadedFile>(files.map((f) => [f.id, f]));

  return sortedReqs.map((req) => {
    const fileId = matches[req.id];
    const file = fileId ? fileMap.get(fileId) : undefined;
    const expiry = expiryDates[req.id];

    const { status, isBlocking, blockReason } = calculateRequirementStatus(
      req,
      file,
      expiry,
      submissionDeadline
    );

    return {
      requirement: req,
      matchedFileId: fileId,
      matchedFile: file,
      expiryDate: expiry,
      status,
      isBlocking,
      blockReason,
    };
  });
}
