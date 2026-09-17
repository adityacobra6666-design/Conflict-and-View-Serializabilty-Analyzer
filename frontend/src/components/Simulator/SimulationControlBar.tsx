import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward } from 'lucide-react';

interface SimulationControlBarProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
}

export const SimulationControlBar: React.FC<SimulationControlBarProps> = ({
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
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Playback Button Group */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onRestart}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Restart Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onPrev}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-30"
          title="Previous Step"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Play
            </>
          )}
        </button>
        <button
          onClick={onNext}
          disabled={currentStepIndex === totalSteps - 1}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-30"
          title="Next Step"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Dots & Step Count */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentStepIndex
                  ? 'bg-blue-600 scale-125 ring-2 ring-blue-300'
                  : i < currentStepIndex
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <FastForward className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
              speed === s
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
