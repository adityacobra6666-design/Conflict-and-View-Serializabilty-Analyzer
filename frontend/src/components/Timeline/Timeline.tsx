import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Operation, Conflict } from '../../types';
import { Clock, Info, ShieldAlert, Sparkles } from 'lucide-react';

interface TimelineProps {
  operations: Operation[];
  transactions: string[];
  conflicts: Conflict[];
  activeStep?: number;
  activeStepIndex?: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  operations,
  transactions,
  conflicts,
  activeStep,
  activeStepIndex
}) => {
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

  if (!operations || operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Clock className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No Operations to Timeline</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Enter a schedule or choose an example preset to generate the interactive chronological timeline.
        </p>
      </div>
    );
  }

  const opConflictsMap: Record<number, Conflict[]> = {};
  conflicts.forEach(c => {
    if (!opConflictsMap[c.op1_id]) opConflictsMap[c.op1_id] = [];
    if (!opConflictsMap[c.op2_id]) opConflictsMap[c.op2_id] = [];
    opConflictsMap[c.op1_id].push(c);
    opConflictsMap[c.op2_id].push(c);
  });

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            Chronological Operations Timeline
            {activeStep !== undefined && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                Step {activeStep + 1} Visual Active
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sequential operation execution across transactions</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Read</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Write</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Conflicting Pair</span>
        </div>
      </div>

      {/* Grid Timeline */}
      <div className="overflow-x-auto p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="min-w-[600px] flex flex-col gap-3">
          {/* Header Row (Time steps) */}
          <div className="grid grid-cols-[100px_1fr] gap-4 items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500">
            <div>Transaction</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${operations.length}, minmax(48px, 1fr))` }}>
              {operations.map((op, idx) => (
                <div key={op.id} className="text-center font-mono text-[11px] text-slate-500 font-bold">
                  t{idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Rows */}
          {transactions.map((tx) => {
            return (
              <div key={tx} className="grid grid-cols-[100px_1fr] gap-4 items-center py-2 border-b border-slate-200/60 dark:border-slate-900/60">
                <div className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {tx}
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${operations.length}, minmax(48px, 1fr))` }}>
                  {operations.map((op, colIdx) => {
                    const isTxMatch = op.transaction === tx;
                    const hasConflict = opConflictsMap[op.id]?.length > 0;
                    const isStepActive = (activeStepIndex !== undefined && activeStepIndex === colIdx) || (activeStep === 2 && hasConflict);

                    if (!isTxMatch) {
                      return (
                        <div key={op.id} className="h-10 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800/40" />
                        </div>
                      );
                    }

                    return (
                      <motion.button
                        key={op.id}
                        onClick={() => setSelectedOp(op)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className={`h-10 mx-0.5 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all border relative ${
                          isStepActive ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950 scale-105 shadow-md z-10' : ''
                        } ${
                          op.type === 'READ'
                            ? hasConflict
                              ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-600/80 text-amber-900 dark:text-amber-200 shadow-sm'
                              : 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-600/80 text-blue-800 dark:text-blue-200 shadow-sm'
                            : hasConflict
                              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-600/80 text-rose-900 dark:text-rose-200 shadow-sm'
                              : 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-600/80 text-indigo-800 dark:text-indigo-200 shadow-sm'
                        }`}
                      >
                        {op.raw_text}
                        {hasConflict && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-900" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Operation Inspector */}
      <AnimatePresence>
        {selectedOp && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                Operation Details: <code className="text-blue-600 font-mono">{selectedOp.raw_text}</code>
              </span>
              <button onClick={() => setSelectedOp(null)} className="text-xs text-slate-500 hover:text-slate-800">✕ Close</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">Position:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{selectedOp.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Transaction:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{selectedOp.transaction}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Operation Type:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedOp.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Data Item:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedOp.data_item}</span>
              </div>
            </div>

            {opConflictsMap[selectedOp.id]?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Conflicting Operations ({opConflictsMap[selectedOp.id].length}):
                </span>
                <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  {opConflictsMap[selectedOp.id].map((c, i) => (
                    <li key={i} className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                      {c.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
