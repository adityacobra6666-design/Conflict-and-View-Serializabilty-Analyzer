import React, { useState } from 'react';
import { Conflict } from '../../types';
import { ShieldAlert, Info, ArrowRight } from 'lucide-react';

interface ConflictAnalysisProps {
  conflicts: Conflict[];
  conflictCount: number;
}

export const ConflictAnalysis: React.FC<ConflictAnalysisProps> = ({
  conflicts,
  conflictCount
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = conflicts.filter(c => {
    if (filterType === 'ALL') return true;
    return c.conflict_type === filterType;
  });

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Conflict Pair Analysis ({conflictCount} Total)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Operations accessing identical data items across different transactions where at least one is a WRITE</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {['ALL', 'READ-WRITE', 'WRITE-READ', 'WRITE-WRITE'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                filterType === type
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Conflicts Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Preceding Op (i)</th>
                <th className="p-3">Succeeding Op (j)</th>
                <th className="p-3">Data Item</th>
                <th className="p-3">Conflict Type</th>
                <th className="p-3">Graph Edge</th>
                <th className="p-3">Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-800 dark:text-slate-200">
              {filtered.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">#{c.op1_id}: {c.op1_raw}</td>
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{c.op2_id}: {c.op2_raw}</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">{c.data_item}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.conflict_type === 'READ-WRITE' ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                      c.conflict_type === 'WRITE-READ' ? 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300' :
                      'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                    }`}>
                      {c.conflict_type}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    {c.from_tx} <ArrowRight className="w-3 h-3 text-slate-400" /> {c.to_tx}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          No conflicts matching filter standard.
        </div>
      )}

      {/* DBMS Theory Note */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">DBMS Theory Note:</span> Concurrent READ operations (<code className="font-mono text-blue-950 dark:text-white font-bold">Ri(X)</code> and <code className="font-mono text-blue-950 dark:text-white font-bold">Rj(X)</code>) never conflict because reading shared data does not alter state or create precedence constraints. Only operations involving at least one WRITE create dependencies.
        </div>
      </div>
    </div>
  );
};
