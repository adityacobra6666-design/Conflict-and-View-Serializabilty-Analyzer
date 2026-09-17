import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from '../../types';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExplanationProps {
  analysis: AnalysisResult | null;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}

export const Explanation: React.FC<ExplanationProps> = ({
  analysis,
  activeStep,
  setActiveStep
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    { title: 'Parse Schedule', desc: 'Normalize operation syntax & tokens' },
    { title: 'Validate Operations', desc: 'Check syntax, transactions & items' },
    { title: 'Find Conflicts', desc: 'Scan RW, WR, and WW pairs' },
    { title: 'Build Precedence Graph', desc: 'Construct directed dependency edges' },
    { title: 'Detect Cycles', desc: 'Search for graph cycles (DFS back-edge)' },
    { title: 'Generate Serial Orders', desc: 'Generate N! transaction permutations' },
    { title: 'Check View Equivalence', desc: 'Compare initial reads, reads-from & final writes' },
    { title: 'Final Combined Result', desc: 'Synthesize conflict vs view output' }
  ];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev: number) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, setActiveStep]);

  const handlePrev = () => {
    setIsPlaying(false);
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setActiveStep(0);
  };

  const renderStepDetails = () => {
    if (!analysis) return null;

    switch (activeStep) {
      case 0:
        return (
          <div className="p-3 bg-blue-50/70 dark:bg-slate-950 rounded-xl border border-blue-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <span className="font-bold text-blue-700 dark:text-blue-400 block">Step 1: Operation Parsing</span>
            <p>Parsed <span className="font-mono font-bold">{analysis.operation_count}</span> operations across <span className="font-mono font-bold">{analysis.transaction_count}</span> transactions (<span className="font-mono text-blue-600 dark:text-blue-400">{analysis.transactions.join(', ')}</span>).</p>
          </div>
        );
      case 1:
        return (
          <div className="p-3 bg-emerald-50/70 dark:bg-slate-950 rounded-xl border border-emerald-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block">Step 2: Schedule Validation</span>
            <p>Syntax verified! Data items accessed: <span className="font-mono font-bold">{analysis.data_items.join(', ')}</span>.</p>
          </div>
        );
      case 2:
        return (
          <div className="p-3 bg-amber-50/70 dark:bg-slate-950 rounded-xl border border-amber-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <span className="font-bold text-amber-700 dark:text-amber-400 block">Step 3: Conflict Identification</span>
            <p>Identified <span className="font-mono font-bold text-amber-600">{analysis.conflict_count}</span> conflicting pair(s) (READ-WRITE, WRITE-READ, or WRITE-WRITE on same item across different transactions).</p>
          </div>
        );
      case 3:
        return (
          <div className="p-3 bg-indigo-50/70 dark:bg-slate-950 rounded-xl border border-indigo-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <span className="font-bold text-indigo-700 dark:text-indigo-400 block">Step 4: Precedence Graph Construction</span>
            <p>Constructed directed precedence graph with <span className="font-mono font-bold">{analysis.precedence_graph.node_count}</span> nodes and <span className="font-mono font-bold">{analysis.precedence_graph.edge_count}</span> directed edges.</p>
          </div>
        );
      case 4:
        return (
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            analysis.has_cycle
              ? 'bg-rose-50/80 dark:bg-slate-950 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50/80 dark:bg-slate-950 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          }`}>
            <span className="font-bold block">{analysis.has_cycle ? 'Step 5: Cycle Detected!' : 'Step 5: Acyclic Graph'}</span>
            {analysis.has_cycle ? (
              <p>DFS found back-edge cycle: <span className="font-mono font-bold">{analysis.formatted_cycles.join(', ')}</span>. Schedule is NOT Conflict Serializable.</p>
            ) : (
              <p>No cycles detected! Precedence graph is acyclic. Schedule IS Conflict Serializable.</p>
            )}
          </div>
        );
      case 5:
        return (
          <div className="p-3 bg-purple-50/70 dark:bg-slate-950 rounded-xl border border-purple-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <span className="font-bold text-purple-700 dark:text-purple-400 block">Step 6: Topological Order Generation</span>
            {analysis.topological_orders.length > 0 ? (
              <p>Valid serial order(s): <span className="font-mono font-bold">{analysis.formatted_topological_orders.join('; ')}</span>.</p>
            ) : (
              <p>No topological orders exist due to precedence graph cycles.</p>
            )}
          </div>
        );
      case 6:
        return (
          <div className="p-3 bg-purple-50/70 dark:bg-slate-950 rounded-xl border border-purple-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <span className="font-bold text-purple-700 dark:text-purple-400 block">Step 7: View Equivalence Analysis</span>
            <p>Tested <span className="font-mono font-bold">{analysis.view_analysis?.candidate_orders_count || 0}</span> transaction permutations. View equivalent order(s): <span className="font-mono font-bold">{analysis.view_analysis?.equivalent_orders.length || 0}</span>.</p>
          </div>
        );
      case 7:
        return (
          <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 space-y-1">
            <span className="font-bold text-blue-600 dark:text-blue-400 block">Step 8: Final Synthesis</span>
            <p className="font-bold">{analysis.combined_result.headline}</p>
            <p className="text-[11px] text-slate-500">{analysis.combined_result.summary}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Step-by-Step Explanation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Interactive algorithm step stepper</p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
          Step {activeStep + 1} / {steps.length}
        </span>
      </div>

      {/* Simulation Playback Bar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePrev}
            disabled={activeStep === 0}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
            title="Previous Step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
            title={isPlaying ? 'Pause' : 'Play Step Animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <button
            onClick={handleNext}
            disabled={activeStep === steps.length - 1}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
            title="Next Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono font-medium">
          {isPlaying ? <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">▶ Playing...</span> : '⏸ Paused'}
        </div>
      </div>

      {/* Active Step Details Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepDetails()}
        </motion.div>
      </AnimatePresence>

      {/* Vertical Stepper List */}
      <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
        {steps.map((s, idx) => {
          const isCurrent = activeStep === idx;
          const isPassed = activeStep > idx;

          return (
            <motion.div
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setActiveStep(idx);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                isCurrent
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-500 shadow-sm'
                  : isPassed
                    ? 'bg-slate-50/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60 hover:opacity-100'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : isPassed
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isCurrent ? 'text-blue-900 dark:text-white' : 'text-slate-800 dark:text-slate-300'}`}>
                  {s.title}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{s.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
