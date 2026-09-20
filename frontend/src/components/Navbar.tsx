import React from 'react';
import { Database, Bot, Sparkles, BookOpen, Layers, History, HelpCircle, Play, Split, UserCheck, Bookmark, Brain } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenAiTutor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenAiTutor
}) => {
  const navItems = [
    { id: 'analyzer', label: 'Analyzer Workbench', icon: Layers },
    { id: 'whatif', label: 'What-If Simulator', icon: Split },
    { id: 'simulator', label: 'Simulator Stage', icon: Play },
    { id: 'examples', label: 'Preset Examples', icon: Sparkles },
    { id: 'learn', label: 'Learn Theory', icon: BookOpen },
    { id: 'quiz', label: 'Interactive Quiz', icon: Brain },
    { id: 'history', label: 'History', icon: History },
    { id: 'docs', label: 'Documentation', icon: HelpCircle },
    { id: 'developedby', label: 'Developed By', icon: UserCheck },
    { id: 'references', label: 'References', icon: Bookmark }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => setActiveTab('analyzer')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-2">
              Conflict & View Serializability Analyzer
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/30">
                Deterministic Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">DBMS Intelligence Platform</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAiTutor}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-500 border border-blue-200 dark:border-blue-500/40 transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-blue-600 dark:text-white" />
            <span className="hidden sm:inline">Ask AI Tutor</span>
          </button>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
      </div>
    </header>
  );
};
