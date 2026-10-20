import React from 'react';
import { AnalysisResult } from '../../types';
import { Table, CheckCircle2, XCircle, Sparkles, HelpCircle, Layers } from 'lucide-react';

interface Props {
  analysis: AnalysisResult;
}

export const TransactionViewEquivalenceTable: React.FC<Props> = ({ analysis }) => {
  if (!analysis || !analysis.success) return null;

  const { operations, transactions, view_analysis, conflict_serializable, view_serializable, topological_orders } = analysis;
  const initialReads = view_analysis?.initial_reads || [];
  const readsFrom = view_analysis?.reads_from || [];
  const finalWrites = view_analysis?.final_writes || [];
  const equivalentOrders = view_analysis?.equivalent_orders || [];

  // Data items mapped to final writing transaction
  const finalWriterMap = new Map<string, string>();
  finalWrites.forEach(fw => {
    finalWriterMap.set(fw.data_item, fw.transaction);
  });

  // Build row data for each transaction
  const rows = transactions.map(tx => {
    // 1. Reads
    const txReadOps = operations.filter(op => op.transaction === tx && op.type === 'READ');
    
    // 2. Read-From Relationships
    const rfDetails = txReadOps.map(op => {
      const match = readsFrom.find(rf => rf.reader_tx === tx && rf.read_op_raw === op.raw_text);
      if (match && match.writer_tx) {
        return {
          opRaw: op.raw_text,
          sourceText: `${match.writer_tx} (${match.writer_op_raw})`,
          isInitial: false
        };
      }
      return {
        opRaw: op.raw_text,
        sourceText: 'Initial State (DB)',
        isInitial: true
      };
    });

    // 3. Writes
    const txWriteOps = operations.filter(op => op.transaction === tx && op.type === 'WRITE');

    // 4. Final Writes check
    const itemsWrittenByTx = Array.from(new Set(txWriteOps.map(op => op.data_item)));
    const finalWriteStatus = itemsWrittenByTx.map(item => {
      const isFinal = finalWriterMap.get(item) === tx;
      const actualFinalWriter = finalWriterMap.get(item);
      return {
        item,
        isFinal,
        actualFinalWriter
      };
    });

    // 5. View-Equivalence Notes
    const notes: string[] = [];
    
    // Check for blind write: writes an item without having read it previously in tx
    const readItemsInTx = new Set(txReadOps.map(op => op.data_item));
    txWriteOps.forEach(wOp => {
      // Check if read occurred before this write in schedule
      const hadPriorRead = txReadOps.some(rOp => rOp.data_item === wOp.data_item && rOp.id < wOp.id);
      if (!hadPriorRead) {
        notes.push(`Blind write on ${wOp.data_item} (${wOp.raw_text}) without prior read`);
      }
    });

    // Check initial reads constraint
    rfDetails.forEach(rf => {
      if (rf.isInitial) {
        const item = rf.opRaw.match(/\((.*?)\)/)?.[1] || '';
        notes.push(`Reads initial ${item}; must precede any write to ${item} in view-equivalent order`);
      } else {
        notes.push(`Reads from ${rf.sourceText}; requires ${rf.sourceText.split(' ')[0]} to precede ${tx}`);
      }
    });

    // Check final write constraint
    finalWriteStatus.forEach(fw => {
      if (fw.isFinal) {
        notes.push(`Performs final write on ${fw.item}; must execute after all other writers of ${fw.item}`);
      } else if (fw.actualFinalWriter) {
        notes.push(`Write on ${fw.item} is overwritten by ${fw.actualFinalWriter}`);
      }
    });

    if (notes.length === 0) {
      notes.push('Standard execution; no conflicting or overwritten dependencies');
    }

    return {
      tx,
      readOps: txReadOps,
      rfDetails,
      writeOps: txWriteOps,
      finalWriteStatus,
      notes
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-600" />
            Transaction and View-Equivalence Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Per-transaction audit of Initial Reads, Reads-From dependencies, Final Writes, and Blind Writes
          </p>
        </div>

        {/* Verdict Badges */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
            conflict_serializable 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
          }`}>
            {conflict_serializable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            Conflict: {conflict_serializable ? 'YES' : 'NO'}
          </span>

          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
            view_serializable 
              ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
          }`}>
            {view_serializable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            View: {view_serializable ? 'YES' : 'NO'}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3 w-28">Transaction</th>
              <th className="p-3 w-36">Read Operations</th>
              <th className="p-3 min-w-[180px]">Read-From Relationships</th>
              <th className="p-3 w-36">Write Operations</th>
              <th className="p-3 min-w-[150px]">Final Write</th>
              <th className="p-3 min-w-[240px]">View-Equivalence Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-800 dark:text-slate-200">
            {rows.map((r) => (
              <tr key={r.tx} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 align-top">
                {/* 1. Transaction Identifier */}
                <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                  <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                    {r.tx}
                  </span>
                </td>

                {/* 2. Read Operations */}
                <td className="p-3 font-mono text-[11px]">
                  {r.readOps.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.readOps.map((op, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 font-bold">
                          {op.raw_text}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </td>

                {/* 3. Read-From Relationships */}
                <td className="p-3 text-[11px] space-y-1">
                  {r.rfDetails.length > 0 ? (
                    r.rfDetails.map((rf, i) => (
                      <div key={i} className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{rf.opRaw}</span>
                        <span className="text-slate-400">←</span>
                        <span className={rf.isInitial ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-indigo-600 dark:text-indigo-400 font-bold'}>
                          {rf.sourceText}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 italic font-mono">No reads performed</span>
                  )}
                </td>

                {/* 4. Write Operations */}
                <td className="p-3 font-mono text-[11px]">
                  {r.writeOps.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.writeOps.map((op, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold">
                          {op.raw_text}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </td>

                {/* 5. Final Write Status */}
                <td className="p-3 text-[11px] space-y-1 font-mono">
                  {r.finalWriteStatus.length > 0 ? (
                    r.finalWriteStatus.map((fw, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{fw.item}:</span>
                        {fw.isFinal ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            ✓ Final Writer
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">
                            Overwritten by {fw.actualFinalWriter}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No writes performed</span>
                  )}
                </td>

                {/* 6. View-Equivalence Notes */}
                <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <ul className="list-disc list-inside space-y-0.5">
                    {r.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparative Serial Conclusion Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 text-xs font-sans">
        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Equivalence Evaluation Conclusion
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Conflict Serializability Status</span>
            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
              {conflict_serializable ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ SERIALIZABLE (Topological order: {topological_orders.map(o => o.join(' → ')).join(', ') || 'N/A'})
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">
                  ✕ NOT CONFLICT SERIALIZABLE (Precedence graph contains directed cycle)
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">View Serializability Status</span>
            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
              {view_serializable ? (
                <span className="text-purple-600 dark:text-purple-400">
                  ✓ VIEW SERIALIZABLE (Equivalent serial order: {equivalentOrders.join(', ')})
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">
                  ✕ NOT VIEW SERIALIZABLE (Zero candidate permutations satisfy initial reads, reads-from, and final writes)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
