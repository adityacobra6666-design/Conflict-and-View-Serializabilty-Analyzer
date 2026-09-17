import React, { useState } from 'react';
import { ExampleSchedule } from '../types';
import { Sparkles, Play, CheckCircle, XCircle, Info } from 'lucide-react';

interface ExamplesProps {
  examples: ExampleSchedule[];
  onSelectExample: (scheduleText: string) => void;
}

export const Examples: React.FC<ExamplesProps> = ({
  examples,
  onSelectExample
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(examples.map(e => e.category)))];

  const filtered = examples.filter(e => {
    if (selectedCategory === 'ALL') return true;
    return e.category === selectedCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Presets & Example Schedule Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mathematically verified transaction schedules covering standard DBMS test cases</p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Example Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(ex => (
          <div
            key={ex.id}
            className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                  {ex.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  ex.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                  ex.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {ex.difficulty}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">{ex.title}</h3>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-mono block mb-1">SCHEDULE TOKEN STRING:</span>
                <code className="text-sm font-mono text-amber-700 dark:text-amber-300 font-bold">{ex.schedule_text}</code>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ex.description}</p>

              <div className="flex items-center gap-4 text-xs font-mono pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Conflict:</span>
                  {ex.expected_conflict ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> YES</span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> NO</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">View:</span>
                  {ex.expected_view ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> YES</span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> NO</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Theory Note:</span> {ex.theory_note}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectExample(ex.schedule_text)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Watch in Interactive Simulator
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
