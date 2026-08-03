import React from 'react';
import { PdfMetadata, PdfaConformanceLevel } from '../types';
import { Tag, User, BookOpen, Layers, Shield, Calendar, Sparkles, Wand2 } from 'lucide-react';

interface MetadataFormProps {
  metadata: PdfMetadata;
  onChange: (updated: PdfMetadata) => void;
  onExtractFromFile?: () => void;
  isExtracting?: boolean;
  hasFile: boolean;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({
  metadata,
  onChange,
  onExtractFromFile,
  isExtracting = false,
  hasFile,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...metadata,
      [name]: value,
    });
  };

  const applyPreset = (presetName: string) => {
    const today = new Date().toISOString().split('T')[0];
    switch (presetName) {
      case 'legal':
        onChange({
          ...metadata,
          title: metadata.title || 'Legal Archival Record',
          author: metadata.author || 'Legal & Compliance Department',
          subject: 'Verified Official Contract / Court Archival Record',
          keywords: 'Legal, Contract, Binding, ISO 19005, Compliance, Court Document',
          creator: 'Legal Archival Suite',
          producer: 'PDF/A Archival System v1.0',
          conformanceLevel: 'PDF/A-2b',
          creationDate: today,
        });
        break;

      case 'financial':
        onChange({
          ...metadata,
          title: metadata.title || 'Financial Audit Statement',
          author: metadata.author || 'Corporate Treasury',
          subject: 'Annual Financial Audit & Tax Filing Archival Record',
          keywords: 'Financial, Audit, Statement, Tax, Ledger, Archival',
          creator: 'Financial Record Engine',
          producer: 'PDF/A Archival System v1.0',
          conformanceLevel: 'PDF/A-2b',
          creationDate: today,
        });
        break;

      case 'academic':
        onChange({
          ...metadata,
          title: metadata.title || 'Academic Research Publication',
          author: metadata.author || 'Institutional Research Board',
          subject: 'Peer-Reviewed Scientific Repository Archival Document',
          keywords: 'Research, Peer-Reviewed, Repository, Academic, DOI, ISO 19005',
          creator: 'Institutional Repository Publisher',
          producer: 'PDF/A Archival System v1.0',
          conformanceLevel: 'PDF/A-1a',
          creationDate: today,
        });
        break;

      case 'government':
        onChange({
          ...metadata,
          title: metadata.title || 'Public Records Filing',
          author: metadata.author || 'Department of Records',
          subject: 'Public Access & Long-term Archival Preservation Document',
          keywords: 'Public Record, Government, Freedom of Information, Archival, ISO 19005',
          creator: 'Municipal E-Filing System',
          producer: 'PDF/A Archival System v1.0',
          conformanceLevel: 'PDF/A-3b',
          creationDate: today,
        });
        break;

      default:
        break;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>Document Archival Metadata</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronizes Document Info Dictionary with embedded XMP RDF metadata stream.
          </p>
        </div>

        {hasFile && onExtractFromFile && (
          <button
            type="button"
            onClick={onExtractFromFile}
            disabled={isExtracting}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{isExtracting ? 'Extracting...' : 'Auto-Extract From File'}</span>
          </button>
        )}
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-2 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Preset Templates:</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('legal')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left"
          >
            🏛️ Legal Archival
          </button>
          <button
            type="button"
            onClick={() => applyPreset('financial')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left"
          >
            📊 Financial Audit
          </button>
          <button
            type="button"
            onClick={() => applyPreset('academic')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left"
          >
            🎓 Academic Paper
          </button>
          <button
            type="button"
            onClick={() => applyPreset('government')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left"
          >
            🏛️ Government Record
          </button>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Document Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={metadata.title || ''}
            onChange={handleInputChange}
            placeholder="e.g., Annual Financial Audit Report 2026"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

        {/* Author / Creator Organization */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Author / Organization</span>
          </label>
          <input
            type="text"
            name="author"
            value={metadata.author || ''}
            onChange={handleInputChange}
            placeholder="e.g., Jane Doe, Legal & Compliance Team"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

        {/* PDF/A Conformance Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>PDF/A Conformance Standard</span>
          </label>
          <select
            name="conformanceLevel"
            value={metadata.conformanceLevel || 'PDF/A-2b'}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
          >
            <option value="PDF/A-2b">PDF/A-2b (Recommended, ISO 19005-2 Level B)</option>
            <option value="PDF/A-1b">PDF/A-1b (Basic Visual Compliance, ISO 19005-1)</option>
            <option value="PDF/A-3b">PDF/A-3b (Allows Embedded Sources e.g. ZUGFeD)</option>
            <option value="PDF/A-1a">PDF/A-1a (Accessible Tagged PDF, ISO 19005-1)</option>
            <option value="PDF/A-2u">PDF/A-2u (Unicode Mapping Conformance)</option>
          </select>
        </div>

        {/* Subject */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Subject / Description Summary</span>
          </label>
          <input
            type="text"
            name="subject"
            value={metadata.subject || ''}
            onChange={handleInputChange}
            placeholder="e.g., Verified archival copy of regulatory compliance filings"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Keywords (Comma separated)
          </label>
          <input
            type="text"
            name="keywords"
            value={metadata.keywords || ''}
            onChange={handleInputChange}
            placeholder="e.g., Audit, PDF/A, ISO 19005, Archival"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

        {/* Creation Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Creation Date</span>
          </label>
          <input
            type="date"
            name="creationDate"
            value={metadata.creationDate || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

        {/* Creator Tool */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Creator Application Tool</span>
          </label>
          <input
            type="text"
            name="creator"
            value={metadata.creator || ''}
            onChange={handleInputChange}
            placeholder="e.g., PDF/A Archival Engine"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

        {/* Producer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            PDF Producer / System
          </label>
          <input
            type="text"
            name="producer"
            value={metadata.producer || ''}
            onChange={handleInputChange}
            placeholder="e.g., PDF/A Archival System v1.0"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
          />
        </div>

      </div>

    </div>
  );
};
