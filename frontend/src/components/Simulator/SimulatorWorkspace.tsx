import React, { useState, useEffect } from 'react';
import { AnalysisResult, ExampleSchedule } from '../../types';
import { generateSimulationSteps } from '../../services/simulationEngine';
import { CompactScheduleInput } from './CompactScheduleInput';
import { SimulationControlBar } from './SimulationControlBar';
import { ActionCard } from './ActionCard';
import { VisualStage } from './VisualStage';
import { CompletionCard } from './CompletionCard';

interface SimulatorWorkspaceProps {
  initialScheduleText?: string;
  examples: ExampleSchedule[];
  analysis: AnalysisResult | null;
  setAnalysis: (res: AnalysisResult | null) => void;
  onRunAnalysis: (text: string) => Promise<void>;
  loading: boolean;
}

export const SimulatorWorkspace: React.FC<SimulatorWorkspaceProps> = ({
  initialScheduleText,
  examples,
  analysis,
  setAnalysis,
  onRunAnalysis,
  loading
}) => {
  const [scheduleText, setScheduleText] = useState<string>(initialScheduleText || "R1(X), W2(X), W1(X), W3(X)");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  // Generate simulation steps whenever analysis updates
  const simulationSteps = analysis && analysis.success ? generateSimulationSteps(analysis) : [];
  const currentStep = simulationSteps[currentStepIndex] || null;

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && simulationSteps.length > 0) {
      const intervalMs = Math.round(2000 / speed);
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

  const handleStartSimulation = async (text?: string) => {
    const targetText = text !== undefined ? text : scheduleText;
    if (!targetText.trim()) return;
    setIsPlaying(false);
    await onRunAnalysis(targetText);
    setCurrentStepIndex(0);
  };

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

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* STEP 1: Compact Schedule Input */}
      <CompactScheduleInput
        scheduleText={scheduleText}
        setScheduleText={setScheduleText}
        onStartSimulation={handleStartSimulation}
        examples={examples}
        loading={loading}
      />

      {/* STAGE 2: HERO SIMULATION WORKSPACE */}
      {analysis && analysis.success && currentStep ? (
        <div className="flex flex-col gap-4">
          {/* Simulation Control Bar */}
          <SimulationControlBar
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

          {/* Action Status Card ("WHAT IS THE ALGORITHM DOING RIGHT NOW?") */}
          {currentStep.state !== 'COMPLETED' ? (
            <>
              <ActionCard step={currentStep} />
              <VisualStage step={currentStep} analysis={analysis} />
            </>
          ) : (
            <CompletionCard analysis={analysis} onRestart={handleRestart} />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm min-h-[420px]">
          <div className="p-4 rounded-full bg-blue-50 text-blue-600 mb-3">
            <span className="text-2xl font-bold">▶</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready for Interactive Simulation</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Enter a transaction schedule above or select a preset schedule, then click <strong>▶ Start Simulation</strong> to watch the algorithms run step-by-step.
          </p>
        </div>
      )}
    </div>
  );
};
