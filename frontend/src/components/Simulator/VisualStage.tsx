import React from 'react';
import { SimulationStep } from '../../types/simulation';
import { AnalysisResult } from '../../types';
import { PrecedenceGraph } from '../PrecedenceGraph/PrecedenceGraph';
import { Timeline } from '../Timeline/Timeline';
import { Check, X, Eye } from 'lucide-react';

interface VisualStageProps {
  step: SimulationStep;
  analysis: AnalysisResult;
}

export const VisualStage: React.FC<VisualStageProps> = ({ step, analysis }) => {
  // Filter edges visible up to current step
  const filteredEdges = (analysis.precedence_graph?.edges || []).filter(e =>
    step.visibleEdgeIds.includes(e.data.id)
  );

  const filteredGraphData = {
    ...analysis.precedence_graph,
    edges: filteredEdges,
    edge_count: filteredEdges.length
  };

  const isViewStage = step.state === 'VIEW_ANALYSIS' || step.state === 'CHECKING_VIEW_EQUIVALENCE';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Precedence Graph Visual Stage (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <PrecedenceGraph
          graphData={filteredGraphData}
          hasCycle={step.activeCycle !== undefined && step.activeCycle.length > 0}
          cycles={step.activeCycle ? [step.activeCycle] : []}
        />
      </div>

      {/* Side Visualizer: Timeline or Candidate Permutation Inspector (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {!isViewStage ? (
          <Timeline
            operations={analysis.operations}
            transactions={analysis.transactions}
            conflicts={analysis.conflicts}
            activeStepIndex={step.activeOp ? step.activeOp.id - 1 : undefined}
          />
        ) : (
          /* View Equivalence Permutation Inspector */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" /> Serial Order Inspector
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Testing Candidate Permutations
              </span>
            </div>

            {step.activeCandidate ? (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400">
                    Order #{step.candidateIndex}: {step.activeCandidate.formatted_order}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    step.activeCandidate.is_equivalent
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {step.activeCandidate.is_equivalent ? '✓ EQUIVALENT' : '✕ MISMATCH'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span>Initial Reads Match:</span>
                    {step.activeCandidate.match_initial_reads ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> MATCH</span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1"><X className="w-3.5 h-3.5" /> MISMATCH</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span>Reads-From Match:</span>
                    {step.activeCandidate.match_reads_from ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> MATCH</span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1"><X className="w-3.5 h-3.5" /> MISMATCH</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span>Final Writes Match:</span>
                    {step.activeCandidate.match_final_writes ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> MATCH</span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1"><X className="w-3.5 h-3.5" /> MISMATCH</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200">
                Evaluating initial reads & reads-from data flow...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
