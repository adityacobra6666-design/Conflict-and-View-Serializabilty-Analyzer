import React, { useState } from 'react';
import { CombinedResult, AnalysisResult } from '../../types';
import { CheckCircle2, XCircle, Sparkles, HelpCircle, ArrowRight, Table } from 'lucide-react';

interface ComparisonProps {
  analysis: AnalysisResult;
}

export const Comparison: React.FC<ComparisonProps> = ({ analysis }) => {
  const [whyModal, setWhyModal] = useState<'conflict' | 'view' | null>(null);

  if (!analysis || !analysis.combined_result) return null;

  const combined = analysis.combined_result;
  const conflictYes = combined.conflict_serializable;
  const viewYes = combined.view_serializable;

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Combined Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-all ${
        combined.is_special_case
          ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-white border-purple-200 dark:from-purple-950/80 dark:via-slate-900 dark:to-slate-900 dark:border-purple-500/40'
          : conflictYes && viewYes
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 dark:from-emerald-950/80 dark:via-slate-900 dark:to-slate-900 dark:border-emerald-500/40'
            : 'bg-gradient-to-r from-rose-50 via-orange-50 to-white border-rose-200 dark:from-rose-950/80 dark:via-slate-900 dark:to-slate-900 dark:border-rose-500/40'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${
            combined.is_special_case
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30'
              : conflictYes && viewYes
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
          }`}>
            {combined.is_special_case ? <Sparkles className="w-8 h-8 animate-pulse text-purple-600" /> : conflictYes ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-rose-600" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{combined.headline}</h2>
              {combined.is_special_case && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold">
                  🌟 Educational Highlight
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl mt-1 leading-relaxed">{combined.summary}</p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Engine Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Conflict Engine Card */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Engine 1: Conflict Serializability</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                conflictYes
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
              }`}>
                {conflictYes ? '✓ SERIALIZABLE' : '✕ NOT SERIALIZABLE'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Precedence Graph State:</span>
                <span className="font-bold text-slate-900 dark:text-white">{analysis.has_cycle ? 'Cyclic (Cycle Exists)' : 'Acyclic (No Cycles)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Detected Conflicts:</span>
                <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{analysis.conflict_count} Pair(s)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Topological Serial Orders:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{analysis.topological_orders.length} Order(s)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setWhyModal('conflict')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" /> Why Conflict Result?
          </button>
        </div>

        {/* View Engine Card */}
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Engine 2: View Serializability</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                viewYes
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
              }`}>
                {viewYes ? '✓ SERIALIZABLE' : '✕ NOT SERIALIZABLE'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">View Equivalent Orders:</span>
                <span className="font-bold font-mono text-purple-600 dark:text-purple-400">{analysis.view_analysis?.equivalent_orders.length || 0} Found</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Candidates Evaluated:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{analysis.view_analysis?.candidate_orders_count || 0} Permutations</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Basis:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Initial Reads, Reads-From & Final Writes</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setWhyModal('view')}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" /> Why View Result?
          </button>
        </div>
      </div>

      {/* Clean Comparison Matrix Table */}
      <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Table className="w-4 h-4 text-blue-600" /> Conflict vs View Serializability Technical Matrix
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Feature Criterion</th>
                <th className="p-3">Conflict Serializability</th>
                <th className="p-3">View Serializability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Theoretical Basis</td>
                <td className="p-3 text-blue-600 dark:text-blue-400">Non-conflicting operation swaps</td>
                <td className="p-3 text-purple-600 dark:text-purple-400">State & data flow equivalence</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Main Verification Technique</td>
                <td className="p-3">Precedence Graph Cycle Detection</td>
                <td className="p-3">Exhaustive Serial Order Permutations</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Cycle Detection Sufficiency</td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Yes (Acyclic required)</td>
                <td className="p-3 text-slate-500">Not sufficient (May pass despite cycle)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Initial Reads Check</td>
                <td className="p-3 text-slate-500">Implicit</td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Explicitly Required</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Reads-From Relationships</td>
                <td className="p-3 text-slate-500">Implicit</td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Explicitly Required</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Final Writes Check</td>
                <td className="p-3 text-slate-500">Implicit</td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Explicitly Required</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Computational Complexity</td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Polynomial O(V + E)</td>
                <td className="p-3 font-bold text-amber-600 dark:text-amber-400">Factorial O(N! · M)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white font-sans">Blind Write Handling</td>
                <td className="p-3 text-rose-600 dark:text-rose-400">Causes graph cycles</td>
                <td className="p-3 font-bold text-purple-600 dark:text-purple-400">Key strength (Allows equivalence)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Why? Modal Drawer */}
      {whyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                {whyModal === 'conflict' ? 'Why Conflict Result?' : 'Why View Result?'}
              </h3>
              <button onClick={() => setWhyModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold">✕</button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-3 font-mono leading-relaxed">
              {whyModal === 'conflict' ? (
                analysis.has_cycle ? (
                  <>
                    <p className="text-rose-600 dark:text-rose-400 font-bold">The schedule is NOT Conflict Serializable because a directed cycle was detected in the precedence graph:</p>
                    <div className="p-3 bg-rose-50 dark:bg-slate-950 rounded border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 font-bold">
                      Cycle: {analysis.formatted_cycles.join(', ')}
                    </div>
                    <p className="text-slate-500">Because of this cycle, transactions cannot be ordered topologically without creating a circular dependency.</p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">The schedule IS Conflict Serializable because no directed cycles exist in the precedence graph.</p>
                    <p>Valid topological transaction serial ordering(s):</p>
                    <div className="p-3 bg-emerald-50 dark:bg-slate-950 rounded border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
                      {analysis.formatted_topological_orders.join(', ')}
                    </div>
                  </>
                )
              ) : (
                analysis.view_serializable ? (
                  <>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">The schedule IS View Serializable because at least one candidate transaction serial order is view equivalent:</p>
                    <div className="p-3 bg-purple-50 dark:bg-slate-950 rounded border border-purple-200 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 font-bold">
                      Equivalent Order(s): {analysis.view_analysis?.equivalent_orders.join(', ')}
                    </div>
                    <p className="text-slate-500">Under this serial ordering, all Initial Reads, Reads-From relationships, and Final Writes match the original schedule exactly.</p>
                  </>
                ) : (
                  <>
                    <p className="text-rose-600 dark:text-rose-400 font-bold">The schedule is NOT View Serializable because zero candidate transaction permutations satisfied all 3 view-equivalence conditions simultaneously.</p>
                  </>
                )
              )}
            </div>

            <button
              onClick={() => setWhyModal(null)}
              className="mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
