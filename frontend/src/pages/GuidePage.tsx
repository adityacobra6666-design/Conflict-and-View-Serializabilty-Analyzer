import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Layers, Split, Play, HelpCircle, Bot, Key, Sparkles, CheckCircle2, ChevronRight, ChevronDown, Award, ArrowRight, ArrowLeft, ShieldCheck, Code, Cpu } from 'lucide-react';
import { THEORY_TOPICS, TheoryTopic } from './Learn';

interface GuidePageProps {
  onNavigateTab: (tab: string) => void;
  onOpenAiTutor: () => void;
}

export const GuidePage: React.FC<GuidePageProps> = ({ onNavigateTab, onOpenAiTutor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [isTocMobileOpen, setIsTocMobileOpen] = useState(false);

  const sections = [
    { id: 'overview', title: '1. Platform Overview & Quick Start', icon: Sparkles },
    { id: 'analyzer-guide', title: '2. How to Analyze & Input Format', icon: Layers },
    { id: 'theory', title: '3. Learn Serializability Theory', icon: BookOpen },
    { id: 'tools', title: '4. Tools: What-If, Quiz & AI Tutor', icon: Split },
    { id: 'byok', title: '5. BYOK AI Configuration Guide', icon: Key },
    { id: 'architecture', title: '6. Architecture & Algorithms', icon: Cpu },
    { id: 'troubleshooting', title: '7. Troubleshooting & FAQ', icon: HelpCircle }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setIsTocMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter topics for Search
  const filteredTheory = THEORY_TOPICS.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-blue-600" /> Platform Guide & DBMS Theory Documentation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Complete User Guide & System Reference
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              A complete guide to analyzing transaction schedules, understanding conflict and view serializability, using simulations, taking interactive quizzes, and configuring AI-assisted learning.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('analyzer')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-4 h-4" /> Start Analyzing
            </button>
            <button
              onClick={() => onNavigateTab('whatif')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Split className="w-4 h-4 text-purple-600" /> Try What-If
            </button>
            <button
              onClick={() => onNavigateTab('quiz')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Award className="w-4 h-4 text-amber-500" /> Take Quiz
            </button>
            <button
              onClick={onOpenAiTutor}
              className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-colors"
            >
              <Bot className="w-4 h-4 text-blue-600" /> Ask AI Tutor
            </button>
          </div>
        </div>

        {/* Client-Side Guide Search Box */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search guide concepts, algorithms, features, BYOK, quiz..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Main Layout Grid (TOC Sidebar + Content Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Table of Contents Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider block border-b border-slate-100 dark:border-slate-800 pb-2">
            TABLE OF CONTENTS
          </span>
          <nav className="space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile TOC Collapsible Dropdown */}
        <div className="lg:hidden col-span-1">
          <button
            onClick={() => setIsTocMobileOpen(!isTocMobileOpen)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Guide Table of Contents
            </span>
            {isTocMobileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {isTocMobileOpen && (
            <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className="text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  {sec.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-10">

          {/* SECTION 1: OVERVIEW & QUICK START */}
          <section id="overview" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                1. What is this Website & Quick Start Workflow
              </h2>
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                The <strong>Conflict & View Serializability Analyzer</strong> (ViewLab) is an interactive, production-quality DBMS intelligence platform. It is designed to evaluate concurrent transaction schedules using <strong>BOTH Conflict Serializability (CSR) and View Serializability (VSR)</strong> criteria simultaneously.
              </p>
              <p>
                Unlike basic online calculators, this platform combines a <strong>deterministic Python algorithmic backend</strong> with step-by-step interactive <strong>simulations, precedence graph visualization, what-if comparison, self-assessment quizzes, and AI tutor assistance</strong>.
              </p>
            </div>

            {/* 10-Step Quick Start Visual Guide */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                10-Step Quick Start Workflow:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '1', title: 'Open Analyzer', desc: 'Navigate to the Analyzer Workbench from the header menu.' },
                  { step: '2', title: 'Input Schedule', desc: 'Type operations like R1(X), W2(X), R2(Y), W1(Y) or choose a preset.' },
                  { step: '3', title: 'Click Analyze', desc: 'Execute the master analysis to run Conflict & View engines.' },
                  { step: '4', title: 'Watch Simulation', desc: 'Use Play/Pause stepper to observe step-by-step operation matrix.' },
                  { step: '5', title: 'Observe Conflicts', desc: 'Inspect pairwise READ-WRITE, WRITE-READ, and WRITE-WRITE conflicts.' },
                  { step: '6', title: 'Inspect Cytoscape Graph', desc: 'Drag, zoom, and click precedence edges to view exact conflict causes.' },
                  { step: '7', title: 'Check Cycle Detection', desc: 'Observe if a directed cycle exists (e.g. T1 ⇄ T2) rendering CSR false.' },
                  { step: '8', title: 'Review View Equivalence', desc: 'Examine Initial Reads, Reads-From, and Final Writes tables.' },
                  { step: '9', title: 'Use What-If & Quiz', desc: 'Modify schedule operations or test your knowledge in the Quiz tab.' },
                  { step: '10', title: 'Ask AI Tutor', desc: 'Bring your API key (BYOK) to receive contextual explanations.' }
                ].map((s) => (
                  <div key={s.step} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {s.step}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 2: ANALYZER & INPUT FORMAT */}
          <section id="analyzer-guide" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                2. How to Analyze a Schedule & Input Format Rules
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Supported Input Syntax Formats:</h3>
              <p>The parser supports both standard comma-separated tokens and newline-separated operation lists:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block font-sans">✓ Valid Format 1 (Inline Tokens):</span>
                  <code className="text-amber-700 dark:text-amber-300 font-bold block">R1(X), W2(X), R2(Y), W1(Y)</code>
                  <p className="text-[11px] text-slate-500 font-sans pt-1">R = Read, W = Write, number = Transaction ID, (X) = Data Item</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block font-sans">✓ Valid Format 2 (Multiline List):</span>
                  <code className="text-amber-700 dark:text-amber-300 font-bold block">R1(X)<br />W2(X)<br />W1(X)<br />W3(X)</code>
                  <p className="text-[11px] text-slate-500 font-sans pt-1">Supports spaces, newlines, and trailing commas automatically.</p>
                </div>
              </div>

              {/* Validation Rules */}
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-300 block">Invalid Syntax Examples (Will Trigger Validation Error):</span>
                <ul className="list-disc list-inside text-rose-700 dark:text-rose-300 space-y-0.5 font-mono text-[11px]">
                  <li><code>R(X)</code> — Missing transaction number</li>
                  <li><code>WRITE1(X)</code> — Use single character <code>W</code> or <code>R</code></li>
                  <li><code>R1</code> — Missing data item in parentheses</li>
                  <li><code>X1(R)</code> — Data item must be inside parentheses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 3: LEARN SERIALIZABILITY THEORY (Integrated existing theory!) */}
          <section id="theory" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                3. Learn Serializability Theory & Concepts
              </h2>
            </div>

            {/* Render Theory Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTheory.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2"
                >
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 self-start font-mono">
                    {t.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.definition}</p>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Example:</span>
                    <code className="text-amber-700 dark:text-amber-300 font-bold">{t.example}</code>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Rule: {t.keyRule}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Table: Conflict vs View Serializability */}
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Conflict Serializability vs View Serializability Comparison
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Feature</th>
                      <th className="p-3">Conflict Serializability (CSR)</th>
                      <th className="p-3">View Serializability (VSR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-sans">
                    <tr>
                      <td className="p-3 font-bold">Primary Tool</td>
                      <td className="p-3">Precedence Graph (Serialization Graph)</td>
                      <td className="p-3">Initial Reads, Reads-From, Final Writes</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Cycle Relevance</td>
                      <td className="p-3">Acyclic graph ⟺ Conflict Serializable</td>
                      <td className="p-3">Can be VSR even if precedence graph has cycles</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Blind Writes</td>
                      <td className="p-3">Creates precedence cycles (Not CSR)</td>
                      <td className="p-3">Accommodates blind write equivalence (Is VSR)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Time Complexity</td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">O(V + E) Polynomial (Fast)</td>
                      <td className="p-3 font-mono text-rose-600 font-bold">O(N! · M) NP-Complete (Exhaustive)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">Set Relationship</td>
                      <td className="p-3 font-bold text-blue-600">Strict Subset (CSR ⊂ VSR)</td>
                      <td className="p-3 font-bold text-purple-600">Broader Set (Includes all CSR + Blind Writes)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SECTION 4: TOOLS GUIDE */}
          <section id="tools" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Split className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                4. Interactive Tools: What-If, Quiz & AI Tutor
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-purple-600 flex items-center gap-1 text-sm">
                  <Split className="w-4 h-4" /> What-If Simulator
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Modify individual operations in an analyzed schedule to immediately compare Baseline vs Modified graphs, cycle changes, and serializability shifts.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-amber-600 flex items-center gap-1 text-sm">
                  <Award className="w-4 h-4" /> Interactive Quiz
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Choose difficulty (Easy, Medium, Hard) and question counts (5-20). Each question has 4 options, detailed explanations, and an Ask AI Tutor button for wrong answers.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-blue-600 flex items-center gap-1 text-sm">
                  <Bot className="w-4 h-4" /> AI Tutor Assistant
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ask arbitrary questions about DBMS concepts, computer science, or active schedule analysis using your configured LLM provider.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5: BYOK AI CONFIGURATION GUIDE */}
          <section id="byok" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Key className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                5. Bring Your Own Key (BYOK) Configuration Guide
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                The platform features a request-scoped BYOK architecture that allows you to connect any LLM provider (OpenRouter, custom OpenAI-compatible endpoints, native OpenAI, or Google Gemini) without storing API keys on any database server.
              </p>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs">
                <span className="font-bold text-slate-900 dark:text-white font-sans text-xs">Configuring OpenRouter (Recommended):</span>
                <div>1. Open <strong>⚙ AI Settings</strong> in the header or AI Tutor.</div>
                <div>2. Select Provider: <strong>OpenAI Compatible (OpenRouter, Custom, Local)</strong></div>
                <div>3. Base API URL: <code>https://openrouter.ai/api/v1</code></div>
                <div>4. Enter your OpenRouter API key (masked safely in browser session storage).</div>
                <div>5. Click <strong>[ Discover Models ]</strong> or enter model ID (e.g. <code>openai/gpt-4o-mini</code>).</div>
                <div>6. Click <strong>[ Test Connection & Save ]</strong> to validate and save to session.</div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Security Assurance: API keys are stored strictly in your browser session and are never logged or persisted in source code or databases.</span>
              </div>
            </div>
          </section>

          {/* SECTION 6: ARCHITECTURE & ALGORITHMS */}
          <section id="architecture" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                6. Platform Architecture & Algorithm Complexity
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <Code className="w-4 h-4" /> Technical Stack
                </span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <li>• Frontend: React 18, TypeScript, Vite, Tailwind CSS</li>
                  <li>• Visualizations: Cytoscape.js directed precedence graph</li>
                  <li>• Backend: Python 3.14, FastAPI, Pydantic v2</li>
                  <li>• Database: SQLite with SQLAlchemy ORM</li>
                  <li>• Reports: ReportLab PDF, JSON, CSV Export</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-purple-600 flex items-center gap-1">
                  <Cpu className="w-4 h-4" /> Algorithmic Complexity
                </span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <li>• Conflict Detection: O(N^2) pairwise analysis</li>
                  <li>• Precedence Graph Cycle: O(V + E) Tarjan/DFS</li>
                  <li>• Topological Sort: O(V + E) Kahn's algorithm</li>
                  <li>• View Analysis: O(N! · M) candidate serial order check</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 7: TROUBLESHOOTING & FAQ */}
          <section id="troubleshooting" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                7. Frequently Asked Questions & Troubleshooting
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {[
                { q: 'Why does R1(X) and R2(X) not create a conflict?', a: 'READ-READ operations do not modify data item values, so they can execute in any relative order without causing inconsistency.' },
                { q: 'Can a schedule be View Serializable if its Precedence Graph has a cycle?', a: 'Yes! Schedules with Blind Writes (e.g., R1(X), W2(X), W1(X), W3(X)) have precedence cycles but are View Serializable under serial order T1 → T2 → T3.' },
                { q: 'Do I need an API key to use the Analyzer or Quiz?', a: 'No! The deterministic Analyzer algorithms, precedence graph, simulations, and Quiz operate completely offline with 0 dependencies on external APIs.' },
                { q: 'What happens if AI Model Discovery fails in BYOK settings?', a: 'If model discovery fails, you can enter any valid model ID manually (e.g., openai/gpt-4o-mini or meta-llama/llama-3.3-70b-instruct:free).' }
              ].map((faq, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">Q: {faq.q}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Progressive Bottom Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => {
                const idx = sections.findIndex(s => s.id === activeSection);
                if (idx > 0) scrollToSection(sections[idx - 1].id);
              }}
              disabled={activeSection === sections[0].id}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-30 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Previous Section
            </button>

            <button
              onClick={() => {
                const idx = sections.findIndex(s => s.id === activeSection);
                if (idx < sections.length - 1) scrollToSection(sections[idx + 1].id);
              }}
              disabled={activeSection === sections[sections.length - 1].id}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-30 flex items-center gap-1"
            >
              Next Section <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
