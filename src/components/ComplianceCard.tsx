import React, { useState } from 'react';
import { ComplianceReport } from '../types';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ComplianceCardProps {
  report: ComplianceReport;
}

export const ComplianceCard: React.FC<ComplianceCardProps> = ({ report }) => {
  const [expanded, setExpanded] = useState(true);

  const getSeverityBadge = (severity: string, passed: boolean) => {
    if (passed) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>PASS</span>
        </span>
      );
    }
    if (severity === 'error') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>FAIL</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>WARN</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-start space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            report.isCompliant ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">ISO Compliance Verification</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {report.conformanceLevel}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {report.summary}
            </p>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Archival Index</span>
            <span className={`text-xl font-extrabold tracking-tight ${
              report.score >= 80 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {report.score}%
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Expanded Checklist */}
      {expanded && (
        <div className="p-5 sm:p-6 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ISO 19005 Checklist Criteria
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {report.checks.filter((c) => c.passed).length} of {report.checks.length} checks satisfied
            </span>
          </div>

          <div className="space-y-2.5">
            {report.checks.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-xs">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                  {item.details && (
                    <p className={`text-[11px] font-mono mt-1 ${item.passed ? 'text-slate-500' : 'text-rose-600 font-medium'}`}>
                      {item.details}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {getSeverityBadge(item.severity, item.passed)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
