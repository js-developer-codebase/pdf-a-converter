export type PdfaConformanceLevel = 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b' | 'PDF/A-1a' | 'PDF/A-2u';

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  conformanceLevel?: PdfaConformanceLevel;
  language?: string;
  identifier?: string;
  custom?: Record<string, string>;
}

export interface FontDebugDetails {
  objRef: string;
  fontName: string;
  subtype: string;
  hasDescriptor: boolean;
  descriptorRef?: string;
  fontStreamType: 'FontFile' | 'FontFile2' | 'FontFile3' | 'None';
  fontStreamBytes: number;
  hasCidSet: boolean;
  cidSetBytes: number;
  isEmbedded: boolean;
  statusReason: string;
}

export interface FontDebuggerReport {
  totalFonts: number;
  embeddedCount: number;
  missingCount: number;
  fonts: FontDebugDetails[];
}

export interface ComplianceCheckItem {
  id: string;
  category: 'Metadata' | 'ColorProfile' | 'Structure' | 'Security' | 'Font';
  title: string;
  description: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  details?: string;
}

export interface ComplianceReport {
  isCompliant: boolean;
  score: number;
  conformanceLevel: PdfaConformanceLevel;
  timestamp: string;
  fileSize: number;
  pageCount: number;
  checks: ComplianceCheckItem[];
  fontDebugReport?: FontDebuggerReport;
  summary: string;
}

export interface ConversionResponse {
  success: boolean;
  message?: string;
  filename: string;
  pdfBase64?: string;
  metadata: PdfMetadata;
  complianceReport: ComplianceReport;
  processedAt: string;
}
