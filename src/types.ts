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
