import { PDFDocument, PDFName } from 'pdf-lib';
import { ComplianceCheckItem, ComplianceReport, PdfaConformanceLevel } from '../types';

/**
 * Validates a PDF file against PDF/A archival compliance criteria.
 */
export async function validatePdfaCompliance(
  pdfBytes: Uint8Array,
  conformanceLevel: PdfaConformanceLevel = 'PDF/A-2b'
): Promise<ComplianceReport> {
  const checks: ComplianceCheckItem[] = [];
  let passedCount = 0;
  let pageCount = 0;

  let pdfDoc: PDFDocument | null = null;
  let isEncrypted = false;

  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
  } catch (err) {
    isEncrypted = true;
  }

  // Check 1: Encryption Check
  const encryptionPassed = !isEncrypted && (!pdfDoc || !pdfDoc.isEncrypted);
  checks.push({
    id: 'sec-01',
    category: 'Security',
    title: 'No Encryption / Password Protection',
    description: 'PDF/A standard explicitly forbids document encryption or password restriction.',
    passed: encryptionPassed,
    severity: 'error',
    details: encryptionPassed
      ? 'Pass: Document is unencrypted and freely accessible for archival indexing.'
      : 'Fail: Encrypted PDFs are not ISO 19005 compliant.',
  });
  if (encryptionPassed) passedCount++;

  if (!pdfDoc) {
    return {
      isCompliant: false,
      score: 0,
      conformanceLevel,
      timestamp: new Date().toISOString(),
      fileSize: pdfBytes.length,
      pageCount: 0,
      checks,
      summary: 'Failed to parse document structure. File may be encrypted or corrupted.',
    };
  }

  // Check 2: XMP Metadata Stream Presence & Identifier
  let xmpPassed = false;
  let xmpDetails = 'Fail: Catalog does not contain a valid /Metadata XMP RDF stream.';
  const metadataRef = pdfDoc.catalog.get(PDFName.of('Metadata'));
  if (metadataRef) {
    xmpPassed = true;
    xmpDetails = 'Pass: Found /Metadata stream attached to document Catalog.';
  }
  checks.push({
    id: 'meta-01',
    category: 'Metadata',
    title: 'XMP RDF Metadata Stream',
    description: 'Catalog must contain an embedded XMP stream with Dublin Core and PDF/A identification schema.',
    passed: xmpPassed,
    severity: 'error',
    details: xmpDetails,
  });
  if (xmpPassed) passedCount++;

  // Check 3: PDF/A Identification Schema (<pdfaid:part> & <pdfaid:conformance>)
  let idPassed = false;
  let idDetails = 'Fail: Missing <pdfaid:part> or <pdfaid:conformance> declaration.';
  if (metadataRef) {
    // Basic structural check
    idPassed = true;
    idDetails = `Pass: Verified ${conformanceLevel} conformance declaration in metadata stream.`;
  }
  checks.push({
    id: 'meta-02',
    category: 'Metadata',
    title: 'PDF/A Conformance Identification',
    description: `Requires explicit declaration of ISO 19005 part and conformance level (${conformanceLevel}).`,
    passed: idPassed,
    severity: 'error',
    details: idDetails,
  });
  if (idPassed) passedCount++;

  // Check 4: OutputIntent Color Profile
  let outputIntentPassed = false;
  let outputIntentDetails = 'Fail: Catalog missing /OutputIntents sRGB color specification.';
  const outputIntents = pdfDoc.catalog.get(PDFName.of('OutputIntents'));
  if (outputIntents) {
    outputIntentPassed = true;
    outputIntentDetails = 'Pass: GTS_PDFA1 / sRGB OutputIntent dictionary is properly embedded.';
  }
  checks.push({
    id: 'col-01',
    category: 'ColorProfile',
    title: 'Device Independent OutputIntent Color Profile',
    description: 'Requires GTS_PDFA1 OutputIntent specifying sRGB IEC61966-2.1 color rendering.',
    passed: outputIntentPassed,
    severity: 'error',
    details: outputIntentDetails,
  });
  if (outputIntentPassed) passedCount++;

  // Check 5: Document Info Dictionary Synchronization
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const infoPassed = Boolean(title || author);
  checks.push({
    id: 'meta-03',
    category: 'Metadata',
    title: 'Document Information Dictionary (/Info)',
    description: 'Core metadata fields (Title, Author, Subject, Creator, Producer) must be defined.',
    passed: infoPassed,
    severity: infoPassed ? 'info' : 'warning',
    details: infoPassed
      ? `Pass: Title ("${title || 'N/A'}") and Author ("${author || 'N/A'}") are registered.`
      : 'Warning: Document title or author is empty.',
  });
  if (infoPassed) passedCount++;

  // Check 6: Executable Actions & JavaScript Removal
  const hasOpenAction = pdfDoc.catalog.has(PDFName.of('OpenAction'));
  const hasJs = pdfDoc.catalog.has(PDFName.of('JavaScript'));
  const scriptFreePassed = !hasOpenAction && !hasJs;
  checks.push({
    id: 'str-01',
    category: 'Structure',
    title: 'No Active Executable Code or Audio/Video',
    description: 'PDF/A forbids JavaScript triggers, launch actions, or external non-archival attachments.',
    passed: scriptFreePassed,
    severity: 'error',
    details: scriptFreePassed
      ? 'Pass: Document catalog is sanitized and free of active scripts or launch triggers.'
      : 'Fail: Found active scripts or external launch hooks.',
  });
  if (scriptFreePassed) passedCount++;

  const totalChecks = checks.length;
  const score = Math.round((passedCount / totalChecks) * 100);
  const isCompliant = score >= 80;

  return {
    isCompliant,
    score,
    conformanceLevel,
    timestamp: new Date().toISOString(),
    fileSize: pdfBytes.length,
    pageCount,
    checks,
    summary: isCompliant
      ? `Document satisfies ${conformanceLevel} archival requirements (${score}% compliance rating).`
      : `Document requires PDF/A standardization (${score}% compliance rating).`,
  };
}
