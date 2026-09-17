import React from 'react';
import { motion } from 'framer-motion';
import { Operation, Conflict } from '../../types';
import { Layers, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface ScheduleSequencePanelProps {
  operations: Operation[];
  activeOp?: Operation;
  comparingOp?: Operation;
  activeConflict?: Conflict;
}

export const ScheduleSequencePanel: React.FC<ScheduleSequencePanelProps> = ({
  operations,
  activeOp,
  comparingOp,
  activeConflict
}) => {
  if (!operations || operations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          Schedule Operations Sequence
        </h3>
        <span className="text-[11px] font-mono text-slate-500">{operations.length} ops</span>
      </div>

      {/* Operation List */}
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {operations.map((op, idx) => {
          const isActive = activeOp?.id === op.id;
          const isComparing = comparingOp?.id === op.id;
          const isConflictPair = (activeConflict && (activeConflict.op1_id === op.id || activeConflict.op2_id === op.id));

          return (
            <motion.div
              key={op.id}
              initial={false}
              animate={{
                scale: isConflictPair || isActive || isComparing ? 1.02 : 1,
                borderColor: isConflictPair ? '#f43f5e' : isActive ? '#2563eb' : isComparing ? '#f59e0b' : '#e2e8f0'
              }}
              className={`p-2 rounded-xl border flex items-center justify-between transition-colors font-mono text-xs ${
                isConflictPair
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-600/80 text-rose-900 dark:text-rose-200 shadow-sm font-bold'
                  : isActive
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-200 shadow-sm font-bold'
                    : isComparing
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-600 text-amber-900 dark:text-amber-200 shadow-sm font-bold'
                      : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-400 font-mono w-5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-bold text-xs">{op.raw_text}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  op.type === 'READ'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                }`}>
                  {op.type}
                </span>

                {isConflictPair && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3 h-3" /> Conflict
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Conflict Callout Banner */}
      {activeConflict && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex flex-col gap-1 shadow-sm"
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Conflict Pair Discovered
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
              {activeConflict.from_tx} → {activeConflict.to_tx}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            <span className="font-mono font-bold">{activeConflict.op1_raw}</span> vs <span className="font-mono font-bold">{activeConflict.op2_raw}</span> on item <span className="font-mono font-bold">{activeConflict.data_item}</span> ({activeConflict.conflict_type}).
          </p>
        </motion.div>
      )}
    </div>
  );
};
