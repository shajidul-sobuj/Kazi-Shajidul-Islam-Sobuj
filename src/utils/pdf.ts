import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { EvaluatedRequirement, TenderMetadata, UploadedFile } from '../types';

/**
 * Read and count pages of a PDF File safely.
 * Returns { pageCount, rawBytes } or throws error if damaged/encrypted.
 */
export async function inspectPdfFile(
  file: File
): Promise<{ pageCount: number; rawBytes: Uint8Array }> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  try {
    const pdfDoc = await PDFDocument.load(rawBytes, {
      ignoreEncryption: false,
    });
    const pageCount = pdfDoc.getPageCount();
    return { pageCount, rawBytes };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown PDF loading error';
    if (
      errorMsg.toLowerCase().includes('encrypt') ||
      errorMsg.toLowerCase().includes('password')
    ) {
      throw new Error(
        'PDF is password protected or encrypted. Please provide an unencrypted PDF.'
      );
    }
    throw new Error(
      `Corrupted or unreadable PDF: ${errorMsg}`
    );
  }
}

export interface GeneratePackageOptions {
  tender: TenderMetadata;
  evaluatedRequirements: EvaluatedRequirement[];
  includeIndexPage?: boolean;
  onProgress?: (percent: number, stepText: string) => void;
}

/**
 * Generate the complete tender package PDF adhering to Section 6:
 * 1. Page 1: Cover page (English)
 * 2. Optional Page 2: Index / Table of Contents
 * 3. Matched documents in order, all pages included, optional skipped if unprovided.
 * 4. Stamped footer on EVERY page: <tender_id> | Page X of Y
 */
export async function generateTenderPackagePdf({
  tender,
  evaluatedRequirements,
  includeIndexPage = false,
  onProgress,
}: GeneratePackageOptions): Promise<Uint8Array> {
  onProgress?.(5, 'Initializing PDF document package...');
  const mergedPdf = await PDFDocument.create();

  const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Filter only included documents in order
  const includedDocs = evaluatedRequirements
    .filter((er) => er.matchedFile !== undefined)
    .sort((a, b) => a.requirement.order - b.requirement.order);

  const generationDate = new Date().toISOString().split('T')[0];

  // Step 1: Create Cover Page (Page 1)
  onProgress?.(15, 'Generating Executive Cover Page...');
  const coverPage = mergedPdf.addPage([595.28, 841.89]); // Standard A4 (Points)
  const { width: cWidth, height: cHeight } = coverPage.getSize();

  // Draw header accent bar
  coverPage.drawRectangle({
    x: 0,
    y: cHeight - 12,
    width: cWidth,
    height: 12,
    color: rgb(0.12, 0.28, 0.52), // Primary navy blue
  });

  // Cover Page Title & Subtitle
  coverPage.drawText('TENDER SUBMISSION PACKAGE', {
    x: 50,
    y: cHeight - 65,
    size: 20,
    font: helveticaBold,
    color: rgb(0.12, 0.28, 0.52),
  });

  coverPage.drawText('OFFICIAL BID COMPLIANCE DOSSIER', {
    x: 50,
    y: cHeight - 82,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  coverPage.drawLine({
    start: { x: 50, y: cHeight - 95 },
    end: { x: cWidth - 50, y: cHeight - 95 },
    thickness: 1.5,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Tender Metadata Box
  coverPage.drawRectangle({
    x: 50,
    y: cHeight - 245,
    width: cWidth - 100,
    height: 135,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  const metadataItems = [
    { label: 'Tender ID', value: tender.tender_id },
    { label: 'Tender Title', value: tender.title },
    { label: 'Procuring Entity', value: tender.procuring_entity },
    { label: 'Bidder Name', value: tender.bidder },
    { label: 'Submission Deadline', value: tender.submission_deadline },
    { label: 'Package Generated', value: generationDate },
  ];

  let metaY = cHeight - 125;
  for (const item of metadataItems) {
    coverPage.drawText(item.label.toUpperCase() + ':', {
      x: 65,
      y: metaY,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.3, 0.35, 0.42),
    });
    // Truncate long value if needed
    const valText = item.value.length > 55 ? item.value.substring(0, 52) + '...' : item.value;
    coverPage.drawText(valText, {
      x: 195,
      y: metaY,
      size: 9.5,
      font: helvetica,
      color: rgb(0.1, 0.12, 0.15),
    });
    metaY -= 20;
  }

  // Included Documents Header
  const docListStartY = cHeight - 275;
  coverPage.drawText('SCHEDULE OF INCLUDED DOCUMENTS', {
    x: 50,
    y: docListStartY,
    size: 11,
    font: helveticaBold,
    color: rgb(0.12, 0.28, 0.52),
  });

  // Document table header
  coverPage.drawRectangle({
    x: 50,
    y: docListStartY - 24,
    width: cWidth - 100,
    height: 20,
    color: rgb(0.92, 0.94, 0.97),
  });

  coverPage.drawText('#', { x: 58, y: docListStartY - 19, size: 8, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  coverPage.drawText('DOCUMENT TITLE', { x: 80, y: docListStartY - 19, size: 8, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  coverPage.drawText('ATTACHED FILE', { x: 260, y: docListStartY - 19, size: 8, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  coverPage.drawText('PAGES', { x: 420, y: docListStartY - 19, size: 8, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  coverPage.drawText('EXPIRY', { x: 475, y: docListStartY - 19, size: 8, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });

  let rowY = docListStartY - 40;
  for (let idx = 0; idx < includedDocs.length; idx++) {
    const doc = includedDocs[idx];
    const isEven = idx % 2 === 0;
    if (isEven) {
      coverPage.drawRectangle({
        x: 50,
        y: rowY - 5,
        width: cWidth - 100,
        height: 18,
        color: rgb(0.98, 0.99, 1),
      });
    }

    coverPage.drawText(String(doc.requirement.order), {
      x: 58,
      y: rowY,
      size: 8.5,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    const titleEn = doc.requirement.title_en.length > 32
      ? doc.requirement.title_en.substring(0, 30) + '...'
      : doc.requirement.title_en;
    coverPage.drawText(titleEn, {
      x: 80,
      y: rowY,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.15, 0.15, 0.2),
    });

    const fileName = (doc.matchedFile?.name || '').length > 28
      ? (doc.matchedFile?.name || '').substring(0, 26) + '...'
      : doc.matchedFile?.name || '';
    coverPage.drawText(fileName, {
      x: 260,
      y: rowY,
      size: 8,
      font: helvetica,
      color: rgb(0.35, 0.4, 0.45),
    });

    coverPage.drawText(`${doc.matchedFile?.pageCount || 1} pg`, {
      x: 420,
      y: rowY,
      size: 8,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    const expiryDisplay = doc.requirement.has_expiry
      ? doc.expiryDate || 'N/A'
      : 'No Expiry';
    coverPage.drawText(expiryDisplay, {
      x: 475,
      y: rowY,
      size: 8,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });

    rowY -= 19;
    if (rowY < 80) break; // Keep space above footer
  }

  // Step 2: Track document page starts for Index / Table of Contents
  const documentPageStarts: Array<{ title: string; order: number; startPage: number; pages: number }> = [];
  let currentPageIndex = 1; // 1-based index (Cover is page 1)

  let indexPageRef: any = null;
  if (includeIndexPage) {
    currentPageIndex++; // Account for Index page
    onProgress?.(25, 'Generating Table of Contents / Index...');
    indexPageRef = mergedPdf.addPage([595.28, 841.89]);
  }

  // Step 3: Append all matched PDF files in strict requirement order
  for (let i = 0; i < includedDocs.length; i++) {
    const doc = includedDocs[i];
    const progressPercent = Math.round(30 + ((i + 1) / includedDocs.length) * 50);
    onProgress?.(
      progressPercent,
      `Merging Document ${i + 1}/${includedDocs.length}: ${doc.requirement.title_en}...`
    );

    if (!doc.matchedFile?.rawBytes) continue;

    const sourceDoc = await PDFDocument.load(doc.matchedFile.rawBytes);
    const pageIndices = sourceDoc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(sourceDoc, pageIndices);

    documentPageStarts.push({
      title: doc.requirement.title_en,
      order: doc.requirement.order,
      startPage: currentPageIndex + 1,
      pages: copiedPages.length,
    });

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
      currentPageIndex++;
    }
  }

  // Populate Index Page if requested
  if (includeIndexPage && indexPageRef) {
    const { width: iWidth, height: iHeight } = indexPageRef.getSize();
    indexPageRef.drawText('DOCUMENT INDEX & DIRECTORY', {
      x: 50,
      y: iHeight - 65,
      size: 16,
      font: helveticaBold,
      color: rgb(0.12, 0.28, 0.52),
    });

    indexPageRef.drawLine({
      start: { x: 50, y: iHeight - 80 },
      end: { x: iWidth - 50, y: iHeight - 80 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    let idxY = iHeight - 110;
    for (const item of documentPageStarts) {
      indexPageRef.drawText(`${item.order}. ${item.title}`, {
        x: 60,
        y: idxY,
        size: 9.5,
        font: helveticaBold,
        color: rgb(0.2, 0.25, 0.3),
      });

      // Dots connector
      indexPageRef.drawText('. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', {
        x: 230,
        y: idxY,
        size: 7,
        font: helvetica,
        color: rgb(0.7, 0.7, 0.7),
      });

      indexPageRef.drawText(`Page ${item.startPage}`, {
        x: 480,
        y: idxY,
        size: 9.5,
        font: helveticaBold,
        color: rgb(0.12, 0.28, 0.52),
      });

      idxY -= 24;
      if (idxY < 60) break;
    }
  }

  // Step 4: Add required footer to EVERY page, including cover:
  // Format: <tender_id> | Page X of Y (Y = total pages)
  const totalPages = mergedPdf.getPageCount();
  onProgress?.(90, `Applying official page stamp to all ${totalPages} pages...`);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = mergedPdf.getPage(pageNum - 1);
    const { width, height } = page.getSize();

    const footerText = `${tender.tender_id} | Page ${pageNum} of ${totalPages}`;
    const textWidth = helveticaFont.widthOfTextAtSize(footerText, 8.5);

    // Subtle background strip to guarantee readability without covering content
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 24,
      color: rgb(0.98, 0.98, 0.99),
      opacity: 0.92,
    });

    // Hairline divider above footer
    page.drawLine({
      start: { x: 30, y: 24 },
      end: { x: width - 30, y: 24 },
      thickness: 0.5,
      color: rgb(0.8, 0.83, 0.88),
    });

    // Center the footer text
    page.drawText(footerText, {
      x: (width - textWidth) / 2,
      y: 8,
      size: 8.5,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.4),
    });
  }

  onProgress?.(98, 'Packaging binary stream...');
  const finalPdfBytes = await mergedPdf.save();
  onProgress?.(100, 'Package generated successfully!');

  return finalPdfBytes;
}
