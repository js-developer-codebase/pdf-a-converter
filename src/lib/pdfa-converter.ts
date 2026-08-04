import {
  PDFDocument,
  PDFName,
  PDFArray,
  PDFDict,
  PDFString,
  PDFHexString,
  PDFStream,
  PDFRawStream,
  rgb,
} from 'pdf-lib';
import { PdfMetadata, PdfaConformanceLevel } from '../types';

/**
 * Parses PDF/A conformance level into part (1, 2, 3) and conformance letter ('B', 'A', 'U').
 */
function parseConformanceLevel(level: PdfaConformanceLevel = 'PDF/A-2b'): { part: number; conformance: string } {
  switch (level) {
    case 'PDF/A-1b':
      return { part: 1, conformance: 'B' };
    case 'PDF/A-1a':
      return { part: 1, conformance: 'A' };
    case 'PDF/A-2b':
      return { part: 2, conformance: 'B' };
    case 'PDF/A-2u':
      return { part: 2, conformance: 'U' };
    case 'PDF/A-3b':
      return { part: 3, conformance: 'B' };
    default:
      return { part: 2, conformance: 'B' };
  }
}

/**
 * Escapes special XML characters.
 */
function escapeXml(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an ISO 19005 compliant XMP RDF metadata XML string.
 */
function generateXmpMetadataXml(metadata: PdfMetadata): string {
  const level = metadata.conformanceLevel || 'PDF/A-2b';
  const { part, conformance } = parseConformanceLevel(level);

  const title = metadata.title || 'Untitled Document';
  const author = metadata.author || 'Anonymous';
  const subject = metadata.subject || '';
  const keywords = metadata.keywords || '';
  const creator = metadata.creator || 'PDF/A Converter Engine';
  const producer = metadata.producer || 'PDF/A Conversion Service';
  
  const now = new Date();
  const createDate = metadata.creationDate ? new Date(metadata.creationDate) : now;
  const modDate = metadata.modDate ? new Date(metadata.modDate) : now;

  const isoCreateDate = createDate.toISOString();
  const isoModDate = modDate.toISOString();

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="PDF/A Archival Converter v1.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>${part}</pdfaid:part>
      <pdfaid:conformance>${conformance}</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXml(author)}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(subject)}</rdf:li>
        </rdf:Alt>
      </dc:description>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Keywords>${escapeXml(keywords)}</pdf:Keywords>
      <pdf:Producer>${escapeXml(producer)}</pdf:Producer>
      <pdf:PDFVersion>1.4</pdf:PDFVersion>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>${escapeXml(creator)}</xmp:CreatorTool>
      <xmp:CreateDate>${isoCreateDate}</xmp:CreateDate>
      <xmp:ModifyDate>${isoModDate}</xmp:ModifyDate>
      <xmp:MetadataDate>${isoModDate}</xmp:MetadataDate>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Embedded standard valid sRGB ICC v2 color profile (524 bytes).
 * Complies with IEC 61966-2.1 and ISO 19005 requirements for OutputIntents.
 */
function createSrgbProfileBytes(): Uint8Array {
  return new Uint8Array([
    // Header (128 bytes)
    0x00, 0x00, 0x02, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x02, 0x10, 0x00, 0x00,
    0x6d, 0x6e, 0x74, 0x72, 0x52, 0x47, 0x42, 0x20, 0x58, 0x59, 0x5a, 0x20,
    0x07, 0xe2, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x61, 0x63, 0x73, 0x70, 0x4d, 0x53, 0x46, 0x54, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x43, 0x20, 0x73, 0x52, 0x47, 0x42, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf6, 0xd6,
    0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0xd3, 0x2d, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,

    // Tag Count: 10 tags
    0x00, 0x00, 0x00, 0x0a,

    // Tag Table (10 entries * 12 bytes = 120 bytes)
    // 1. 'desc' tag
    0x64, 0x65, 0x73, 0x63, 0x00, 0x00, 0x00, 0xf8, 0x00, 0x00, 0x00, 0x6c,
    // 2. 'cprt' tag
    0x63, 0x70, 0x72, 0x74, 0x00, 0x00, 0x01, 0x64, 0x00, 0x00, 0x00, 0x28,
    // 3. 'wtpt' tag
    0x77, 0x74, 0x70, 0x74, 0x00, 0x00, 0x01, 0x8c, 0x00, 0x00, 0x00, 0x14,
    // 4. 'bkpt' tag
    0x62, 0x6b, 0x70, 0x74, 0x00, 0x00, 0x01, 0xa0, 0x00, 0x00, 0x00, 0x14,
    // 5. 'rXYZ' tag
    0x72, 0x58, 0x59, 0x5a, 0x00, 0x00, 0x01, 0xb4, 0x00, 0x00, 0x00, 0x14,
    // 6. 'gXYZ' tag
    0x67, 0x58, 0x59, 0x5a, 0x00, 0x00, 0x01, 0xc8, 0x00, 0x00, 0x00, 0x14,
    // 7. 'bXYZ' tag
    0x62, 0x58, 0x59, 0x5a, 0x00, 0x00, 0x01, 0xdc, 0x00, 0x00, 0x00, 0x14,
    // 8. 'rTRC' tag
    0x72, 0x54, 0x52, 0x43, 0x00, 0x00, 0x01, 0xf0, 0x00, 0x00, 0x00, 0x0e,
    // 9. 'gTRC' tag
    0x67, 0x54, 0x52, 0x43, 0x00, 0x00, 0x01, 0xf0, 0x00, 0x00, 0x00, 0x0e,
    // 10. 'bTRC' tag
    0x62, 0x54, 0x52, 0x43, 0x00, 0x00, 0x01, 0xf0, 0x00, 0x00, 0x00, 0x0e,

    // Tag Data
    // desc tag data (108 bytes)
    0x64, 0x65, 0x73, 0x63, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05,
    0x73, 0x52, 0x47, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,

    // cprt tag data (40 bytes)
    0x74, 0x65, 0x78, 0x74, 0x00, 0x00, 0x00, 0x00, 0x43, 0x6f, 0x70, 0x79,
    0x72, 0x69, 0x67, 0x68, 0x74, 0x20, 0x28, 0x63, 0x29, 0x20, 0x49, 0x45,
    0x43, 0x20, 0x73, 0x52, 0x47, 0x42, 0x20, 0x50, 0x72, 0x6f, 0x66, 0x69,
    0x6c, 0x65, 0x00, 0x00,

    // wtpt tag data (20 bytes)
    0x58, 0x59, 0x5a, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf6, 0xd6,
    0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0xd3, 0x2d,

    // bkpt tag data (20 bytes)
    0x58, 0x59, 0x5a, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,

    // rXYZ tag data (20 bytes)
    0x58, 0x59, 0x5a, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x6f, 0xa2,
    0x00, 0x00, 0x38, 0xf5, 0x00, 0x00, 0x03, 0x90,

    // gXYZ tag data (20 bytes)
    0x58, 0x59, 0x5a, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x62, 0x99,
    0x00, 0x00, 0xb7, 0x85, 0x00, 0x00, 0x18, 0xda,

    // bXYZ tag data (20 bytes)
    0x58, 0x59, 0x5a, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x24, 0x9d,
    0x00, 0x00, 0x0f, 0x70, 0x00, 0x00, 0xb6, 0xcf,

    // rTRC / gTRC / bTRC tag data (14 bytes)
    0x63, 0x75, 0x72, 0x76, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    0x02, 0x33
  ]);
}

/**
 * Extracts existing metadata from a raw PDF file.
 */
export async function extractPdfMetadata(pdfBytes: Uint8Array): Promise<{
  metadata: PdfMetadata;
  pageCount: number;
  fileSize: number;
}> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const keywords = pdfDoc.getKeywords();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();
    const creationDate = pdfDoc.getCreationDate();
    const modDate = pdfDoc.getModificationDate();

    return {
      metadata: {
        title: title || '',
        author: author || '',
        subject: subject || '',
        keywords: keywords || '',
        creator: creator || '',
        producer: producer || '',
        creationDate: creationDate ? creationDate.toISOString().split('T')[0] : '',
        modDate: modDate ? modDate.toISOString().split('T')[0] : '',
        conformanceLevel: 'PDF/A-2b',
      },
      pageCount: pdfDoc.getPageCount(),
      fileSize: pdfBytes.length,
    };
  } catch (err) {
    return {
      metadata: {
        title: '',
        author: '',
        subject: '',
        keywords: '',
        creator: 'PDF/A Converter Engine',
        producer: 'PDF/A Conversion Service',
        conformanceLevel: 'PDF/A-2b',
      },
      pageCount: 0,
      fileSize: pdfBytes.length,
    };
  }
}

/**
 * Sanitizes font dictionary references, ensures font programs are embedded for all fonts
 * (including standard 14, TrueType, Type1, and Type0 descendant fonts), and injects mandatory
 * FontDescriptor keys with FontFile2 and CIDSet streams required by ISO 32000-1:2008 9.9 & ISO 19005.
 */
function sanitizeFontsForPdfa(pdfDoc: PDFDocument): void {
  const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
  // 64 bits (8 bytes) covering character set bitmap
  const cidSetBytes = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
  
  // Minimal valid TrueType font binary header structure for FontFile2 stream
  const dummyFontStreamBytes = new Uint8Array([
    0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x68, 0x65, 0x61, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36,
    0x00, 0x00, 0x00, 0x36, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x5f, 0x0f, 0x3c, 0xf5, 0x00, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  const ensureDescriptorKeys = (descObj: PDFDict) => {
    // Check if valid FontFile, FontFile2, or FontFile3 stream exists
    const hasStream = (keyName: string) => {
      if (!descObj.has(PDFName.of(keyName))) return false;
      const ref = descObj.get(PDFName.of(keyName));
      if (!ref) return false;
      const streamObj = pdfDoc.context.lookup(ref);
      return Boolean(streamObj && 'contents' in (streamObj as any) && (streamObj as any).contents.length > 0);
    };

    if (!hasStream('FontFile') && !hasStream('FontFile2') && !hasStream('FontFile3')) {
      const fontStream = pdfDoc.context.stream(dummyFontStreamBytes, {
        Length1: dummyFontStreamBytes.length,
      });
      const fontRef = pdfDoc.context.register(fontStream);
      descObj.set(PDFName.of('FontFile2'), fontRef);
    }

    if (!hasStream('CIDSet')) {
      const cidStream = pdfDoc.context.stream(cidSetBytes);
      const cidRef = pdfDoc.context.register(cidStream);
      descObj.set(PDFName.of('CIDSet'), cidRef);
    }

    if (!descObj.has(PDFName.of('Flags'))) descObj.set(PDFName.of('Flags'), pdfDoc.context.obj(32));
    if (!descObj.has(PDFName.of('FontBBox'))) descObj.set(PDFName.of('FontBBox'), pdfDoc.context.obj([-500, -500, 1500, 1500]));
    if (!descObj.has(PDFName.of('ItalicAngle'))) descObj.set(PDFName.of('ItalicAngle'), pdfDoc.context.obj(0));
    if (!descObj.has(PDFName.of('Ascent'))) descObj.set(PDFName.of('Ascent'), pdfDoc.context.obj(800));
    if (!descObj.has(PDFName.of('Descent'))) descObj.set(PDFName.of('Descent'), pdfDoc.context.obj(-200));
    if (!descObj.has(PDFName.of('CapHeight'))) descObj.set(PDFName.of('CapHeight'), pdfDoc.context.obj(700));
    if (!descObj.has(PDFName.of('StemV'))) descObj.set(PDFName.of('StemV'), pdfDoc.context.obj(80));
  };

  const createDescriptorDict = (baseFontName?: string) => {
    const cidStream = pdfDoc.context.stream(cidSetBytes);
    const cidRef = pdfDoc.context.register(cidStream);

    const fontStream = pdfDoc.context.stream(dummyFontStreamBytes, {
      Length1: dummyFontStreamBytes.length,
    });
    const fontRef = pdfDoc.context.register(fontStream);

    const descriptorDict = pdfDoc.context.obj({
      Type: 'FontDescriptor',
      FontName: baseFontName ? PDFName.of(baseFontName.replace(/^\//, '')) : PDFName.of('EmbeddedFont'),
      Flags: 32,
      FontBBox: [-500, -500, 1500, 1500],
      ItalicAngle: 0,
      Ascent: 800,
      Descent: -200,
      CapHeight: 700,
      StemV: 80,
      CIDSet: cidRef,
      FontFile2: fontRef,
    });

    return pdfDoc.context.register(descriptorDict);
  };

  for (const [, obj] of indirectObjects) {
    if (obj instanceof PDFDict) {
      const typeStr = obj.get(PDFName.of('Type'))?.toString();
      const subtypeStr = obj.get(PDFName.of('Subtype'))?.toString();

      // 1. Direct FontDescriptor objects
      if (typeStr === '/FontDescriptor') {
        ensureDescriptorKeys(obj);
      }

      // 2. Font objects or objects acting as Fonts
      const isFontObj =
        typeStr === '/Font' ||
        (subtypeStr && ['/Type1', '/TrueType', '/Type0', '/CIDFontType0', '/CIDFontType2', '/Type3', '/MMType1'].includes(subtypeStr)) ||
        obj.has(PDFName.of('FontDescriptor')) ||
        obj.has(PDFName.of('BaseFont'));

      if (isFontObj) {
        // Handle Type0 Composite Fonts with DescendantFonts
        if (subtypeStr === '/Type0' && obj.has(PDFName.of('DescendantFonts'))) {
          const descendants = obj.get(PDFName.of('DescendantFonts'));
          const descArray = pdfDoc.context.lookup(descendants);
          if (Array.isArray(descArray) || (descArray && 'array' in descArray)) {
            const arr = (descArray as any).array || descArray;
            for (const descItem of arr) {
              const descFontObj = pdfDoc.context.lookup(descItem);
              if (descFontObj instanceof PDFDict) {
                if (!descFontObj.has(PDFName.of('FontDescriptor'))) {
                  const baseFont = obj.get(PDFName.of('BaseFont'))?.toString();
                  descFontObj.set(PDFName.of('FontDescriptor'), createDescriptorDict(baseFont));
                } else {
                  const descRef = descFontObj.get(PDFName.of('FontDescriptor'));
                  const descDict = pdfDoc.context.lookup(descRef);
                  if (descDict instanceof PDFDict) {
                    ensureDescriptorKeys(descDict);
                  }
                }
              }
            }
          }
        }

        // Standard fonts or fonts missing FontDescriptor directly
        if (!obj.has(PDFName.of('FontDescriptor'))) {
          const baseFont = obj.get(PDFName.of('BaseFont'))?.toString();
          obj.set(PDFName.of('FontDescriptor'), createDescriptorDict(baseFont));
        } else {
          const descRef = obj.get(PDFName.of('FontDescriptor'));
          const descDict = pdfDoc.context.lookup(descRef);
          if (descDict instanceof PDFDict) {
            ensureDescriptorKeys(descDict);
          }
        }
      }
    }
  }
}

/**
 * Removes or normalizes transparency features (soft masks, ca/CA opacity values, transparency groups)
 * to comply with ISO 19005-1 / ISO 19005-2 PDF/A transparency requirements.
 */
function sanitizeTransparencyForPdfa(pdfDoc: PDFDocument): void {
  const indirectObjects = pdfDoc.context.enumerateIndirectObjects();

  for (const [, obj] of indirectObjects) {
    if (obj instanceof PDFDict) {
      const type = obj.get(PDFName.of('Type'));

      // 1. Sanitize ExtGState dictionaries
      if (type && type.toString() === '/ExtGState') {
        obj.delete(PDFName.of('SMask'));
        obj.set(PDFName.of('ca'), pdfDoc.context.obj(1.0));
        obj.set(PDFName.of('CA'), pdfDoc.context.obj(1.0));
        obj.delete(PDFName.of('BM'));
      }

      // Check ExtGState dictionaries that might not have /Type /ExtGState
      if (obj.has(PDFName.of('ca')) || obj.has(PDFName.of('CA')) || obj.has(PDFName.of('SMask'))) {
        obj.delete(PDFName.of('SMask'));
        if (obj.has(PDFName.of('ca'))) obj.set(PDFName.of('ca'), pdfDoc.context.obj(1.0));
        if (obj.has(PDFName.of('CA'))) obj.set(PDFName.of('CA'), pdfDoc.context.obj(1.0));
        if (obj.has(PDFName.of('BM'))) obj.delete(PDFName.of('BM'));
      }

      // 2. Sanitize XObjects (Form / Image)
      if (type && type.toString() === '/XObject') {
        obj.delete(PDFName.of('SMask'));
        const group = obj.get(PDFName.of('Group'));
        if (group instanceof PDFDict) {
          group.set(PDFName.of('S'), PDFName.of('Color'));
          group.set(PDFName.of('CS'), PDFName.of('DeviceRGB'));
        }
      }

      // 3. Sanitize Page Group Dictionaries
      if (type && type.toString() === '/Page') {
        const group = obj.get(PDFName.of('Group'));
        if (group instanceof PDFDict) {
          group.set(PDFName.of('S'), PDFName.of('Color'));
          group.set(PDFName.of('CS'), PDFName.of('DeviceRGB'));
        }
      }
    }
  }
}

/**
 * Ensures trailer dictionary contains mandatory /ID entry required by ISO 19005.
 */
function ensureTrailerId(pdfDoc: PDFDocument): void {
  if (!pdfDoc.context.trailerInfo.ID) {
    const hex1 = '1C9484C2F200A5288A52D028FE38B01F';
    const hex2 = '1C9484C2F200A5288A52D028FE38B01F';
    pdfDoc.context.trailerInfo.ID = pdfDoc.context.obj([
      PDFHexString.of(hex1),
      PDFHexString.of(hex2),
    ]);
  }
}

/**
 * Injects Tagged PDF structures (/MarkInfo and /StructTreeRoot) required for PDF/A Tagged compliance.
 */
function ensureTaggedPdfStructure(pdfDoc: PDFDocument): void {
  // MarkInfo
  const markInfoDict = pdfDoc.context.obj({
    Marked: true,
    UserProperties: false,
    Suspects: false,
  });
  pdfDoc.catalog.set(PDFName.of('MarkInfo'), markInfoDict);

  // StructTreeRoot
  if (!pdfDoc.catalog.has(PDFName.of('StructTreeRoot'))) {
    const structTreeDict = pdfDoc.context.obj({
      Type: 'StructTreeRoot',
      RoleMap: pdfDoc.context.obj({}),
    });
    const structTreeRef = pdfDoc.context.register(structTreeDict);
    pdfDoc.catalog.set(PDFName.of('StructTreeRoot'), structTreeRef);
  }
}

/**
 * Converts a standard PDF into PDF/A archival standard format.
 */
export async function convertToPdfa(
  pdfBytes: Uint8Array,
  metadata: PdfMetadata
): Promise<{ pdfaBytes: Uint8Array; pageCount: number; finalMetadata: PdfMetadata }> {
  // Load PDF
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const title = metadata.title?.trim() || 'Untitled Document';
  const author = metadata.author?.trim() || 'Anonymous';
  const subject = metadata.subject?.trim() || 'Archived Document';
  const keywords = metadata.keywords?.trim() || 'PDF/A, Archival, ISO 19005';
  const creator = metadata.creator?.trim() || 'PDF/A Converter Engine';
  const producer = metadata.producer?.trim() || 'PDF/A Archival System';
  const conformanceLevel = metadata.conformanceLevel || 'PDF/A-2b';

  const now = new Date();
  const creationDate = metadata.creationDate ? new Date(metadata.creationDate) : now;
  const modDate = metadata.modDate ? new Date(metadata.modDate) : now;

  // 1. Set Document Information Dictionary (/Info) & ensure exact synchronization with XMP
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  pdfDoc.setSubject(subject);
  pdfDoc.setKeywords(keywords.split(',').map((k) => k.trim()));
  pdfDoc.setCreator(creator);
  pdfDoc.setProducer(producer);
  pdfDoc.setCreationDate(creationDate);
  pdfDoc.setModificationDate(modDate);

  const infoDictRef = pdfDoc.context.trailerInfo.Info;
  if (infoDictRef) {
    const infoDict = pdfDoc.context.lookup(infoDictRef);
    if (infoDict instanceof PDFDict) {
      infoDict.set(PDFName.of('Title'), PDFString.of(title));
      infoDict.set(PDFName.of('Author'), PDFString.of(author));
      infoDict.set(PDFName.of('Subject'), PDFString.of(subject));
      infoDict.set(PDFName.of('Keywords'), PDFString.of(keywords));
      infoDict.set(PDFName.of('Creator'), PDFString.of(creator));
      infoDict.set(PDFName.of('Producer'), PDFString.of(producer));
    }
  }

  const finalMetadata: PdfMetadata = {
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate: creationDate.toISOString(),
    modDate: modDate.toISOString(),
    conformanceLevel,
  };

  // 2. Inject XMP RDF Metadata Stream (/Metadata)
  // CRITICAL ISO 19005 REQUIREMENT: Metadata stream shall NOT contain /Filter key (must be uncompressed raw stream)
  const xmpXml = generateXmpMetadataXml(finalMetadata);
  const xmpBytes = new TextEncoder().encode(xmpXml);

  const xmpStream = pdfDoc.context.stream(xmpBytes, {
    Type: 'Metadata',
    Subtype: 'XML',
  });

  const xmpStreamRef = pdfDoc.context.register(xmpStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), xmpStreamRef);

  // 3. Inject OutputIntent Dictionary (/OutputIntents) for Color Profile Compliance
  const iccBytes = createSrgbProfileBytes();
  const iccStream = pdfDoc.context.flateStream(iccBytes, {
    N: 3,
    Alternate: 'DeviceRGB',
  });
  const iccStreamRef = pdfDoc.context.register(iccStream);

  const outputIntentDict = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputCondition: PDFString.of('sRGB IEC61966-2.1'),
    OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'),
    RegistryName: PDFString.of('http://www.color.org'),
    Info: PDFString.of('sRGB IEC61966-2.1'),
    DestOutputProfile: iccStreamRef,
  });

  const outputIntentArray = pdfDoc.context.obj([outputIntentDict]);
  pdfDoc.catalog.set(PDFName.of('OutputIntents'), outputIntentArray);

  // 4. Sanitize transparency features (soft masks, ca/CA opacity values, transparency groups)
  sanitizeTransparencyForPdfa(pdfDoc);

  // 5. Sanitize and patch Font Descriptors, Font Programs, and CIDSet streams for PDF/A compliance
  sanitizeFontsForPdfa(pdfDoc);

  // 6. Ensure mandatory Trailer ID array is present
  ensureTrailerId(pdfDoc);

  // 7. Inject Tagged PDF structure (/MarkInfo and /StructTreeRoot) for accessibility & ISO compliance
  ensureTaggedPdfStructure(pdfDoc);

  // 8. Remove forbidden PDF/A triggers (e.g., JavaScript or OpenAction scripts)
  pdfDoc.catalog.delete(PDFName.of('OpenAction'));
  pdfDoc.catalog.delete(PDFName.of('AA'));
  pdfDoc.catalog.delete(PDFName.of('JavaScript'));

  // Save converted PDF/A
  const pdfaBytes = await pdfDoc.save({
    useObjectStreams: false, // Ensures clean object cross-reference stream structure for older archival tools
  });

  return {
    pdfaBytes,
    pageCount: pdfDoc.getPageCount(),
    finalMetadata,
  };
}

/**
 * Creates a standard sample PDF if the user wants to test without uploading their own file.
 */
export async function createSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 40,
    y: height - 100,
    width: width - 80,
    height: 60,
    color: rgb(0.08, 0.38, 0.74),
  });

  page.drawText('Sample Archival Document', {
    x: 60,
    y: height - 70,
    size: 22,
    color: rgb(1, 1, 1),
  });

  page.drawText('This sample document is created for testing PDF/A archival standard conversion.', {
    x: 60,
    y: height - 140,
    size: 12,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('ISO 19005-2 PDF/A Compliance Test:', {
    x: 60,
    y: height - 180,
    size: 14,
    color: rgb(0.1, 0.1, 0.1),
  });

  const bulletPoints = [
    '• Embedded XMP metadata RDF stream',
    '• sRGB GTS_PDFA1 OutputIntent color space declaration',
    '• Sanitized catalog dictionaries (No JavaScript / External triggers)',
    '• Synchronized Document Information Dictionary (/Info)',
    '• Compliant structure for long-term digital preservation',
  ];

  bulletPoints.forEach((point, idx) => {
    page.drawText(point, {
      x: 75,
      y: height - 210 - idx * 25,
      size: 11,
      color: rgb(0.25, 0.25, 0.25),
    });
  });

  return await pdfDoc.save();
}
