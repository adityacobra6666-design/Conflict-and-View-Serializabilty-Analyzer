import React, { useState } from 'react';
import { Play, RotateCcw, Sparkles } from 'lucide-react';
import { ExampleSchedule } from '../../types';

interface CompactScheduleInputProps {
  scheduleText: string;
  setScheduleText: (text: string) => void;
  onStartSimulation: (text?: string) => void;
  examples: ExampleSchedule[];
  loading: boolean;
}

export const CompactScheduleInput: React.FC<CompactScheduleInputProps> = ({
  scheduleText,
  setScheduleText,
  onStartSimulation,
  examples,
  loading
}) => {
  const [selectedExampleId, setSelectedExampleId] = useState<string>('');

  const handleLoadExample = (exampleId: string) => {
    const ex = examples.find(e => e.id === exampleId);
    if (ex) {
      setScheduleText(ex.schedule_text);
      setSelectedExampleId(exampleId);
      onStartSimulation(ex.schedule_text);
    }
  };

  const textValid = scheduleText.trim().length > 0;

  // Split tokens for compact preview strip
  const tokens = scheduleText.split(/[\n\r,;]+/).map(t => t.trim()).filter(Boolean);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            1. Enter Transaction Schedule
          </h2>
          <p className="text-[11px] text-slate-500">Input schedule tokens to run the step-by-step interactive simulation</p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <select
            value={selectedExampleId}
            onChange={(e) => handleLoadExample(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="">Choose preset schedule...</option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.schedule_text})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && textValid && onStartSimulation(scheduleText)}
            placeholder="e.g. R1(X), W2(X), W1(X), W3(X)"
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 font-bold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onStartSimulation(scheduleText)}
            disabled={!textValid || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            {loading ? 'Analyzing...' : '▶ Start Simulation'}
          </button>

          <button
            onClick={() => {
              setScheduleText('');
              setSelectedExampleId('');
            }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Clear Input"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Operations Tokens Strip */}
      {tokens.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px] font-mono">
          <span className="text-slate-400 font-sans font-semibold text-[10px] uppercase mr-1">Operations Trace:</span>
          {tokens.map((token, i) => (
            <React.Fragment key={i}>
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold whitespace-nowrap">
                {token}
              </span>
              {i < tokens.length - 1 && <span className="text-slate-300">→</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
