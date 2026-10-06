export type Language = 'en' | 'bn';

export interface TenderMetadata {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // YYYY-MM-DD
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface RequirementsData {
  tender: TenderMetadata;
  requirements: Requirement[];
}

export interface UploadedFile {
  id: string; // unique internal id
  name: string;
  size: number;
  pageCount: number;
  hash: string; // sha-256
  file: File;
  rawBytes: Uint8Array;
  isDuplicate: boolean;
  duplicateGroup?: string;
  isCorrupted?: boolean;
  errorMessage?: string;
  pdfText?: string;
  detectedExpiryDate?: string;
}

export type OfficialStatus =
  | 'Missing'
  | 'Expiry date needed'
  | 'Expired'
  | 'Not provided'
  | 'OK';

export interface EvaluatedRequirement {
  requirement: Requirement;
  matchedFileId?: string;
  matchedFile?: UploadedFile;
  expiryDate?: string; // YYYY-MM-DD
  status: OfficialStatus;
  isBlocking: boolean;
  blockReason?: string;
}

export interface PackageGenerationProgress {
  status: 'idle' | 'generating' | 'success' | 'error';
  message: string;
  progressPercent: number;
  downloadUrl?: string;
  filename?: string;
}
