import type { Language, OfficialStatus } from '../types';

export const translations = {
  en: {
    appTitle: 'Tender Package Builder',
    appSubtitle: 'Automated verification, compliance audit & PDF bundling system',
    tenderDetails: 'Tender Details',
    tenderId: 'Tender ID',
    title: 'Tender Title',
    procuringEntity: 'Procuring Entity',
    bidder: 'Bidder Name',
    submissionDeadline: 'Submission Deadline',
    loadRequirements: 'Load requirements.json',
    uploadPrompt: 'Upload requirements.json or drop here',
    uploadJsonHelper: 'JSON file containing tender parameters and document specifications',
    quickLoadSample: 'Load Sample Pack',
    
    // Overview / Readiness
    readinessTitle: 'Tender Submission Readiness',
    requirementsTotal: 'Total Requirements',
    requirementsSatisfied: 'Requirements Met',
    blockingIssues: 'Blocking Issues',
    overallStatus: 'Readiness State',
    readyToGenerate: 'Ready to Package',
    blockedByIssues: 'Blocked by Compliance Errors',

    // PDF Upload
    uploadPdfTitle: 'Upload Tender Documents (PDFs)',
    dropzoneText: 'Drag & drop PDF files here, or click to browse',
    dropzoneSubtext: 'Upload up to 30 PDF files (Max 50MB total). Non-PDFs will be rejected.',
    uploadedFilesCount: 'Uploaded Files',
    removeFile: 'Remove',
    duplicateBadge: 'Duplicate File',
    duplicateWarning: 'Identical file content detected. Duplicate files cannot be assigned to different requirements.',
    pages: 'pages',
    nonPdfRejected: 'Rejected non-PDF file: Only PDF documents are permitted.',
    fileCorrupted: 'Unreadable or password protected PDF.',

    // Checklist
    checklistTitle: 'Mandatory & Optional Document Checklist',
    order: 'Order',
    document: 'Document',
    type: 'Type',
    mandatory: 'Mandatory',
    optional: 'Optional',
    hasExpiry: 'Requires Expiry Date',
    matchedFile: 'Assigned PDF',
    selectFile: '-- Select PDF File --',
    unmatch: 'Unassign',
    expiryDate: 'Expiry Date',
    status: 'Status',
    actions: 'Actions',
    autoMatchBtn: 'Smart Auto-Match',
    autoMatchDesc: 'Auto-map files by keyword matching',
    exportCsvBtn: 'Export CSV Audit',

    // Statuses
    statusMissing: 'Missing',
    statusExpiryNeeded: 'Expiry date needed',
    statusExpired: 'Expired',
    statusNotProvided: 'Not provided',
    statusOk: 'OK',

    // Generation
    generatePackageBtn: 'Generate Tender Package',
    generating: 'Generating PDF Package...',
    downloadPackage: 'Download Package',
    includeIndexPage: 'Include Document Index Page (Table of Contents)',
    packageGeneratedSuccess: 'Package generated successfully!',
    blockingNoticeTitle: 'Package Generation Disabled',
    blockingNoticeDesc: 'Resolve the following compliance issues before generating the package:',

    // Language toggle
    langToggle: 'বাংলা',
  },
  bn: {
    appTitle: 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    appSubtitle: 'স্বয়ংক্রিয় যাচাইকরণ, কমপ্লায়েন্স অডিট এবং পিডিএফ প্যাকেজ প্রস্তুতকরণ',
    tenderDetails: 'টেন্ডারের বিবরণ',
    tenderId: 'টেন্ডার আইডি',
    title: 'টেন্ডারের শিরোনাম',
    procuringEntity: 'ক্রয়কারী প্রতিষ্ঠান',
    bidder: 'দরদাতা প্রতিষ্ঠান',
    submissionDeadline: 'জমা দেওয়ার শেষ সময়',
    loadRequirements: 'requirements.json আপলোড করুন',
    uploadPrompt: 'requirements.json ফাইল নির্বাচন করুন বা টেনে আনুন',
    uploadJsonHelper: 'টেন্ডারের প্রয়োজনীয় তথ্যাবলীর JSON ফাইল',
    quickLoadSample: 'নমুনা প্যাক লোড করুন',

    // Overview / Readiness
    readinessTitle: 'টেন্ডার প্রস্তুতির অবস্থা',
    requirementsTotal: 'মোট প্রয়োজনীয় দলিল',
    requirementsSatisfied: 'সফলভাবে পূরণকৃত',
    blockingIssues: 'বাধা সৃষ্টিকারী সমস্যা',
    overallStatus: 'সামগ্রিক অবস্থা',
    readyToGenerate: 'প্যাকেজ তৈরির জন্য প্রস্তুত',
    blockedByIssues: 'ত্রুটির কারণে স্থগিত',

    // PDF Upload
    uploadPdfTitle: 'টেন্ডার ডকুমেন্টস (পিডিএফ) আপলোড',
    dropzoneText: 'পিডিএফ ফাইলগুলো এখানে টেনে আনুন অথবা নির্বাচন করতে ক্লিক করুন',
    dropzoneSubtext: 'সর্বোচ্চ ৩০টি পিডিএফ ফাইল (সর্বোচ্চ ৫০ মেগাবাইট)। পিডিএফ ব্যতীত অন্যান্য ফাইল বাতিল করা হবে।',
    uploadedFilesCount: 'আপলোডকৃত ফাইল',
    removeFile: 'মুছুন',
    duplicateBadge: 'অনুরূপ ডুপ্লিকেট ফাইল',
    duplicateWarning: 'একই বিষয়ের ডুপ্লিকেট ফাইল শনাক্ত হয়েছে। এগুলো আলাদা নথিতে যুক্ত করা যাবে না।',
    pages: 'পৃষ্ঠা',
    nonPdfRejected: 'পিডিএফ ব্যতীত অন্য ফাইল বাতিল করা হয়েছে। শুধুমাত্র পিডিএফ ফাইল গ্রহণযোগ্য।',
    fileCorrupted: 'ফাইলটি নষ্ট বা পাসওয়ার্ড দ্বারা সুরক্ষিত।',

    // Checklist
    checklistTitle: 'প্রয়োজনীয় ও ঐচ্ছিক দলিলের তালিকা',
    order: 'ক্রম',
    document: 'দলিল / সনদপত্র',
    type: 'ধরন',
    mandatory: 'আবশ্যিক',
    optional: 'ঐচ্ছিক',
    hasExpiry: 'মেয়াদ যাচাই প্রয়োজন',
    matchedFile: 'সংযুক্ত পিডিএফ',
    selectFile: '-- পিডিএফ ফাইল নির্বাচন করুন --',
    unmatch: 'বাতিল',
    expiryDate: 'মেয়াদ শেষের তারিখ',
    status: 'অবস্থা',
    actions: 'অ্যাকশন',
    autoMatchBtn: 'স্মার্ট অটো-ম্যাচ',
    autoMatchDesc: 'ফাইলের নাম অনুযায়ী স্বয়ংক্রিয়ভাবে যুক্ত করুন',
    exportCsvBtn: 'CSV অডিট এক্সপোর্ট',

    // Statuses
    statusMissing: 'অনুপস্থিত (Missing)',
    statusExpiryNeeded: 'মেয়াদ উত্তীর্ণের তারিখ প্রয়োজন (Expiry needed)',
    statusExpired: 'মেয়াদ শেষ (Expired)',
    statusNotProvided: 'সরবরাহ করা হয়নি (Not provided)',
    statusOk: 'ঠিক আছে (OK)',

    // Generation
    generatePackageBtn: 'টেন্ডার প্যাকেজ তৈরি করুন',
    generating: 'পিডিএফ প্যাকেজ তৈরি হচ্ছে...',
    downloadPackage: 'প্যাকেজ ডাউনলোড করুন',
    includeIndexPage: 'সূচিপত্র পৃষ্ঠা যুক্ত করুন (Index Page)',
    packageGeneratedSuccess: 'প্যাকেজ সফলভাবে তৈরি হয়েছে!',
    blockingNoticeTitle: 'প্যাকেজ তৈরি সাময়িক স্থগিত',
    blockingNoticeDesc: 'প্যাকেজ তৈরির পূর্বে নিচের ত্রুটিগুলো সমাধান করুন:',

    // Language toggle
    langToggle: 'English',
  },
};

export function getStatusText(status: OfficialStatus, lang: Language): string {
  const t = translations[lang];
  switch (status) {
    case 'Missing':
      return t.statusMissing;
    case 'Expiry date needed':
      return t.statusExpiryNeeded;
    case 'Expired':
      return t.statusExpired;
    case 'Not provided':
      return t.statusNotProvided;
    case 'OK':
      return t.statusOk;
  }
}
