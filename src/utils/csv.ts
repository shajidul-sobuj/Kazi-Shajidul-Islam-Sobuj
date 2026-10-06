import type { EvaluatedRequirement, TenderMetadata } from '../types';

/**
 * Generate CSV text and trigger download for checklist audit.
 */
export function exportChecklistCsv(
  tender: TenderMetadata,
  evaluatedRequirements: EvaluatedRequirement[]
): void {
  const headers = ['Order', 'Document ID', 'Document Title (EN)', 'Document Title (BN)', 'Type', 'Matched File', 'Pages', 'Expiry Date', 'Status', 'Blocking?'];
  
  const rows = evaluatedRequirements.map((er) => [
    er.requirement.order,
    er.requirement.id,
    `"${er.requirement.title_en.replace(/"/g, '""')}"`,
    `"${er.requirement.title_bn.replace(/"/g, '""')}"`,
    er.requirement.mandatory ? 'Mandatory' : 'Optional',
    er.matchedFile ? `"${er.matchedFile.name.replace(/"/g, '""')}"` : 'None',
    er.matchedFile?.pageCount ?? 0,
    er.expiryDate || (er.requirement.has_expiry ? 'Not Entered' : 'N/A'),
    `"${er.status}"`,
    er.isBlocking ? 'YES' : 'NO',
  ]);

  const csvContent = [
    `"Tender ID: ${tender.tender_id}"`,
    `"Title: ${tender.title}"`,
    `"Bidder: ${tender.bidder}"`,
    `"Deadline: ${tender.submission_deadline}"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${tender.tender_id}_Checklist.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
