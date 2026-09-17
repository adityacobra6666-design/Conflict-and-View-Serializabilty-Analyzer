import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { CheckCircle2, XCircle, RotateCcw, Download, Eye, Sparkles } from 'lucide-react';
import { Comparison } from '../Comparison/Comparison';
import { ExportModal } from '../Export/ExportModal';

interface CompletionCardProps {
  analysis: AnalysisResult;
  onRestart: () => void;
}

export const CompletionCard: React.FC<CompletionCardProps> = ({
  analysis,
  onRestart
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const combined = analysis.combined_result;
  const conflictYes = combined.conflict_serializable;
  const viewYes = combined.view_serializable;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
      {/* Header Badge */}
      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          ANALYSIS COMPLETE
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Schedule: <span className="font-bold text-blue-600 dark:text-blue-400">{analysis.schedule_text}</span>
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
        {/* Conflict Verdict */}
        <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
          conflictYes ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Conflict Serializability
          </span>
          <div className="flex items-center gap-2 text-base font-extrabold">
            {conflictYes ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
            <span>{conflictYes ? '✓ SERIALIZABLE' : '✕ NOT SERIALIZABLE'}</span>
          </div>
          <span className="text-xs text-slate-600">
            {conflictYes ? 'Acyclic precedence graph' : `Graph cycle: ${analysis.formatted_cycles[0] || 'Cycle detected'}`}
          </span>
        </div>

        {/* View Verdict */}
        <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
          viewYes ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            View Serializability
          </span>
          <div className="flex items-center gap-2 text-base font-extrabold">
            {viewYes ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
            <span>{viewYes ? '✓ SERIALIZABLE' : '✕ NOT SERIALIZABLE'}</span>
          </div>
          <span className="text-xs text-slate-600 font-mono font-bold">
            {viewYes ? `Equivalent: ${analysis.view_analysis?.equivalent_orders[0] || 'Order found'}` : 'No candidate order is equivalent'}
          </span>
        </div>
      </div>

      {/* Concise Insight */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium w-full text-center">
        💡 <strong>Key Insight:</strong> {combined.summary}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Replay Simulation
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
        >
          <Download className="w-4 h-4 text-white" /> Export Report
        </button>

        <button
          onClick={() => setShowTechnicalDetails(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs transition-all"
        >
          <Eye className="w-4 h-4 text-blue-600" /> View Detailed Technical Analysis
        </button>
      </div>

      {/* Technical Details Modal */}
      {showTechnicalDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" /> Detailed Technical Analysis & Matrix
              </h3>
              <button onClick={() => setShowTechnicalDetails(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <Comparison analysis={analysis} />

            <button
              onClick={() => setShowTechnicalDetails(false)}
              className="mt-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm self-end px-6"
            >
              Close Technical Details
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        analysis={analysis}
      />
    </div>
  );
};
