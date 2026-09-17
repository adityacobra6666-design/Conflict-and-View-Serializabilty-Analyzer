import React from 'react';
import { HelpCircle, Cpu, Code, ShieldCheck, Layers } from 'lucide-react';

export const DocsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" /> Platform Architecture & Algorithm Documentation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Technical specification, complexity analysis, and API reference</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Architecture */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <Cpu className="w-4 h-4" /> 1. System Architecture
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The platform follows a clean decoupled micro-architectural design:
          </p>
          <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 font-mono list-disc list-inside bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <li>Frontend: React 18, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Framer Motion</li>
            <li>Backend Engine: Python 3.14, FastAPI, Pydantic v2</li>
            <li>Database: SQLite with SQLAlchemy ORM</li>
            <li>Reports: ReportLab PDF, JSON, CSV Export</li>
          </ul>
        </div>

        {/* Algorithm Complexity */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
            <Layers className="w-4 h-4" /> 2. Complexity Analysis
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div>
              <strong className="text-emerald-700 dark:text-emerald-400">Conflict Serializability:</strong>
              <p>Precedence graph construction and DFS cycle detection runs in <code className="text-amber-700 dark:text-amber-300 font-mono font-bold">O(V + E)</code> polynomial time, making it extremely fast (&lt;2 ms).</p>
            </div>
            <div>
              <strong className="text-purple-700 dark:text-purple-400">View Serializability:</strong>
              <p>Exhaustive candidate permutation evaluation scales factorially: <code className="text-amber-700 dark:text-amber-300 font-mono font-bold">O(N! · M)</code> where N is transaction count and M is operation count. Safety warning enforced for N &gt; 7.</p>
            </div>
          </div>
        </div>

        {/* API Specification */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <Code className="w-4 h-4" /> 3. REST API Specification
          </div>
          <div className="text-xs font-mono space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300">
            <div><span className="text-emerald-600 font-bold">POST</span> /api/analyze — Master analysis</div>
            <div><span className="text-blue-600 font-bold">GET</span> /api/examples — Preset library</div>
            <div><span className="text-blue-600 font-bold">GET</span> /api/history — Saved runs</div>
            <div><span className="text-emerald-600 font-bold">POST</span> /api/export/pdf — ReportLab PDF</div>
            <div><span className="text-emerald-600 font-bold">POST</span> /api/ai/explain — AI Tutor assistant</div>
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" /> 4. Testing & Reliability
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The platform is backed by automated Pytest unit and integration tests covering parser normalizers, conflict classifications, graph cycle detectors, topological sorters, initial reads, reads-from, final writes, and blind-write equivalence cases.
          </p>
        </div>
      </div>
    </div>
  );
};
