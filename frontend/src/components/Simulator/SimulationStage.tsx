import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from '../../types';
import { SimulationStep } from '../../types/simulation';
import { PrecedenceGraph } from '../PrecedenceGraph/PrecedenceGraph';
import { Comparison } from '../Comparison/Comparison';
import { ShieldAlert, CheckCircle2, XCircle, Sparkles, Layers, ArrowRight, Eye, Database } from 'lucide-react';

interface SimulationStageProps {
  currentStep: SimulationStep;
  analysis: AnalysisResult;
}

export const SimulationStage: React.FC<SimulationStageProps> = ({
  currentStep,
  analysis
}) => {
  const { state, activeConflict, activeCandidate, activeCycle, visibleEdgeIds } = currentStep;
  const viewInfo = analysis.view_analysis;

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={state + (currentStep.stepIndex || 0)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4"
        >
          {/* STAGE STATE 1: PARSING & VALIDATING */}
          {(state === 'PARSING' || state === 'VALIDATING') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Parsing & Input Validation</h3>
                  <p className="text-xs text-slate-500">Checking operations, transaction IDs, and target data items</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Operations</span>
                  <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono">{analysis.operation_count}</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Transactions</span>
                  <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{analysis.transaction_count} ({analysis.transactions.join(', ')})</span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Data Items</span>
                  <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">{analysis.data_items.join(', ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE STATE 2: CONFLICT DETECTION IN PROGRESS */}
          {state === 'FINDING_CONFLICTS' && (
            <div className="flex flex-col gap-4">
              {activeConflict ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Conflict Evaluation
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                      Dependency: {activeConflict.from_tx} → {activeConflict.to_tx}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Operation 1 (Precedes)</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">{activeConflict.op1_raw}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Operation 2 (Succeeds)</span>
                      <span className="font-mono font-bold text-amber-600 text-sm">{activeConflict.op2_raw}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Conflict Type</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">{activeConflict.conflict_type}</span>
                    </div>
                  </div>

                  {/* Why Conflict Explanation */}
                  <div className="p-3 bg-rose-50/70 dark:bg-slate-950 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-300 leading-relaxed font-mono">
                    💡 <strong>Conflict Rule Check:</strong> Same Data Item: <span className="font-bold">{activeConflict.data_item}</span> (✓) | Different Transactions: <span className="font-bold">{activeConflict.from_tx} vs {activeConflict.to_tx}</span> (✓) | At least one WRITE: <span className="font-bold">YES</span> (✓) ⇒ Directed edge <span className="font-bold">{activeConflict.from_tx} → {activeConflict.to_tx}</span> created.
                  </div>
                </div>
              ) : null}

              {/* Cytoscape Graph with visible edges animated so far */}
              <PrecedenceGraph
                graphData={analysis.precedence_graph}
                hasCycle={analysis.has_cycle}
                cycles={analysis.cycles}
                visibleEdgeIds={visibleEdgeIds}
              />
            </div>
          )}

          {/* STAGE STATE 3: BUILDING GRAPH & CYCLE DETECTION */}
          {(state === 'BUILDING_GRAPH' || state === 'CHECKING_CYCLE') && (
            <div className="flex flex-col gap-4">
              {activeCycle && activeCycle.length > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                    Directed Cycle Traversal: <code className="font-mono font-bold">{activeCycle.join(' → ')}</code>
                  </div>
                  <p className="text-xs text-rose-900 dark:text-rose-300 leading-relaxed font-mono">
                    DFS back-edge search encountered transaction <span className="font-bold">{activeCycle[0]}</span> while still visiting. Precedence graph contains a circular dependency, so Conflict Serializability is <strong>NO</strong>.
                  </p>
                </div>
              ) : null}

              <PrecedenceGraph
                graphData={analysis.precedence_graph}
                hasCycle={analysis.has_cycle}
                cycles={analysis.cycles}
                visibleEdgeIds={visibleEdgeIds}
                activeCycle={activeCycle}
              />
            </div>
          )}

          {/* STAGE STATE 4: VIEW SERIALIZABILITY PIPELINE & CANDIDATE ORDER CHECKING */}
          {(state === 'VIEW_ANALYSIS' || state === 'CHECKING_VIEW_EQUIVALENCE') && (
            <div className="flex flex-col gap-4">
              {/* Phase Cards: Initial Reads, Reads-From, Final Writes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-600" />
                    View Equivalence Baseline Parameters
                  </h3>
                  <span className="text-[11px] font-mono text-purple-600 font-bold">3 View Conditions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Initial Reads */}
                  <div className="p-3 bg-purple-50/60 dark:bg-slate-950 rounded-xl border border-purple-200 dark:border-slate-800 flex flex-col gap-1.5">
                    <span className="font-bold text-purple-900 dark:text-purple-300 uppercase text-[10px]">1. Initial Reads</span>
                    {viewInfo?.initial_reads && viewInfo.initial_reads.length > 0 ? (
                      viewInfo.initial_reads.map((ir, i) => (
                        <div key={i} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-purple-100 dark:border-slate-800 font-mono text-[11px]">
                          Item <span className="font-bold text-purple-600">{ir.data_item}</span> ← <span className="font-bold">{ir.transaction}</span> ({ir.raw_text})
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">None</span>
                    )}
                  </div>

                  {/* Reads-From */}
                  <div className="p-3 bg-purple-50/60 dark:bg-slate-950 rounded-xl border border-purple-200 dark:border-slate-800 flex flex-col gap-1.5">
                    <span className="font-bold text-purple-900 dark:text-purple-300 uppercase text-[10px]">2. Reads-From</span>
                    {viewInfo?.reads_from && viewInfo.reads_from.length > 0 ? (
                      viewInfo.reads_from.map((rf, i) => (
                        <div key={i} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-purple-100 dark:border-slate-800 font-mono text-[11px]">
                          {rf.read_op_raw}: {rf.reader_tx} reads {rf.data_item} from <span className="font-bold text-purple-600">{rf.writer_tx || 'INITIAL'}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">None</span>
                    )}
                  </div>

                  {/* Final Writes */}
                  <div className="p-3 bg-purple-50/60 dark:bg-slate-950 rounded-xl border border-purple-200 dark:border-slate-800 flex flex-col gap-1.5">
                    <span className="font-bold text-purple-900 dark:text-purple-300 uppercase text-[10px]">3. Final Writes</span>
                    {viewInfo?.final_writes && viewInfo.final_writes.length > 0 ? (
                      viewInfo.final_writes.map((fw, i) => (
                        <div key={i} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-purple-100 dark:border-slate-800 font-mono text-[11px]">
                          Item <span className="font-bold font-mono">{fw.data_item}</span> → Final Write: <span className="font-bold text-purple-600">{fw.transaction}</span> ({fw.raw_text})
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Candidate Equivalence Check Card */}
              {activeCandidate ? (
                <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm flex flex-col gap-3 transition-colors ${
                  activeCandidate.is_equivalent ? 'border-emerald-300 dark:border-emerald-600/80' : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Testing Candidate Order: <code className="text-purple-600 font-mono text-sm">{activeCandidate.formatted_order}</code>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      activeCandidate.is_equivalent
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {activeCandidate.is_equivalent ? '✓ VIEW EQUIVALENT' : '✕ NOT EQUIVALENT'}
                    </span>
                  </div>

                  {/* Equivalence Checks Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {activeCandidate.match_initial_reads ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold">Initial Reads: {activeCandidate.match_initial_reads ? 'MATCH' : 'MISMATCH'}</span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {activeCandidate.match_reads_from ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold">Reads-From: {activeCandidate.match_reads_from ? 'MATCH' : 'MISMATCH'}</span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {activeCandidate.match_final_writes ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold">Final Writes: {activeCandidate.match_final_writes ? 'MATCH' : 'MISMATCH'}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STAGE STATE 5: SIMULATION COMPLETE */}
          {state === 'COMPLETED' && (
            <Comparison analysis={analysis} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
