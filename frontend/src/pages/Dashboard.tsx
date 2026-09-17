import React, { useEffect, useState } from 'react';
import { Database, Play, Sparkles, ArrowRight, Cpu } from 'lucide-react';
import { ExampleSchedule, HistoryItem } from '../types';
import { apiService } from '../services/api';

interface DashboardProps {
  onStartAnalyzing: (scheduleText?: string) => void;
  examples: ExampleSchedule[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartAnalyzing,
  examples
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    conflictSerializable: 0,
    viewSerializable: 0,
    notSerializable: 0
  });

  useEffect(() => {
    apiService.getHistory().then(res => {
      setHistory(res.history || []);
      const total = res.count || 0;
      const cYes = res.history.filter(h => h.conflict_serializable).length;
      const vYes = res.history.filter(h => h.view_serializable).length;
      const notS = res.history.filter(h => !h.view_serializable).length;
      setStats({
        total,
        conflictSerializable: cYes,
        viewSerializable: vYes,
        notSerializable: notS
      });
    }).catch(err => console.error(err));
  }, []);

  const blindWriteExample = examples.find(e => e.id === 'ex-2');

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-bold w-fit">
            <Cpu className="w-3.5 h-3.5" /> Deterministic DBMS Schedule Intelligence Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Understand Serializability.<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Don't Just Calculate It.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Analyze transaction schedules, visualize precedence graph dependencies, detect cycle paths, compare conflict vs view serializability, and step through every algorithm interactively.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onStartAnalyzing()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" /> Start Analyzing
            </button>

            {blindWriteExample && (
              <button
                onClick={() => onStartAnalyzing(blindWriteExample.schedule_text)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-sm font-semibold transition-all hover:scale-105 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-500" /> Try Blind Write Special Case
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Statistics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Analyses Run</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.total}</span>
        </div>
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Conflict Serializable</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">{stats.conflictSerializable}</span>
        </div>
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">View Serializable</span>
          <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">{stats.viewSerializable}</span>
        </div>
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Non-Serializable</span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">{stats.notSerializable}</span>
        </div>
      </section>

      {/* Special Educational Case Highlight Card */}
      <section className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 p-6 rounded-2xl border border-purple-200 dark:border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 text-xs font-bold">
              Why View Serializability Is More General
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Special Case: Schedule <code className="text-purple-700 dark:text-amber-400 font-mono">R1(X), W2(X), W1(X), W3(X)</code>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This classic blind write schedule contains a precedence cycle <code className="text-rose-700 font-mono font-bold">T1 ↔ T2</code> (making it <strong>NOT Conflict Serializable</strong>), yet candidate serial order <code className="text-emerald-700 font-mono font-bold">T1 → T2 → T3</code> preserves all initial reads, reads-from, and final writes (making it <strong>View Serializable!</strong>).
          </p>
        </div>

        <button
          onClick={() => onStartAnalyzing("R1(X), W2(X), W1(X), W3(X)")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs whitespace-nowrap shadow-md shadow-purple-600/20 transition-all hover:scale-105"
        >
          Inspect Interactive Demo <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Quick Preset Examples Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curated Example Library</h2>
          <span className="text-xs text-slate-500">Click any card to analyze immediately</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examples.slice(0, 6).map((ex) => (
            <div
              key={ex.id}
              onClick={() => onStartAnalyzing(ex.schedule_text)}
              className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between gap-3 group shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{ex.category}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ex.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                    ex.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {ex.difficulty}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{ex.title}</h4>
                <code className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                  {ex.schedule_text}
                </code>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{ex.description}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] border-t border-slate-100 dark:border-slate-800/80 pt-2 font-mono">
                <span>Conflict: <strong className={ex.expected_conflict ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{ex.expected_conflict ? 'YES' : 'NO'}</strong></span>
                <span>View: <strong className={ex.expected_view ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{ex.expected_view ? 'YES' : 'NO'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
