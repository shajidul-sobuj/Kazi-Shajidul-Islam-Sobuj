import type { Language, OfficialStatus } from '../types';

export const translations = {
  en: {
    appTitle: 'Tender Package Builder',
    appSubtitle: 'Tender readiness & document compliance',
    tenderDetails: 'Tender Identity',
    tenderId: 'Tender ID',
    title: 'Tender Title',
    procuringEntity: 'Procuring Entity',
    bidder: 'Bidder',
    submissionDeadline: 'Submission deadline',
    loadRequirements: 'Upload requirements.json',
    uploadPrompt: 'Upload requirements.json',
    uploadJsonHelper: 'Load your tender requirements schema to begin.',
    quickLoadSample: 'Load Sample Pack',
    emptyStateTitle: 'Build a complete, validated tender document package in your browser.',
    emptyStep1: 'Upload requirements.json',
    emptyStep2: 'Upload tender PDFs',
    emptyStep3: 'Match & validate',
    emptyStep4: 'Generate package',

    // Overview / Readiness
    readinessTitle: 'Tender Readiness',
    requirementsTotal: 'Requirements',
    requirementsSatisfied: 'Requirements Met',
    blockingIssues: 'Blocking',
    documentsCount: 'Documents',
    overallStatus: 'Ready',
    readyToGenerate: 'Ready to generate',
    blockedByIssues: 'Package not ready',

    // PDF Upload
    uploadPdfTitle: 'Upload Tender Documents',
    dropzoneText: 'Drag & drop PDF files here or',
    dropzoneBrowse: 'Browse PDF files',
    dropzoneSubtext: 'PDF only • Up to 30 files • 50 MB total',
    uploadedFilesCount: 'Uploaded Documents',
    removeFile: 'Remove',
    duplicateBadge: 'Duplicate',
    duplicateWarning: 'Identical file content detected.',
    pages: 'pages',
    nonPdfRejected: 'Only PDF files are supported.',
    fileCorrupted: 'Unable to read this PDF. The file may be damaged or password-protected.',
    fileSizeLimit: 'Maximum upload size is 50 MB.',
    fileCountLimit: 'Maximum of 30 files can be uploaded.',

    // Checklist
    checklistTitle: 'Required Documents',
    checklistSubtitle: 'Match each tender requirement with one PDF and resolve any blocking issues.',
    order: 'Order',
    document: 'Document',
    type: 'Type',
    mandatory: 'REQUIRED',
    optional: 'OPTIONAL',
    hasExpiry: 'Requires Expiry Date',
    matchedFile: 'Assigned PDF',
    selectFile: 'Select PDF file...',
    unmatch: 'Change',
    expiryDate: 'Expiry date:',
    status: 'Status',
    actions: 'Actions',
    autoMatchBtn: 'Smart Auto-Match',
    autoMatchDesc: 'Auto-map files by keyword matching',
    exportCsvBtn: 'Export CSV Audit',

    // Statuses
    statusMissing: 'Missing',
    statusMissingDesc: 'Required document has not been matched.',
    statusExpiryNeeded: 'Expiry date needed',
    statusExpiryNeededDesc: 'Enter the expiry date to continue.',
    statusExpired: 'Expired',
    statusExpiredDesc: 'Document expires before the tender submission deadline.',
    statusNotProvided: 'Not provided',
    statusNotProvidedDesc: 'Optional document was not provided.',
    statusOk: 'OK',
    statusOkDesc: 'Requirement is satisfied.',
    validNotFound: 'Valid document not found — manual selection required.',
    expiredManualRequired: 'Expired — manual selection required.',

    // Generation
    generatePackageBtn: 'Generate Package',
    generating: 'Processing documents...',
    downloadPackage: 'Download Package',
    includeIndexPage: 'Include Document Index Page (Table of Contents)',
    packageGeneratedSuccess: 'Package Ready',
    blockingNoticeTitle: 'issues preventing package generation',
    blockingNoticeDesc: 'Resolve blocking issues to generate the package.',

    // Language toggle
    langToggle: 'বাংলা',
  },
  bn: {
    appTitle: 'টেন্ডার প্যাকেজ বিল্ডার',
    appSubtitle: 'টেন্ডার প্রস্তুতি ও ডকুমেন্ট যাচাইকরণ',
    tenderDetails: 'টেন্ডারের পরিচয়',
    tenderId: 'টেন্ডার আইডি',
    title: 'টেন্ডারের শিরোনাম',
    procuringEntity: 'ক্রয়কারী প্রতিষ্ঠান',
    bidder: 'দরদাতা প্রতিষ্ঠান',
    submissionDeadline: 'জমা দেওয়ার শেষ সময়',
    loadRequirements: 'requirements.json আপলোড করুন',
    uploadPrompt: 'requirements.json আপলোড করুন',
    uploadJsonHelper: 'কাজ শুরু করতে requirements.json আপলোড করুন।',
    quickLoadSample: 'নমুনা প্যাক লোড করুন',
    emptyStateTitle: 'ব্রাউজারেই সম্পূর্ণ ও যাচাইকৃত টেন্ডার প্যাকেজ তৈরি করুন।',
    emptyStep1: 'requirements.json আপলোড করুন',
    emptyStep2: 'টেন্ডারের পিডিএফ আপলোড করুন',
    emptyStep3: 'যাচাই ও ম্যাচ করুন',
    emptyStep4: 'প্যাকেজ তৈরি করুন',

    // Overview / Readiness
    readinessTitle: 'টেন্ডার প্রস্তুতি',
    requirementsTotal: 'প্রয়োজনীয় দলিল',
    requirementsSatisfied: 'পূরণকৃত',
    blockingIssues: 'ত্রুটি',
    documentsCount: 'আপলোডকৃত দলিল',
    overallStatus: 'প্রস্তুত',
    readyToGenerate: 'প্যাকেজ তৈরির জন্য প্রস্তুত',
    blockedByIssues: 'প্যাকেজ প্রস্তুত নয়',

    // PDF Upload
    uploadPdfTitle: 'টেন্ডারের দলিল আপলোড করুন',
    dropzoneText: 'পিডিএফ ফাইলগুলো এখানে টেনে আনুন অথবা',
    dropzoneBrowse: 'ব্রাউজ করুন',
    dropzoneSubtext: 'শুধুমাত্র পিডিএফ • সর্বোচ্চ ৩০টি ফাইল • মোট ৫০ মেগাবাইট',
    uploadedFilesCount: 'আপলোডকৃত ডকুমেন্টস',
    removeFile: 'মুছুন',
    duplicateBadge: 'ডুপ্লিকেট',
    duplicateWarning: 'একই ফাইলের ডুপ্লিকেট শনাক্ত হয়েছে।',
    pages: 'পৃষ্ঠা',
    nonPdfRejected: 'শুধুমাত্র পিডিএফ ফাইল সাপোর্ট করে।',
    fileCorrupted: 'পিডিএফ পড়া যাচ্ছে না। ফাইলটি নষ্ট বা পাসওয়ার্ড দ্বারা সুরক্ষিত হতে পারে।',
    fileSizeLimit: 'সর্বোচ্চ আপলোড সাইজ ৫০ মেগাবাইট।',
    fileCountLimit: 'সর্বোচ্চ ৩০টি ফাইল আপলোড করা যাবে।',

    // Checklist
    checklistTitle: 'প্রয়োজনীয় দলিল',
    checklistSubtitle: 'প্রতিটি দলিলের সাথে একটি পিডিএফ যুক্ত করুন এবং ত্রুটিগুলো সমাধান করুন।',
    order: 'ক্রম',
    document: 'দলিল',
    type: 'ধরন',
    mandatory: 'আবশ্যিক',
    optional: 'ঐচ্ছিক',
    hasExpiry: 'মেয়াদ যাচাই প্রয়োজন',
    matchedFile: 'সংযুক্ত পিডিএফ',
    selectFile: 'পিডিএফ ফাইল নির্বাচন করুন...',
    unmatch: 'পরিবর্তন করুন',
    expiryDate: 'মেয়াদ শেষের তারিখ:',
    status: 'অবস্থা',
    actions: 'অ্যাকশন',
    autoMatchBtn: 'স্মার্ট অটো-ম্যাচ',
    autoMatchDesc: 'ফাইলের নাম অনুযায়ী স্বয়ংক্রিয়ভাবে যুক্ত করুন',
    exportCsvBtn: 'CSV অডিট এক্সপোর্ট',

    // Statuses
    statusMissing: 'অনুপস্থিত',
    statusMissingDesc: 'আবশ্যিক দলিল যুক্ত করা হয়নি।',
    statusExpiryNeeded: 'মেয়াদ উত্তীর্ণের তারিখ প্রয়োজন',
    statusExpiryNeededDesc: 'এগিয়ে যেতে মেয়াদ উত্তীর্ণের তারিখ দিন।',
    statusExpired: 'মেয়াদ শেষ',
    statusExpiredDesc: 'জমা দেওয়ার শেষ তারিখের আগেই মেয়াদ শেষ।',
    statusNotProvided: 'সরবরাহ করা হয়নি',
    statusNotProvidedDesc: 'ঐচ্ছিক দলিল দেওয়া হয়নি।',
    statusOk: 'ঠিক আছে',
    statusOkDesc: 'দলিলটি সঠিক।',
    validNotFound: 'বৈধ ডকুমেন্ট পাওয়া যায়নি — ম্যানুয়ালি নির্বাচন করুন।',
    expiredManualRequired: 'মেয়াদ শেষ — ম্যানুয়ালি নির্বাচন করুন।',

    // Generation
    generatePackageBtn: 'প্যাকেজ তৈরি করুন',
    generating: 'ডকুমেন্ট প্রসেস হচ্ছে...',
    downloadPackage: 'প্যাকেজ ডাউনলোড করুন',
    includeIndexPage: 'সূচিপত্র পৃষ্ঠা যুক্ত করুন (Index Page)',
    packageGeneratedSuccess: 'প্যাকেজ প্রস্তুত',
    blockingNoticeTitle: 'টি ত্রুটি প্যাকেজ তৈরিতে বাধা দিচ্ছে',
    blockingNoticeDesc: 'প্যাকেজ তৈরির জন্য ত্রুটিগুলো সমাধান করুন।',

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

export function getStatusDescription(status: OfficialStatus, lang: Language): string {
  const t = translations[lang];
  switch (status) {
    case 'Missing':
      return t.statusMissingDesc;
    case 'Expiry date needed':
      return t.statusExpiryNeededDesc;
    case 'Expired':
      return t.statusExpiredDesc;
    case 'Not provided':
      return t.statusNotProvidedDesc;
    case 'OK':
      return t.statusOkDesc;
  }
}
