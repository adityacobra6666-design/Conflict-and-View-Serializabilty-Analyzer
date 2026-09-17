import React from 'react';
import { ViewAnalysis as ViewType } from '../../types';
import { Check, X } from 'lucide-react';

interface ViewAnalysisProps {
  viewData: ViewType;
}

export const ViewAnalysis: React.FC<ViewAnalysisProps> = ({ viewData }) => {
  if (!viewData) return null;

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            View Serializability Equivalence Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Exhaustive evaluation of Initial Reads, Reads-From, and Final Writes</p>
        </div>
        <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
          viewData.view_serializable
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
        }`}>
          View Serializable: {viewData.view_serializable ? '✓ YES' : '✗ NO'}
        </span>
      </div>

      {/* 3 Conditions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Initial Reads */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span>1. Initial Reads</span>
            <span className="text-[10px] text-slate-500 font-mono">Count: {viewData.initial_reads.length}</span>
          </div>
          {viewData.initial_reads.length > 0 ? (
            <ul className="text-xs space-y-1.5 font-mono">
              {viewData.initial_reads.map((ir, i) => (
                <li key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm">
                  <span>Item <strong className="text-amber-600 dark:text-amber-400">{ir.data_item}</strong></span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{ir.transaction} ({ir.raw_text})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">No initial value reads detected.</p>
          )}
        </div>

        {/* 2. Reads-From Relationships */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span>2. Reads-From Relationships</span>
            <span className="text-[10px] text-slate-500 font-mono">Count: {viewData.reads_from.length}</span>
          </div>
          {viewData.reads_from.length > 0 ? (
            <ul className="text-xs space-y-1.5 font-mono">
              {viewData.reads_from.map((rf, i) => (
                <li key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm">
                  <span>{rf.read_op_raw} on {rf.data_item}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    ← {rf.writer_tx ? `${rf.writer_tx} (${rf.writer_op_raw})` : 'Initial State'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">No read operations present.</p>
          )}
        </div>

        {/* 3. Final Writes */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span>3. Final Writes</span>
            <span className="text-[10px] text-slate-500 font-mono">Count: {viewData.final_writes.length}</span>
          </div>
          {viewData.final_writes.length > 0 ? (
            <ul className="text-xs space-y-1.5 font-mono">
              {viewData.final_writes.map((fw, i) => (
                <li key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm">
                  <span>Item <strong className="text-amber-600 dark:text-amber-400">{fw.data_item}</strong></span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{fw.transaction} ({fw.raw_text})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">No write operations present.</p>
          )}
        </div>
      </div>

      {/* Candidate Serial Orders Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Exhaustive Candidate Serial Permutations ({viewData.candidate_orders_count} Total)
          </h4>
          {viewData.candidate_orders_count > 24 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">⚠️ Large permutation count ($N!$)</span>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
              <tr>
                <th className="p-3">Candidate Serial Order</th>
                <th className="p-3 text-center">Initial Reads Match</th>
                <th className="p-3 text-center">Reads-From Match</th>
                <th className="p-3 text-center">Final Writes Match</th>
                <th className="p-3 text-center">View Equivalent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-800 dark:text-slate-200">
              {viewData.candidate_results.map((c, idx) => (
                <tr key={idx} className={c.is_equivalent ? 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}>
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.formatted_order}</td>
                  <td className="p-3 text-center">
                    {c.match_initial_reads ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" /> : <X className="w-4 h-4 text-rose-500 inline" />}
                  </td>
                  <td className="p-3 text-center">
                    {c.match_reads_from ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" /> : <X className="w-4 h-4 text-rose-500 inline" />}
                  </td>
                  <td className="p-3 text-center">
                    {c.match_final_writes ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" /> : <X className="w-4 h-4 text-rose-500 inline" />}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {c.is_equivalent ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400">✓ YES</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400">✗ NO</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
