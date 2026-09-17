import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { apiService } from '../../services/api';
import { Download, FileText, Code, Table } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen || !analysis) return null;

  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
    setDownloading(format);
    try {
      let blob: Blob;
      let filename = `analysis_report.${format}`;

      if (format === 'pdf') {
        blob = await apiService.exportPdf(analysis);
        filename = `serializability_report_${Date.now()}.pdf`;
      } else if (format === 'json') {
        blob = await apiService.exportJson(analysis);
        filename = `serializability_analysis_${Date.now()}.json`;
      } else {
        blob = await apiService.exportCsv(analysis);
        filename = `serializability_analysis_${Date.now()}.csv`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" /> Export Analysis Report
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold">✕</button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Export full deterministic analysis for schedule <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">{analysis.schedule_text}</code> in your preferred format.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleExport('pdf')}
            disabled={downloading !== null}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-colors group shadow-sm"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">PDF Executive Report</span>
                <span className="text-[11px] text-slate-500">Formatted PDF document with tables & interpretative notes</span>
              </div>
            </div>
            {downloading === 'pdf' ? <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />}
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={downloading !== null}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-colors group shadow-sm"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Full JSON Data</span>
                <span className="text-[11px] text-slate-500">Complete raw structured data payload</span>
              </div>
            </div>
            {downloading === 'json' ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />}
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={downloading !== null}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-colors group shadow-sm"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Spreadsheet CSV</span>
                <span className="text-[11px] text-slate-500">Comma-separated tabular schedule operations & conflicts</span>
              </div>
            </div>
            {downloading === 'csv' ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
