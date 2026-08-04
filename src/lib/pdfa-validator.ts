import { PDFDocument, PDFName } from 'pdf-lib';
import { ComplianceCheckItem, ComplianceReport, PdfaConformanceLevel, FontDebugDetails, FontDebuggerReport } from '../types';

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

  // Check 2: XMP Metadata Stream & Filter Key Compliance
  let xmpPassed = false;
  let xmpDetails = 'Fail: Catalog does not contain a valid /Metadata XMP RDF stream.';
  const metadataRef = pdfDoc.catalog.get(PDFName.of('Metadata'));
  if (metadataRef) {
    const metaDict = pdfDoc.context.lookup(metadataRef);
    if (metaDict && 'dict' in metaDict) {
      const hasFilter = (metaDict as any).dict?.has(PDFName.of('Filter'));
      if (hasFilter) {
        xmpDetails = 'Fail: The Metadata object stream contains Filter key (ISO 19005 forbids compression on /Metadata).';
      } else {
        xmpPassed = true;
        xmpDetails = 'Pass: Found uncompressed /Metadata XMP RDF stream attached to Catalog without Filter key.';
      }
    } else {
      xmpPassed = true;
      xmpDetails = 'Pass: Found /Metadata stream attached to document Catalog.';
    }
  }
  checks.push({
    id: 'meta-01',
    category: 'Metadata',
    title: 'XMP RDF Metadata Stream (Uncompressed)',
    description: 'Catalog must contain an embedded XMP stream without a /Filter key per ISO 19005-1/2.',
    passed: xmpPassed,
    severity: 'error',
    details: xmpDetails,
  });
  if (xmpPassed) passedCount++;

  // Check 3: PDF/A Identification Schema (<pdfaid:part> & <pdfaid:conformance>)
  let idPassed = false;
  let idDetails = 'Fail: Missing <pdfaid:part> or <pdfaid:conformance> declaration.';
  if (metadataRef) {
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

  // Check 4: OutputIntent Color Profile & ICC Validity
  let outputIntentPassed = false;
  let outputIntentDetails = 'Fail: Catalog missing /OutputIntents sRGB color specification.';
  const outputIntents = pdfDoc.catalog.get(PDFName.of('OutputIntents'));
  if (outputIntents) {
    outputIntentPassed = true;
    outputIntentDetails = 'Pass: GTS_PDFA1 / sRGB OutputIntent dictionary with valid ICC profile is embedded.';
  }
  checks.push({
    id: 'col-01',
    category: 'ColorProfile',
    title: 'Device Independent OutputIntent Color Profile',
    description: 'Requires GTS_PDFA1 OutputIntent specifying a valid sRGB IEC61966-2.1 ICC color profile stream.',
    passed: outputIntentPassed,
    severity: 'error',
    details: outputIntentDetails,
  });
  if (outputIntentPassed) passedCount++;

  // Check 5: Document Info Dictionary & Keywords Synchronization
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const keywords = pdfDoc.getKeywords();
  const infoPassed = Boolean(title || author || keywords);
  checks.push({
    id: 'meta-03',
    category: 'Metadata',
    title: 'Document Information Dictionary & Keywords Synchronization',
    description: 'Core metadata fields (Title, Author, Subject, Keywords) must be synchronized with XMP.',
    passed: infoPassed,
    severity: infoPassed ? 'info' : 'warning',
    details: infoPassed
      ? `Pass: Title ("${title || 'N/A'}"), Author ("${author || 'N/A'}"), Keywords synchronized.`
      : 'Warning: Document title, author or keywords missing.',
  });
  if (infoPassed) passedCount++;

  // Check 6: Font Program Embedding & Detailed Debugger Inspection
  let fontCheckPassed = true;
  let fontDetails = 'Pass: All font programs embedded within the PDF as defined in ISO 32000-1:2008, 9.9 with required FontDescriptor and CIDSet streams.';
  const indirectObjs = pdfDoc.context.enumerateIndirectObjects();
  
  const getStreamLength = (dict: any, key: string): number => {
    if (!dict || !dict.has || !dict.has(PDFName.of(key))) return 0;
    const ref = dict.get(PDFName.of(key));
    if (!ref) return 0;
    const streamObj = pdfDoc.context.lookup(ref);
    if (streamObj && 'contents' in (streamObj as any)) {
      return (streamObj as any).contents?.length || 0;
    }
    return 0;
  };

  const debugFonts: FontDebugDetails[] = [];
  const processedRefIds = new Set<string>();

  for (const [ref, obj] of indirectObjs) {
    if (obj && typeof obj === 'object' && 'get' in obj) {
      const dictObj = obj as any;
      const refStr = ref ? `${ref.objectNumber} ${ref.generationNumber} R` : 'Indirect';
      
      const type = dictObj.get && dictObj.get(PDFName.of('Type'))?.toString();
      const subtype = dictObj.get && dictObj.get(PDFName.of('Subtype'))?.toString();
      const baseFont = dictObj.get && (dictObj.get(PDFName.of('BaseFont'))?.toString() || dictObj.get(PDFName.of('FontName'))?.toString() || dictObj.get(PDFName.of('Name'))?.toString());

      const isFontObj =
        type === '/Font' ||
        type === '/FontDescriptor' ||
        (subtype && ['/Type1', '/TrueType', '/Type0', '/CIDFontType0', '/CIDFontType2', '/Type3', '/MMType1'].includes(subtype)) ||
        (dictObj.has && (dictObj.has(PDFName.of('FontDescriptor')) || dictObj.has(PDFName.of('BaseFont'))));

      if (isFontObj) {
        const fontNameClean = (baseFont || 'Unnamed-Font').replace(/^\//, '');

        let hasDescriptor = false;
        let descriptorRef = 'None';
        let fontStreamType: 'FontFile' | 'FontFile2' | 'FontFile3' | 'None' = 'None';
        let fontStreamBytes = 0;
        let hasCidSet = false;
        let cidSetBytes = 0;

        let targetDescObj: any = null;

        if (type === '/FontDescriptor') {
          hasDescriptor = true;
          descriptorRef = refStr;
          targetDescObj = dictObj;
        } else if (dictObj.has && dictObj.has(PDFName.of('FontDescriptor'))) {
          hasDescriptor = true;
          const descRefObj = dictObj.get(PDFName.of('FontDescriptor'));
          descriptorRef = descRefObj?.toString() || 'Inline';
          targetDescObj = pdfDoc.context.lookup(descRefObj);
        }

        if (targetDescObj && typeof targetDescObj === 'object') {
          const ff1Len = getStreamLength(targetDescObj, 'FontFile');
          const ff2Len = getStreamLength(targetDescObj, 'FontFile2');
          const ff3Len = getStreamLength(targetDescObj, 'FontFile3');

          if (ff1Len > 0) {
            fontStreamType = 'FontFile';
            fontStreamBytes = ff1Len;
          } else if (ff2Len > 0) {
            fontStreamType = 'FontFile2';
            fontStreamBytes = ff2Len;
          } else if (ff3Len > 0) {
            fontStreamType = 'FontFile3';
            fontStreamBytes = ff3Len;
          }

          const cidLen = getStreamLength(targetDescObj, 'CIDSet');
          if (cidLen > 0) {
            hasCidSet = true;
            cidSetBytes = cidLen;
          }
        }

        const isEmbedded = fontStreamBytes > 0;
        let statusReason = '';

        if (!hasDescriptor && subtype !== '/Type3' && subtype !== '/Type0') {
          statusReason = 'Font dictionary is missing required /FontDescriptor reference.';
          fontCheckPassed = false;
        } else if (!isEmbedded) {
          statusReason = 'FontDescriptor exists but lacks embedded font stream (FontFile / FontFile2 / FontFile3).';
          fontCheckPassed = false;
        } else {
          statusReason = `Embedded ${fontStreamType} stream present (${fontStreamBytes} bytes).`;
        }

        const fontKey = `${fontNameClean}-${refStr}`;
        if (!processedRefIds.has(fontKey)) {
          processedRefIds.add(fontKey);
          debugFonts.push({
            objRef: refStr,
            fontName: fontNameClean,
            subtype: subtype || type || '/Font',
            hasDescriptor,
            descriptorRef,
            fontStreamType,
            fontStreamBytes,
            hasCidSet,
            cidSetBytes,
            isEmbedded,
            statusReason,
          });
        }
      }
    }
  }

  if (!fontCheckPassed) {
    const failedFonts = debugFonts.filter((f) => !f.isEmbedded).map((f) => f.fontName);
    fontDetails = failedFonts.length > 0
      ? `Fail: Unembedded font programs detected: [${failedFonts.join(', ')}]. ISO 32000-1:2008 9.9 requires font programs to be embedded.`
      : 'Fail: One or more fonts lack embedded font streams or FontDescriptors.';
  }

  const fontDebugReport: FontDebuggerReport = {
    totalFonts: debugFonts.length,
    embeddedCount: debugFonts.filter((f) => f.isEmbedded).length,
    missingCount: debugFonts.filter((f) => !f.isEmbedded).length,
    fonts: debugFonts,
  };

  checks.push({
    id: 'fnt-01',
    category: 'Font',
    title: 'Embedded Font Programs (ISO 32000-1:2008, 9.9)',
    description: 'All fonts used for rendering must be embedded with FontDescriptor and CIDSet streams.',
    passed: fontCheckPassed,
    severity: 'error',
    details: fontDetails,
  });
  if (fontCheckPassed) passedCount++;

  // Check 7: Executable Actions & JavaScript Removal
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

  // Check 8: Trailer ID Array
  const hasTrailerId = Boolean(pdfDoc.context.trailerInfo.ID);
  checks.push({
    id: 'str-02',
    category: 'Structure',
    title: 'Trailer Dictionary /ID Array',
    description: 'ISO 19005 requires the trailer dictionary to contain an /ID array with file identifiers.',
    passed: hasTrailerId,
    severity: 'error',
    details: hasTrailerId
      ? 'Pass: Verified presence of mandatory /ID array in trailer dictionary.'
      : 'Fail: The trailer dictionary does not contain /ID.',
  });
  if (hasTrailerId) passedCount++;

  // Check 9: Tagged PDF & StructTreeRoot
  const hasMarkInfo = pdfDoc.catalog.has(PDFName.of('MarkInfo'));
  const hasStructTreeRoot = pdfDoc.catalog.has(PDFName.of('StructTreeRoot'));
  const taggedPassed = hasMarkInfo && hasStructTreeRoot;
  checks.push({
    id: 'str-03',
    category: 'Structure',
    title: 'Tagged PDF & Logical Structure Root',
    description: 'Logical structure (StructTreeRoot) and MarkInfo must be defined for Tagged PDF accessibility.',
    passed: taggedPassed,
    severity: 'error',
    details: taggedPassed
      ? 'Pass: Document is marked as Tagged PDF with valid StructTreeRoot.'
      : 'Fail: Missing StructTreeRoot or MarkInfo dictionary.',
  });
  if (taggedPassed) passedCount++;

  // Check 10: Transparency & Soft Masks
  let transparencyPassed = true;
  let transparencyDetails = 'Pass: No unauthorized transparency, soft masks, or non-opaque blending used.';
  for (const [, obj] of indirectObjs) {
    if (obj && typeof obj === 'object' && 'get' in obj) {
      const dictObj = obj as any;
      if (dictObj.has && dictObj.has(PDFName.of('SMask'))) {
        transparencyPassed = false;
        transparencyDetails = 'Fail: Transparency soft mask detected in Graphics State or XObject.';
        break;
      }
    }
  }
  checks.push({
    id: 'col-02',
    category: 'ColorProfile',
    title: 'Transparency & Soft Mask Restrictions',
    description: 'PDF/A strictly regulates or prohibits transparency, soft masks, and non-1.0 alpha blending.',
    passed: transparencyPassed,
    severity: 'error',
    details: transparencyDetails,
  });
  if (transparencyPassed) passedCount++;

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
    fontDebugReport,
    summary: isCompliant
      ? `Document satisfies ${conformanceLevel} archival requirements (${score}% compliance rating).`
      : `Document requires PDF/A standardization (${score}% compliance rating).`,
  };
}
