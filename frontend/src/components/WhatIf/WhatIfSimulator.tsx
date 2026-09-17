import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult, ExampleSchedule } from '../../types';
import { WhatIfExperiment, WhatIfComparisonResult } from '../../types/whatif';
import { apiService } from '../../services/api';
import { ScheduleEditor } from '../ScheduleEditor/ScheduleEditor';
import { WhatIfSimulationPlayer } from './WhatIfSimulationPlayer';
import { computeLocalAnalysis, computeLocalComparison } from './whatIfHelper';
import {
  RotateCcw, Plus, Play, Sparkles, AlertTriangle, CheckCircle2, XCircle,
  HelpCircle, Layers, ArrowRight, Table, RefreshCw, FileText, Split, ArrowLeft
} from 'lucide-react';

// LOCAL ERROR BOUNDARY FOR WHAT-IF SIMULATOR ONLY
interface ErrorBoundaryProps {
  children: ReactNode;
  onGoToAnalyzer?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WhatIfErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WhatIfSimulator Error Boundary Caught Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Simulation could not be completed.</h2>
          <p className="text-xs text-slate-500 max-w-md">
            An unexpected error occurred during what-if analysis execution.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Restart What-If
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface WhatIfSimulatorProps {
  baselineAnalysis: AnalysisResult | null;
  examples: ExampleSchedule[];
  onOpenAiTutor: () => void;
  onGoToAnalyzer?: () => void;
}

const DEFAULT_BASELINE_TEXT = 'R1(X), W2(X), W1(X)';

export const WhatIfSimulatorContent: React.FC<WhatIfSimulatorProps> = ({
  baselineAnalysis,
  examples,
  onOpenAiTutor,
  onGoToAnalyzer
}) => {
  // Ensure we always have an effective baseline analysis
  const effectiveBaseline = useMemo<AnalysisResult>(() => {
    if (baselineAnalysis && baselineAnalysis.success && baselineAnalysis.schedule_text) {
      return baselineAnalysis;
    }
    return computeLocalAnalysis(DEFAULT_BASELINE_TEXT);
  }, [baselineAnalysis]);

  const [experiments, setExperiments] = useState<WhatIfExperiment[]>(() => {
    return [{
      id: 'exp_1',
      title: 'Experiment #1',
      scheduleText: effectiveBaseline.schedule_text || DEFAULT_BASELINE_TEXT,
      analysis: null,
      comparison: null,
      createdAt: new Date().toLocaleTimeString()
    }];
  });

  const [activeExpId, setActiveExpId] = useState<string>('exp_1');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simKey, setSimKey] = useState<number>(Date.now());
  const simulationRef = useRef<HTMLDivElement>(null);

  // Sync initial schedule text when effective baseline updates
  useEffect(() => {
    if (experiments.length === 1 && !experiments[0].analysis && effectiveBaseline.schedule_text) {
      setExperiments(prev => prev.map(e => ({
        ...e,
        scheduleText: effectiveBaseline.schedule_text
      })));
    }
  }, [effectiveBaseline]);

  const activeExp = experiments.find(e => e.id === activeExpId) || experiments[0];

  const handleUpdateExpSchedule = (text: string) => {
    setExperiments(prev => prev.map(e => {
      if (e.id === activeExpId) {
        return { ...e, scheduleText: text };
      }
      return e;
    }));
  };

  const handleRunWhatIfAnalysis = async () => {
    if (!activeExp || !activeExp.scheduleText?.trim()) return;

    setLoading(true);
    try {
      // 1. Analyze experimental schedule (try backend API, fallback to local analysis)
      let expRes: AnalysisResult;
      try {
        expRes = await apiService.analyzeSchedule(activeExp.scheduleText);
      } catch (err) {
        expRes = computeLocalAnalysis(activeExp.scheduleText);
      }

      // 2. Compare baseline vs experimental schedule
      let compRes: WhatIfComparisonResult;
      try {
        const compApi = await apiService.compareAnalysis(effectiveBaseline, expRes);
        compRes = compApi.comparison;
      } catch (err) {
        compRes = computeLocalComparison(effectiveBaseline, expRes);
      }

      // 3. Update active experiment state
      setExperiments(prev => prev.map(e => {
        if (e.id === activeExpId) {
          return {
            ...e,
            analysis: expRes,
            comparison: compRes
          };
        }
        return e;
      }));

      // 4. Activate simulation and trigger step auto-play reset
      setIsSimulating(true);
      setSimKey(Date.now());

      // Scroll smoothly to simulation panel
      setTimeout(() => {
        simulationRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error("What-If analysis failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewExperiment = () => {
    const count = experiments.length + 1;
    const newExp: WhatIfExperiment = {
      id: `exp_${Date.now()}`,
      title: `Experiment #${count}`,
      scheduleText: effectiveBaseline.schedule_text || DEFAULT_BASELINE_TEXT,
      analysis: null,
      comparison: null,
      createdAt: new Date().toLocaleTimeString()
    };
    setExperiments(prev => [...prev, newExp]);
    setActiveExpId(newExp.id);
  };

  const handleResetToBaseline = () => {
    setExperiments(prev => prev.map(e => {
      if (e.id === activeExpId) {
        return {
          ...e,
          scheduleText: effectiveBaseline.schedule_text || DEFAULT_BASELINE_TEXT,
          analysis: null,
          comparison: null
        };
      }
      return e;
    }));
    setIsSimulating(false);
  };

  const expScheduleText = activeExp?.scheduleText ?? effectiveBaseline.schedule_text ?? DEFAULT_BASELINE_TEXT;

  return (
    <div className="flex flex-col gap-6 max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Experiment Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              What-If Schedule Simulator
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                Interactive Simulation
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Modify schedules experimentally and observe real-time step-by-step impact on serializability</p>
          </div>
        </div>

        {/* Experiment History Tabs & Controls */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {experiments.map(exp => (
            <button
              key={exp.id}
              onClick={() => setActiveExpId(exp.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeExpId === exp.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {exp.title}
            </button>
          ))}

          <button
            onClick={handleCreateNewExperiment}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-bold flex items-center gap-1"
            title="Create Fresh Experiment"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      {/* SECTION 1: SIDE-BY-SIDE SCHEDULE EDITORS (BASELINE vs EXPERIMENTAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* READ-ONLY ORIGINAL BASELINE PANEL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Original — Baseline (Read Only)
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Baseline Schedule
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold">
              🔒 Baseline Immutable
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-900 dark:text-slate-100">
            {effectiveBaseline.schedule_text}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block">Conflict Serial:</span>
              <span className={`font-bold font-mono ${effectiveBaseline.conflict_serializable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {effectiveBaseline.conflict_serializable ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block">View Serial:</span>
              <span className={`font-bold font-mono ${effectiveBaseline.view_serializable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {effectiveBaseline.view_serializable ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block">Graph Edges:</span>
              <span className="font-bold font-mono text-blue-600">{effectiveBaseline.precedence_graph?.edge_count ?? 0}</span>
            </div>
          </div>
        </div>

        {/* EDITABLE EXPERIMENTAL SCHEDULE PANEL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400 block">
                Experimental Version ({activeExp?.title || 'Experiment'})
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Modify Schedule Operations
              </h3>
            </div>

            <button
              onClick={handleResetToBaseline}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Baseline
            </button>
          </div>

          <ScheduleEditor
            scheduleText={expScheduleText}
            setScheduleText={handleUpdateExpSchedule}
            onAnalyze={() => handleRunWhatIfAnalysis()}
            examples={examples}
            loading={loading}
          />

          <button
            onClick={handleRunWhatIfAnalysis}
            disabled={loading || !expScheduleText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            {loading ? 'Preparing Simulation...' : 'Run What-If Analysis'}
          </button>
        </div>
      </div>

      {/* SECTION 2: SIMULATION PANEL BELOW EDITOR */}
      <div ref={simulationRef}>
        {activeExp?.analysis && activeExp?.comparison && (
          <AnimatePresence mode="wait">
            <motion.div
              key={simKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <WhatIfSimulationPlayer
                baselineAnalysis={effectiveBaseline}
                experimentalAnalysis={activeExp.analysis}
                comparison={activeExp.comparison}
                scheduleText={activeExp.scheduleText}
                autoStart={true}
                simKey={simKey}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// EXPORT WITH LOCAL ERROR BOUNDARY WRAPPER
export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = (props) => {
  return (
    <WhatIfErrorBoundary onGoToAnalyzer={props.onGoToAnalyzer}>
      <WhatIfSimulatorContent {...props} />
    </WhatIfErrorBoundary>
  );
};
