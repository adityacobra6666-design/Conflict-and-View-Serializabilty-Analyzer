import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleEditor } from '../components/ScheduleEditor/ScheduleEditor';
import { ScheduleSequencePanel } from '../components/Simulator/ScheduleSequencePanel';
import { SimulationHeader } from '../components/Simulator/SimulationHeader';
import { SimulationStage } from '../components/Simulator/SimulationStage';
import { Explanation } from '../components/Explanation/Explanation';
import { Comparison } from '../components/Comparison/Comparison';
import { ExportModal } from '../components/Export/ExportModal';
import { AnalysisResult, ExampleSchedule } from '../types';
import { generateSimulationSteps } from '../services/simulationEngine';
import { apiService } from '../services/api';
import { Download, Bot, Layers, Sparkles, Activity, Split } from 'lucide-react';

interface AnalyzerProps {
  initialScheduleText?: string;
  examples: ExampleSchedule[];
  onOpenAiTutor: () => void;
  onOpenWhatIf?: () => void;
  analysis: AnalysisResult | null;
  setAnalysis: (res: AnalysisResult | null) => void;
}

export const Analyzer: React.FC<AnalyzerProps> = ({
  initialScheduleText,
  examples,
  onOpenAiTutor,
  onOpenWhatIf,
  analysis,
  setAnalysis
}) => {
  const [scheduleText, setScheduleText] = useState<string>(initialScheduleText || "R1(X), W2(X), W1(X), W3(X)");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Generate simulation steps from real backend API analysis data
  const simulationSteps = analysis && analysis.success ? generateSimulationSteps(analysis) : [];
  const currentStep = simulationSteps[currentStepIndex] || null;

  const handleRunAnalysis = async (overrideText?: string) => {
    const targetText = overrideText !== undefined ? overrideText : scheduleText;
    if (!targetText.trim()) return;

    setIsPlaying(false);
    setLoading(true);
    try {
      const res = await apiService.analyzeSchedule(targetText);
      setAnalysis(res);
      setScheduleText(targetText);
      setCurrentStepIndex(0);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!analysis && scheduleText) {
      handleRunAnalysis(scheduleText);
    }
  }, []);

  // Auto-playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && simulationSteps.length > 0) {
      const intervalMs = Math.round(1800 / speed);
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simulationSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, simulationSteps.length, speed]);

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStepIndex < simulationSteps.length - 1) setCurrentStepIndex(currentStepIndex + 1);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  // Map 12 simulation steps to explanation's 8 stepper steps
  const mappedExplanationStep = currentStep
    ? currentStep.state === 'PARSING' ? 0
      : currentStep.state === 'VALIDATING' ? 1
      : currentStep.state === 'FINDING_CONFLICTS' ? 2
      : currentStep.state === 'BUILDING_GRAPH' ? 3
      : currentStep.state === 'CHECKING_CYCLE' ? 4
      : currentStep.state === 'GENERATING_SERIAL_ORDERS' ? 5
      : (currentStep.state === 'VIEW_ANALYSIS' || currentStep.state === 'CHECKING_VIEW_EQUIVALENCE') ? 6
      : 7
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              Interactive Serializability Simulator
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/30">
                Real Backend API Engine
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Watch Conflict & View Serializability Algorithms Execute Step-by-Step</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenWhatIf && (
            <button
              onClick={onOpenWhatIf}
              disabled={!analysis}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-colors disabled:opacity-40 shadow-sm"
            >
              <Split className="w-4 h-4 text-purple-600 dark:text-purple-400" /> 🔄 What-If Simulator
            </button>
          )}

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!analysis}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40 shadow-sm"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Export PDF / JSON / CSV
          </button>

          <button
            onClick={onOpenAiTutor}
            disabled={!analysis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105 disabled:opacity-40"
          >
            <Bot className="w-4 h-4 text-white" /> AI Tutor Assistant
          </button>
        </div>
      </div>

      {/* 3-AREA MAIN LAYOUT (LEFT - CENTER - RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AREA 1 (LEFT 3 Cols): Schedule Input & Operations Sequence */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <ScheduleEditor
            scheduleText={scheduleText}
            setScheduleText={setScheduleText}
            onAnalyze={handleRunAnalysis}
            examples={examples}
            loading={loading}
          />

          {analysis && analysis.success && (
            <ScheduleSequencePanel
              operations={analysis.operations}
              activeOp={currentStep?.activeOp}
              comparingOp={currentStep?.comparingOp}
              activeConflict={currentStep?.activeConflict}
            />
          )}
        </div>

        {/* AREA 2 (CENTER 6 Cols HERO STAGE): Simulation Header & Stage */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {analysis && analysis.success && currentStep ? (
            <>
              {/* Simulation Header with Controls & Progress */}
              <SimulationHeader
                currentStep={currentStep}
                currentStepIndex={currentStepIndex}
                totalSteps={simulationSteps.length}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                speed={speed}
                setSpeed={setSpeed}
                onPrev={handlePrev}
                onNext={handleNext}
                onRestart={handleRestart}
              />

              {/* Simulation Stage (Cytoscape Precedence Graph / Conflict Check / View Analysis) */}
              <SimulationStage
                currentStep={currentStep}
                analysis={analysis}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[440px] shadow-sm">
              <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200 dark:border-blue-800">
                <Activity className="w-8 h-8 animate-pulse" />
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-base">Ready for Interactive Simulation</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter your transaction operations on the left and click <strong>"Analyze Schedule"</strong> to watch the algorithms run step-by-step.
              </p>
            </div>
          )}
        </div>

        {/* AREA 3 (RIGHT 3 Cols): Live Explanation Stepper */}
        <div className="lg:col-span-3">
          <Explanation
            analysis={analysis}
            activeStep={mappedExplanationStep}
            setActiveStep={() => {}}
          />
        </div>
      </div>

      {/* AREA 4 (BOTTOM FULL WIDTH 12 Cols): Final Result Revealed on Completion */}
      {analysis && analysis.success && currentStep?.state === 'COMPLETED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Comparison analysis={analysis} />
        </motion.div>
      )}

      {/* PDF / JSON / CSV Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        analysis={analysis}
      />
    </div>
  );
};
