import React, { useState } from 'react';
import { FontDebuggerReport, FontDebugDetails } from '../types';
import {
  Bug,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Search,
  Wrench,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface FontDebuggerProps {
  report?: FontDebuggerReport;
  onAutoRepair?: () => void;
  isRepairing?: boolean;
}

export const FontDebugger: React.FC<FontDebuggerProps> = ({
  report,
  onAutoRepair,
  isRepairing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'embedded' | 'missing'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedLogs, setCopiedLogs] = useState(false);

  if (!report || report.fonts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs text-center text-slate-500">
        <Bug className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700">No Font Objects Detected</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Upload or convert a PDF document to inspect font program embedding streams and ISO 32000-1:2008 structures.
        </p>
      </div>
    );
  }

  const filteredFonts = report.fonts.filter((font) => {
    const matchesSearch =
      font.fontName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      font.subtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
      font.objRef.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'embedded') return font.isEmbedded;
    if (filterMode === 'missing') return !font.isEmbedded;
    return true;
  });

  const copyDiagnosticLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFonts: report.totalFonts,
        embeddedCount: report.embeddedCount,
        missingCount: report.missingCount,
      },
      fontObjects: report.fonts,
    };

    navigator.clipboard.writeText(JSON.stringify(logData, null, 2));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      
      {/* Debugger Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Font Program & ISO 32000-1 Debugger
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                ISO 32000-1:2008 § 9.9
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspect font dictionaries, FontDescriptor references, embedded streams (`FontFile` / `FontFile2` / `FontFile3`), and CIDSet masks.
            </p>
          </div>
        </div>

        {/* Quick Summary Badges & Repair Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {report.missingCount > 0 && onAutoRepair && (
            <button
              onClick={onAutoRepair}
              disabled={isRepairing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'Fixing Fonts...' : 'Auto-Embed Font Streams'}</span>
            </button>
          )}

          <button
            onClick={copyDiagnosticLogs}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Copy Debug JSON Logs"
          >
            {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLogs ? 'Copied' : 'Export Logs'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/80 border-b border-slate-200/80 text-center p-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Total Fonts
          </span>
          <span className="text-sm font-extrabold text-slate-800">{report.totalFonts}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Embedded Streams
          </span>
          <span className="text-sm font-extrabold text-emerald-600">{report.embeddedCount}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Missing Embedding
          </span>
          <span className={`text-sm font-extrabold ${report.missingCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {report.missingCount}
          </span>
        </div>
      </div>

      {/* Toolbar: Search & Filter Tabs */}
      <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search font name, ref or subtype..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({report.totalFonts})
          </button>
          <button
            onClick={() => setFilterMode('embedded')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'embedded' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Embedded ({report.embeddedCount})
          </button>
          <button
            onClick={() => setFilterMode('missing')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'missing' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Missing ({report.missingCount})
          </button>
        </div>
      </div>

      {/* Font Inspection Table / List */}
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {filteredFonts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No fonts matching current filter parameters.
          </div>
        ) : (
          filteredFonts.map((font, idx) => {
            const isExpanded = expandedRow === `${font.fontName}-${font.objRef}-${idx}`;

            return (
              <div
                key={`${font.fontName}-${font.objRef}-${idx}`}
                className={`p-4 transition-colors ${font.isEmbedded ? 'bg-white hover:bg-slate-50/60' : 'bg-rose-50/20 hover:bg-rose-50/40'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {font.fontName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 font-mono">
                        {font.subtype}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Ref: {font.objRef}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono flex items-center space-x-2">
                      <span>Descriptor: <strong className="text-slate-700">{font.descriptorRef}</strong></span>
                      <span>•</span>
                      <span>
                        Stream: {' '}
                        {font.fontStreamType !== 'None' ? (
                          <strong className="text-emerald-700">{font.fontStreamType} ({font.fontStreamBytes} bytes)</strong>
                        ) : (
                          <strong className="text-rose-600">❌ Missing Stream</strong>
                        )}
                      </span>
                      {font.hasCidSet && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600">CIDSet ({font.cidSetBytes}B)</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Right Status Badge & Toggle */}
                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                    {font.isEmbedded ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>EMBEDDED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>NOT EMBEDDED</span>
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedRow(isExpanded ? null : `${font.fontName}-${font.objRef}-${idx}`)}
                      className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition-colors"
                      title="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Technical Inspection Drawer */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>PDF Dictionary Inspection Details</span>
                      <span>ISO 32000-1 / ISO 19005 Compliance Rule</span>
                    </div>

                    <p className={font.isEmbedded ? 'text-emerald-300' : 'text-rose-300 font-bold'}>
                      {font.statusReason}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500">Font Name:</span> {font.fontName}
                      </div>
                      <div>
                        <span className="text-slate-500">Subtype:</span> {font.subtype}
                      </div>
                      <div>
                        <span className="text-slate-500">FontDescriptor Ref:</span> {font.descriptorRef}
                      </div>
                      <div>
                        <span className="text-slate-500">Font Program Stream:</span> {font.fontStreamType} ({font.fontStreamBytes} bytes)
                      </div>
                      <div>
                        <span className="text-slate-500">CIDSet Stream:</span> {font.hasCidSet ? `Present (${font.cidSetBytes} bytes)` : 'None'}
                      </div>
                      <div>
                        <span className="text-slate-500">Compliance Status:</span> {font.isEmbedded ? 'PASSED' : 'FAILED (Unembedded Font)'}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Footer Helper Note */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center space-x-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          ISO 19005 (PDF/A) prohibits external device font rendering. All fonts must embed their full or subsetted binary font program streams (`FontFile`, `FontFile2`, or `FontFile3`).
        </span>
      </div>

    </div>
  );
};
