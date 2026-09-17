import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Activity } from 'lucide-react';
import { SimulationStep } from '../../types/simulation';

interface SimulationHeaderProps {
  currentStep: SimulationStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  speed: number;
  setSpeed: (val: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
}

export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  onPrev,
  onNext,
  onRestart
}) => {
  if (!currentStep) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      {/* Top Banner: CURRENT STEP & Stage Name */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-200 dark:border-blue-800">
            {currentStepIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {currentStep.stageName}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentStep.title}
            </h2>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5 uppercase font-bold">Speed:</span>
          {[
            { label: 'Slow', val: 0.5 },
            { label: 'Normal', val: 1 },
            { label: 'Fast', val: 2 }
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setSpeed(s.val)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                speed === s.val
                  ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Description */}
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
        {currentStep.description}
      </p>

      {/* Control Bar & Progress Dots */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRestart}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-xs font-bold flex items-center gap-1"
            title="Restart Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart
          </button>

          <button
            onClick={onPrev}
            disabled={currentStepIndex === 0}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-30 text-xs font-bold flex items-center gap-1"
          >
            <SkipBack className="w-3.5 h-3.5" /> Previous
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Play Simulation
              </>
            )}
          </button>

          <button
            onClick={onNext}
            disabled={currentStepIndex === totalSteps - 1}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-30 text-xs font-bold flex items-center gap-1"
          >
            Next <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Indicator Dots */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <span
              key={idx}
              className={`transition-all rounded-full ${
                idx === currentStepIndex
                  ? 'w-3 h-3 bg-blue-600 shadow-sm ring-2 ring-blue-200 dark:ring-blue-900'
                  : idx < currentStepIndex
                    ? 'w-2 h-2 bg-emerald-500'
                    : 'w-2 h-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
