import React, { useState } from 'react';
import { SimulationStep } from '../../types/simulation';
import { HelpCircle, Activity, ArrowRight, Info, ShieldAlert } from 'lucide-react';

interface ActionCardProps {
  step: SimulationStep;
}

export const ActionCard: React.FC<ActionCardProps> = ({ step }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              WHAT IS THE ALGORITHM DOING RIGHT NOW?
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
              {step.stageName}: {step.title}
            </h3>
          </div>
        </div>

        <button
          onClick={() => setShowWhyModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> [ WHY? ]
        </button>
      </div>

      {/* Action Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Active Op */}
        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Current Operation:</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
            {step.activeOp ? `${step.activeOp.raw_text} (${step.activeOp.transaction})` : 'N/A'}
          </span>
        </div>

        {/* Compared Op */}
        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Comparing With:</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
            {step.comparingOp ? `${step.comparingOp.raw_text} (${step.comparingOp.transaction})` : 'N/A'}
          </span>
        </div>

        {/* Result / Conflict */}
        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Result Event:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            {step.activeConflict ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">Conflict: {step.activeConflict.conflict_type}</span>
            ) : step.activeCycle ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">Cycle Detected</span>
            ) : step.activeCandidate ? (
              <span className={step.activeCandidate.is_equivalent ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                {step.activeCandidate.is_equivalent ? '✓ View Equivalent' : '✕ Permutation Check'}
              </span>
            ) : (
              'Processing'
            )}
          </span>
        </div>

        {/* Dependency Edge */}
        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Dependency Edge:</span>
          <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">
            {step.activeConflict ? `${step.activeConflict.from_tx} → ${step.activeConflict.to_tx}` : 'None'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans pt-1">
        {step.description}
      </p>

      {/* WHY Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Algorithm Rationale: {step.title}
              </h3>
              <button onClick={() => setShowWhyModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-mono">
              <p className="p-3 bg-blue-50 dark:bg-slate-950 rounded-xl border border-blue-200 dark:border-slate-800 text-blue-900 dark:text-blue-300 font-sans">
                {step.whyExplanation}
              </p>
            </div>

            <button
              onClick={() => setShowWhyModal(false)}
              className="mt-2 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
