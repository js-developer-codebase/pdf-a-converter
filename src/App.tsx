import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetadataForm } from './components/MetadataForm';
import { PdfViewer } from './components/PdfViewer';
import { ComplianceCard } from './components/ComplianceCard';
import { ApiExplorer } from './components/ApiExplorer';
import { InspectorView } from './components/InspectorView';
import { PdfMetadata, ConversionResponse, ComplianceReport } from './types';
import { convertToPdfa, extractPdfMetadata, createSamplePdf } from './lib/pdfa-converter';
import { validatePdfaCompliance } from './lib/pdfa-validator';
import {
  Upload,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ui' | 'api' | 'inspector'>('ui');

  // Active File & Data State
  const [file, setFile] = useState<File | null>(null);
  const [rawPdfBytes, setRawPdfBytes] = useState<Uint8Array | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: 'PDF/A Archival Engine',
    producer: 'PDF/A Archival System v1.0',
    conformanceLevel: 'PDF/A-2b',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Conversion Result
  const [convertedResult, setConvertedResult] = useState<{
    pdfaBytes: Uint8Array;
    pdfBase64: string;
    filename: string;
    pageCount: number;
    originalSize: number;
    convertedSize: number;
    complianceReport: ComplianceReport;
  } | null>(null);

  // Load a initial sample PDF on start if needed, or allow 1-click loading
  const handleLoadSample = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const sampleBytes = await createSamplePdf();
      setRawPdfBytes(sampleBytes);
      setFile(null);

      const today = new Date().toISOString().split('T')[0];
      const initialMeta: PdfMetadata = {
        title: 'Sample Document for PDF/A Archival Standard',
        author: 'Archive Department',
        subject: 'ISO 19005-2 PDF/A Archival Verification',
        keywords: 'Archival, ISO 19005, PDF/A-2b, Verification, Preserved',
        creator: 'PDF/A Conversion Suite',
        producer: 'PDF/A Archival Engine v1.0',
        conformanceLevel: 'PDF/A-2b',
        creationDate: today,
      };
      setMetadata(initialMeta);

      // Perform conversion
      const { pdfaBytes, pageCount, finalMetadata } = await convertToPdfa(sampleBytes, initialMeta);
      const report = await validatePdfaCompliance(pdfaBytes, initialMeta.conformanceLevel || 'PDF/A-2b');

      const base64 = `data:application/pdf;base64,${btoa(
        Array.from(pdfaBytes, (byte) => String.fromCharCode(byte)).join('')
      )}`;

      setConvertedResult({
        pdfaBytes,
        pdfBase64: base64,
        filename: 'sample-archival-PDFA.pdf',
        pageCount,
        originalSize: sampleBytes.length,
        convertedSize: pdfaBytes.length,
        complianceReport: report,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Selection (Drag & drop or input)
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      await processUploadedFile(droppedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processUploadedFile(selectedFile);
    }
  };

  const processUploadedFile = async (uploadedFile: File) => {
    setIsExtracting(true);
    setErrorMsg(null);
    setFile(uploadedFile);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setRawPdfBytes(bytes);

      // Extract existing metadata
      const { metadata: extracted, pageCount } = await extractPdfMetadata(bytes);
      const filenameNoExt = uploadedFile.name.replace(/\.pdf$/i, '');

      const newMetadata: PdfMetadata = {
        title: extracted.title || filenameNoExt,
        author: extracted.author || 'Document Author',
        subject: extracted.subject || 'Archival Document',
        keywords: extracted.keywords || 'PDF/A, Archival, ISO 19005',
        creator: extracted.creator || 'PDF/A Conversion Suite',
        producer: extracted.producer || 'PDF/A Archival Engine v1.0',
        conformanceLevel: 'PDF/A-2b',
        creationDate: extracted.creationDate || new Date().toISOString().split('T')[0],
      };

      setMetadata(newMetadata);

      // Auto convert on upload for instant result
      await executeConversion(bytes, newMetadata, uploadedFile.name);
    } catch (err: any) {
      setErrorMsg('Could not read uploaded PDF file. Please ensure it is a valid PDF document.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Perform PDF/A Conversion
  const executeConversion = async (bytes: Uint8Array, currentMeta: PdfMetadata, filename: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const { pdfaBytes, pageCount, finalMetadata } = await convertToPdfa(bytes, currentMeta);
      const report = await validatePdfaCompliance(pdfaBytes, currentMeta.conformanceLevel || 'PDF/A-2b');

      // Convert Uint8Array to Base64 in chunks to avoid call stack overflow
      let binary = '';
      const len = pdfaBytes.byteLength;
      for (let i = 0; i < len; i += 1024) {
        binary += String.fromCharCode.apply(
          null,
          Array.from(pdfaBytes.subarray(i, Math.min(i + 1024, len)))
        );
      }
      const base64 = `data:application/pdf;base64,${btoa(binary)}`;

      const baseName = filename.replace(/\.pdf$/i, '');

      setConvertedResult({
        pdfaBytes,
        pdfBase64: base64,
        filename: `${baseName}-PDFA.pdf`,
        pageCount,
        originalSize: bytes.length,
        convertedSize: pdfaBytes.length,
        complianceReport: report,
      });
    } catch (err: any) {
      console.error('Conversion failed', err);
      setErrorMsg(`Conversion failed: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualConvert = () => {
    if (!rawPdfBytes) {
      handleLoadSample();
      return;
    }
    const filename = file ? file.name : 'document.pdf';
    executeConversion(rawPdfBytes, metadata, filename);
  };

  // Trigger Download on User's System
  const handleDownload = () => {
    if (!convertedResult) return;
    const blob = new Blob([convertedResult.pdfaBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col">
      
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadSample={handleLoadSample}
        isProcessing={isProcessing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: UI CONVERTER */}
        {activeTab === 'ui' && (
          <div className="space-y-8">
            
            {/* Step 1: Upload Dropzone Banner */}
            {!rawPdfBytes ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors p-8 sm:p-12 text-center shadow-xs cursor-pointer group"
              >
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center mx-auto transition-colors">
                    <Upload className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Upload PDF to Convert to PDF/A
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag & drop your PDF file here, or click to browse. Automatically extracts metadata and injects ISO 19005 XMP streams.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all">
                      <FileText className="w-4 h-4" />
                      <span>Choose PDF File</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadSample}
                      disabled={isProcessing}
                      className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Test with Sample PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Active File Banner */
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900 truncate max-w-xs">
                        {file ? file.name : 'sample-archival.pdf'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {rawPdfBytes ? `${(rawPdfBytes.length / 1024).toFixed(1)} KB` : ''} • PDF Loaded
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                    <span>Change File</span>
                    <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                  </label>

                  <button
                    onClick={handleManualConvert}
                    disabled={isProcessing}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Converting...' : 'Re-apply Metadata & Convert'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Grid Layout: Left Metadata Editor, Right Preview & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Metadata Editor */}
              <div className="lg:col-span-6 space-y-6">
                <MetadataForm
                  metadata={metadata}
                  onChange={setMetadata}
                  hasFile={Boolean(rawPdfBytes)}
                  isExtracting={isExtracting}
                  onExtractFromFile={() => {
                    if (rawPdfBytes) {
                      extractPdfMetadata(rawPdfBytes).then(({ metadata: extracted }) => {
                        setMetadata((prev) => ({
                          ...prev,
                          title: extracted.title || prev.title,
                          author: extracted.author || prev.author,
                          subject: extracted.subject || prev.subject,
                          keywords: extracted.keywords || prev.keywords,
                        }));
                      });
                    }
                  }}
                />

                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
                  <div className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>PDF/A Archival Guarantee</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This conversion embeds standard sRGB color profiles, builds an ISO 19005 compliant XMP RDF metadata stream, synchronizes Document Information dictionaries, and strips non-archival interactive elements to ensure accessibility for 50+ years.
                  </p>
                </div>
              </div>

              {/* Right Column: PDF Preview & Download Card */}
              <div className="lg:col-span-6 space-y-6">
                {convertedResult ? (
                  <>
                    <PdfViewer
                      pdfBase64={convertedResult.pdfBase64}
                      filename={convertedResult.filename}
                      pageCount={convertedResult.pageCount}
                      originalSize={convertedResult.originalSize}
                      convertedSize={convertedResult.convertedSize}
                      onDownload={handleDownload}
                    />

                    <ComplianceCard
                      report={convertedResult.complianceReport}
                      onAutoRepairFonts={handleManualConvert}
                      isRepairingFonts={isProcessing}
                    />
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[350px]">
                    <FileText className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">No Converted PDF Preview Yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Upload a PDF file or click "Test with Sample PDF" above to generate your PDF/A archival document.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DEVELOPER REST API & CODE SNIPPETS */}
        {activeTab === 'api' && <ApiExplorer />}

        {/* TAB 3: COMPLIANCE INSPECTOR */}
        {activeTab === 'inspector' && <InspectorView />}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">PDF/A Converter Engine</span>
            <span>•</span>
            <span>ISO 19005-1 / ISO 19005-2 Archival Compliance Standard</span>
          </div>
          <div>
            Web UI & REST API Endpoints Active (`/api/convert-pdfa`)
          </div>
        </div>
      </footer>

    </div>
  );
}
