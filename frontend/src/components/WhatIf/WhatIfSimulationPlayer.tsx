import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult, Operation, PrecedenceGraph as GraphType } from '../../types';
import { WhatIfComparisonResult, OpDiff } from '../../types/whatif';
import { SimplePrecedenceGraph } from './SimplePrecedenceGraph';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, AlertTriangle, CheckCircle2,
  XCircle, ArrowRight, Table, Layers, FileText, Sparkles, RefreshCw, HelpCircle,
  Activity, Check, Eye
} from 'lucide-react';

export interface WhatIfSimulationPlayerProps {
  baselineAnalysis: AnalysisResult;
  experimentalAnalysis: AnalysisResult;
  comparison: WhatIfComparisonResult;
  scheduleText: string;
  autoStart?: boolean;
  simKey?: number;
}

export interface SimulationStep {
  stepNumber: number;
  totalSteps: number;
  phase: 'PARSING' | 'VALIDATING' | 'OPERATIONS' | 'CONFLICT_DETECTION' | 'BUILDING_GRAPH' | 'CYCLE_DETECTION' | 'VIEW_SERIALIZABILITY' | 'FINAL_COMPARISON';
  phaseTitle: string;
  title: string;
  description: string;
  currentOpIndex?: number;
  currentOp?: Operation;
  conflictInfo?: {
    op1Raw: string;
    op2Raw: string;
    tx1: string;
    tx2: string;
    dataItem: string;
    reason: string;
    dependency: string;
  }[];
  visibleEdgeIds: string[];
  activeCycle?: string[];
}

export const WhatIfSimulationPlayer: React.FC<WhatIfSimulationPlayerProps> = ({
  baselineAnalysis,
  experimentalAnalysis,
  comparison,
  scheduleText,
  autoStart = true,
  simKey = 0
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoStart);
  const [speedMs, setSpeedMs] = useState<number>(800);

  // Reset to step 0 and auto start whenever simKey changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(true);
  }, [simKey]);

  // Generate deterministic simulation steps based on experimental analysis
  const steps: SimulationStep[] = useMemo(() => {
    const list: SimulationStep[] = [];
    const expOps = experimentalAnalysis.operations || [];
    const expConflicts = experimentalAnalysis.conflicts || [];
    const expEdges = experimentalAnalysis.precedence_graph?.edges || [];
    const allEdgeIds = expEdges.map(e => e.data.id);

    let stepCounter = 1;

    // STEP 1: Parsing Schedule
    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'PARSING',
      phaseTitle: 'PARSING SCHEDULE',
      title: 'Step 1: Parsing Schedule',
      description: `Parsing experimental schedule into ${expOps.length} operation(s) across ${experimentalAnalysis.transaction_count} transaction(s).`,
      visibleEdgeIds: []
    });

    // STEP 2: Validating Schedule
    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'VALIDATING',
      phaseTitle: 'VALIDATING SCHEDULE',
      title: 'Step 2: Validating Schedule Syntax',
      description: `Validated syntax and transaction bounds. Schedule contains transactions: ${(experimentalAnalysis.transactions || []).join(', ')}.`,
      visibleEdgeIds: []
    });

    // STEPS 3..N: Processing Each Operation
    expOps.forEach((op, opIdx) => {
      list.push({
        stepNumber: stepCounter++,
        totalSteps: 0,
        phase: 'OPERATIONS',
        phaseTitle: 'PROCESSING OPERATIONS',
        title: `Processing Operation #${op.id}: ${op.raw_text}`,
        description: `Transaction ${op.transaction} executes ${op.type} on data item ${op.data_item}.`,
        currentOpIndex: opIdx,
        currentOp: op,
        visibleEdgeIds: []
      });
    });

    // STEP: Checking Conflicts
    const conflictDetails = expConflicts.map(c => {
      const txFrom = c.from_tx || c.op1_tx;
      const txTo = c.to_tx || c.op2_tx;
      return {
        op1Raw: c.op1_raw,
        op2Raw: c.op2_raw,
        tx1: txFrom,
        tx2: txTo,
        dataItem: c.data_item,
        reason: `Different transactions (${txFrom} ≠ ${txTo}), same data item (${c.data_item}), at least one WRITE operation.`,
        dependency: `${txFrom} → ${txTo}`
      };
    });

    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'CONFLICT_DETECTION',
      phaseTitle: 'CHECKING CONFLICTS',
      title: conflictDetails.length > 0 ? `Found ${conflictDetails.length} Conflicting Operation Pair(s)` : 'No Conflicts Detected',
      description: conflictDetails.length > 0
        ? `Identified ${conflictDetails.length} conflicting operation pair(s) in the experimental schedule.`
        : 'No conflicting operations found across different transactions accessing the same data item with a WRITE.',
      conflictInfo: conflictDetails,
      visibleEdgeIds: []
    });

    // STEP: Building Precedence Graph
    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'BUILDING_GRAPH',
      phaseTitle: 'BUILDING PRECEDENCE GRAPH',
      title: 'Building Precedence Graph',
      description: `Constructed directed graph with ${expEdges.length} dependency edge(s): ${expEdges.map(e => `${e.data.source} → ${e.data.target}`).join(', ') || 'None'}.`,
      conflictInfo: conflictDetails,
      visibleEdgeIds: allEdgeIds
    });

    // STEP: Checking Cycle
    const hasCycle = experimentalAnalysis.has_cycle;
    const cyclePath = experimentalAnalysis.cycles?.[0] || [];

    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'CYCLE_DETECTION',
      phaseTitle: 'CHECKING CYCLE',
      title: hasCycle ? `🔴 CYCLE DETECTED: ${(experimentalAnalysis.formatted_cycles || [])[0] || 'Cycle Found'}` : '🟢 NO CYCLE DETECTED',
      description: hasCycle
        ? `Cycle detected in precedence graph (${cyclePath.join(' → ')}). Conflict Serializability: ❌ NOT SERIALIZABLE.`
        : `Precedence graph is acyclic. Valid topological serial order: ${(experimentalAnalysis.formatted_topological_orders || [])[0] || 'Available'}. Conflict Serializability: ✅ SERIALIZABLE.`,
      visibleEdgeIds: allEdgeIds,
      activeCycle: hasCycle ? cyclePath : undefined
    });

    // STEP: View Serializability
    const viewSer = experimentalAnalysis.view_serializable;
    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'VIEW_SERIALIZABILITY',
      phaseTitle: 'CHECKING VIEW SERIALIZABILITY',
      title: 'Checking View Serializability',
      description: `Evaluated Initial Reads, Reads-From relationships, and Final Writes. View Serializability: ${viewSer ? '✅ SERIALIZABLE' : '❌ NOT SERIALIZABLE'}.`,
      visibleEdgeIds: allEdgeIds
    });

    // STEP: Final Comparison
    list.push({
      stepNumber: stepCounter++,
      totalSteps: 0,
      phase: 'FINAL_COMPARISON',
      phaseTitle: 'FINAL COMPARISON',
      title: 'Final Summary: Original Baseline vs What-If',
      description: comparison.explanation || 'Simulation completed. Compare baseline vs experimental schedule impact below.',
      visibleEdgeIds: allEdgeIds
    });

    const total = list.length;
    return list.map(item => ({ ...item, totalSteps: total }));
  }, [experimentalAnalysis, comparison]);

  // Timer effect for automatic playback
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speedMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speedMs, steps.length]);

  const activeStep = steps[currentStep] || steps[0];
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl overflow-hidden">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Activity className="w-4 h-4 animate-pulse" />
              </span>
              <h2 className="text-lg font-extrabold text-white tracking-tight uppercase">
                WHAT-IF SIMULATION
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {activeStep.title}
            </p>
          </div>

          {/* CONTROLS: Previous | Play/Pause | Next | Restart */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              ◀ Previous
            </button>

            <button
              onClick={togglePlay}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              {isPlaying ? 'Pause' : currentStep >= steps.length - 1 ? 'Replay' : 'Play'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              Next ▶
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <button
              onClick={handleRestart}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-purple-400 font-bold uppercase tracking-wider">
              Phase: {activeStep.phaseTitle}
            </span>
            <span className="text-slate-400">{progressPercent}% Progress</span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* OPERATION HIGHLIGHT TIMELINE */}
      <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-400" /> EXPERIMENTAL SCHEDULE OPERATIONS
        </span>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-1">
          {(experimentalAnalysis.operations || []).map((op, idx) => {
            const isCurrent = activeStep.currentOpIndex === idx;
            const isCompleted = activeStep.currentOpIndex !== undefined && idx < activeStep.currentOpIndex;
            const isUpcoming = activeStep.currentOpIndex !== undefined && idx > activeStep.currentOpIndex;

            return (
              <div
                key={op.id}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                  isCurrent
                    ? 'bg-purple-600 text-white border-purple-300 shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/50 scale-105'
                    : isCompleted
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {isCompleted && <span className="text-emerald-400">✓</span>}
                {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                {isUpcoming && <span className="text-slate-600">○</span>}
                <span>{op.raw_text}</span>
                {isCurrent && <span className="text-[9px] uppercase font-sans font-extrabold px-1 py-0.2 rounded bg-white text-purple-900 ml-1">CURRENT</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP CONTENT & EXPLANATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STEP EXPLANATION & CONFLICT / CYCLE INFO (7 COLUMNS) */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
              EXPLANATION & ANALYSIS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold">
              {activeStep.phase}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
            {activeStep.description}
          </p>

          {/* CONFLICT DETECTED DISPLAY */}
          {activeStep.conflictInfo && activeStep.conflictInfo.length > 0 && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-purple-950/40 border border-purple-500/40">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> CONFLICT DETECTED
              </span>

              {activeStep.conflictInfo.map((c, cIdx) => (
                <div key={cIdx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>CONFLICT: {c.op1Raw} ↔ {c.op2Raw}</span>
                    <span className="text-emerald-400 font-mono font-extrabold">DEPENDENCY: {c.dependency}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans italic">
                    Reason: {c.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CYCLE DETECTION RESULT */}
          {activeStep.phase === 'CYCLE_DETECTION' && (
            <div className={`p-4 rounded-xl border flex flex-col gap-2 font-mono text-xs ${
              experimentalAnalysis.has_cycle
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <span>{experimentalAnalysis.has_cycle ? '🔴 CYCLE DETECTED' : '🟢 NO CYCLE'}</span>
                <span>Conflict Serializability: {experimentalAnalysis.has_cycle ? '❌ NOT SERIALIZABLE' : '✅ SERIALIZABLE'}</span>
              </div>
              {experimentalAnalysis.has_cycle && (
                <p className="text-xs text-rose-300">
                  Cycle Path: {(experimentalAnalysis.formatted_cycles || [])[0] || 'T1 → T2 → T1'}
                </p>
              )}
            </div>
          )}

          {/* VIEW SERIALIZABILITY STEP */}
          {activeStep.phase === 'VIEW_SERIALIZABILITY' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3 font-mono text-xs">
              <span className="font-bold text-white text-xs uppercase tracking-wider">VIEW SERIALIZABILITY CRITERIA</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                  ✓ Initial Reads
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                  ✓ Reads-From
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                  ✓ Final Writes
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-center font-bold text-xs text-purple-300">
                View Serializability: {experimentalAnalysis.view_serializable ? '✅ SERIALIZABLE' : '❌ NOT SERIALIZABLE'}
              </div>
            </div>
          )}

          {/* ORIGINAL vs WHAT-IF COMPARISON AT FINAL STEP */}
          {activeStep.phase === 'FINAL_COMPARISON' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-white uppercase font-mono">
                ORIGINAL vs WHAT-IF COMPARISON
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Analysis Metric</th>
                      <th className="p-2.5">ORIGINAL</th>
                      <th className="p-2.5">WHAT-IF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold">Conflict Serializability</td>
                      <td className="p-2.5 font-bold">{baselineAnalysis?.conflict_serializable ? '✅ YES' : '❌ NO'}</td>
                      <td className="p-2.5 font-bold">{experimentalAnalysis?.conflict_serializable ? '✅ YES' : '❌ NO'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">View Serializability</td>
                      <td className="p-2.5 font-bold">{baselineAnalysis?.view_serializable ? '✅ YES' : '❌ NO'}</td>
                      <td className="p-2.5 font-bold">{experimentalAnalysis?.view_serializable ? '✅ YES' : '❌ NO'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Cycle Status</td>
                      <td className="p-2.5">{baselineAnalysis?.has_cycle ? 'Cyclic' : 'Acyclic'}</td>
                      <td className="p-2.5">{experimentalAnalysis?.has_cycle ? 'Cyclic' : 'Acyclic'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-mono text-purple-200">
                <strong>WHAT CHANGED: </strong>
                {comparison.explanation || 'Modified experimental schedule operations.'}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SIMPLE SVG PRECEDENCE GRAPH (5 COLUMNS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <SimplePrecedenceGraph
            graphData={experimentalAnalysis.precedence_graph}
            hasCycle={experimentalAnalysis.has_cycle}
            cycles={experimentalAnalysis.cycles}
            visibleEdgeIds={activeStep.visibleEdgeIds}
            activeCycle={activeStep.activeCycle}
          />
        </div>
      </div>
    </div>
  );
};
