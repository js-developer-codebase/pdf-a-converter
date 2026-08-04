import React, { useState } from 'react';
import { ComplianceReport, PdfaConformanceLevel } from '../types';
import { validatePdfaCompliance } from '../lib/pdfa-validator';
import { convertToPdfa } from '../lib/pdfa-converter';
import { ComplianceCard } from './ComplianceCard';
import { ShieldCheck, Upload, FileText, AlertCircle, ArrowUpRight, Wrench } from 'lucide-react';

export const InspectorView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(null);
  const [targetLevel, setTargetLevel] = useState<PdfaConformanceLevel>('PDF/A-2b');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await runAudit(file, targetLevel);
  };

  const runAudit = async (file: File, level: PdfaConformanceLevel) => {
    setIsAuditing(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setRawBytes(bytes);
      const rep = await validatePdfaCompliance(bytes, level);
      setReport(rep);
    } catch (err) {
      console.error('Audit failed', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAutoRepairFonts = async () => {
    if (!rawBytes) return;
    setIsRepairing(true);
    try {
      const { pdfaBytes } = await convertToPdfa(rawBytes, {
        title: selectedFile?.name.replace(/\.pdf$/i, '') || 'Audited PDF Document',
        conformanceLevel: targetLevel,
      });
      setRawBytes(pdfaBytes);
      const newReport = await validatePdfaCompliance(pdfaBytes, targetLevel);
      setReport(newReport);
    } catch (err) {
      console.error('Font repair failed', err);
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload & Inspection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ISO 19005 Compliance Auditor & Debugger</h2>
            <p className="text-xs text-slate-500">
              Upload any PDF file to audit and debug font program embedding, XMP RDF streams, OutputIntent color profiles, and document structure.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select PDF File to Audit
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Standard
            </label>
            <select
              value={targetLevel}
              onChange={(e) => {
                const lvl = e.target.value as PdfaConformanceLevel;
                setTargetLevel(lvl);
                if (selectedFile) runAudit(selectedFile, lvl);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-500"
            >
              <option value="PDF/A-2b">PDF/A-2b (Recommended)</option>
              <option value="PDF/A-1b">PDF/A-1b (ISO 19005-1)</option>
              <option value="PDF/A-3b">PDF/A-3b (ISO 19005-3)</option>
              <option value="PDF/A-1a">PDF/A-1a (ISO 19005-1 Level A)</option>
              <option value="PDF/A-2u">PDF/A-2u (Unicode Compliance)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Results */}
      {isAuditing && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
          Auditing document structure and compliance criteria...
        </div>
      )}

      {report && !isAuditing && (
        <ComplianceCard
          report={report}
          onAutoRepairFonts={handleAutoRepairFonts}
          isRepairingFonts={isRepairing}
        />
      )}

    </div>
  );
};
