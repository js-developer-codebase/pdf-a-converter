import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, FileCheck, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface PdfViewerProps {
  pdfBase64: string;
  filename: string;
  pageCount: number;
  originalSize?: number;
  convertedSize?: number;
  onDownload: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfBase64,
  filename,
  pageCount,
  originalSize,
  convertedSize,
  onDownload,
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    if (!pdfBase64) return;
    try {
      const base64Clean = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const byteCharacters = atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Failed to create PDF blob URL', err);
    }
  }, [pdfBase64]);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Top Controls Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[220px] sm:max-w-xs">
              {filename}
            </h3>
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <span>{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
              <span>•</span>
              <span>Size: {formatBytes(convertedSize)}</span>
              {originalSize && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400">
                    Archived ({Math.round(((convertedSize || 0) / originalSize) * 100)}%)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-medium inline-flex items-center space-x-1"
              title="Open PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open Tab</span>
            </a>
          )}

          <button
            onClick={onDownload}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF/A</span>
          </button>
        </div>
      </div>

      {/* PDF iFrame Container */}
      <div className="flex-1 bg-slate-100 min-h-[450px] relative">
        {blobUrl ? (
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0`}
            title="PDF/A Preview"
            className="w-full h-full min-h-[480px] border-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            <span>Loading PDF preview...</span>
          </div>
        )}
      </div>

    </div>
  );
};
