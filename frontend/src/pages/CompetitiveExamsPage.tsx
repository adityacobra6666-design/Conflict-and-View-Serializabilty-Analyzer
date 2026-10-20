import React, { useState, useMemo, useEffect } from 'react';
import { CompetitiveQuestion, CompetitiveExamsProgress } from '../types/competitive';
import { competitiveService } from '../services/competitiveService';
import { PyqSubsection } from '../components/Competitive/PyqSubsection';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Trophy, 
  Bot, 
  Sparkles,
  HelpCircle,
  ExternalLink,
  FileText
} from 'lucide-react';

interface CompetitiveExamsPageProps {
  onSendToAnalyzer: (scheduleText: string) => void;
  onOpenAiTutorWithMessage?: (prompt: string) => void;
}

export const CompetitiveExamsPage: React.FC<CompetitiveExamsPageProps> = ({
  onSendToAnalyzer,
  onOpenAiTutorWithMessage
}) => {
  const allQuestions = useMemo(() => competitiveService.getAllQuestions(), []);
  const allTopics = useMemo(() => competitiveService.getTopics(), []);

  // Active Subsection: 'practice' (500 Practice Questions) or 'pyq' (Previous Year Question Papers)
  const [activeSubsection, setActiveSubsection] = useState<'practice' | 'pyq'>('practice');

  // Filter States
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All'); // All, Unattempted, Correct, Incorrect, Bookmarked
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasScheduleOnly, setHasScheduleOnly] = useState<boolean>(false);

  // Active question index in filtered list
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Selection state for current question
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // User progress from local storage
  const [progress, setProgress] = useState<CompetitiveExamsProgress>(() => competitiveService.getProgress());

  // Filter questions based on controls
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
      if (hasScheduleOnly && !q.scheduleText) return false;

      const attempt = progress.attempts[q.id];
      const isBookmarked = progress.bookmarks.includes(q.id);

      if (selectedStatus === 'Unattempted' && attempt) return false;
      if (selectedStatus === 'Correct' && (!attempt || !attempt.isCorrect)) return false;
      if (selectedStatus === 'Incorrect' && (!attempt || attempt.isCorrect)) return false;
      if (selectedStatus === 'Bookmarked' && !isBookmarked) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inQ = q.question.toLowerCase().includes(query);
        const inSched = q.scheduleText?.toLowerCase().includes(query) || false;
        const inExp = q.explanation.toLowerCase().includes(query);
        if (!inQ && !inSched && !inExp) return false;
      }

      return true;
    });
  }, [allQuestions, selectedTopic, selectedDifficulty, selectedStatus, searchQuery, hasScheduleOnly, progress]);

  // Adjust current index if filtered list changes
  useEffect(() => {
    if (currentIndex >= filteredQuestions.length) {
      setCurrentIndex(Math.max(0, filteredQuestions.length - 1));
    }
  }, [filteredQuestions.length, currentIndex]);

  const currentQ: CompetitiveQuestion | undefined = filteredQuestions[currentIndex];
  const currentAttempt = currentQ ? progress.attempts[currentQ.id] : undefined;
  const isBookmarked = currentQ ? progress.bookmarks.includes(currentQ.id) : false;

  // Sync selectedOption with attempt if already submitted
  useEffect(() => {
    if (currentAttempt) {
      setSelectedOption(currentAttempt.selectedIndex);
    } else {
      setSelectedOption(null);
    }
  }, [currentIndex, currentQ?.id, currentAttempt]);

  const handleSubmitAnswer = () => {
    if (!currentQ || selectedOption === null) return;
    const isCorrect = selectedOption === currentQ.correctIndex;
    const updated = competitiveService.saveAttempt(currentQ.id, selectedOption, isCorrect);
    setProgress({ ...updated });
  };

  const handleToggleBookmark = () => {
    if (!currentQ) return;
    const updated = competitiveService.toggleBookmark(currentQ.id);
    setProgress({ ...updated });
  };

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to reset all your practice progress and answers?")) {
      const clean = competitiveService.resetProgress();
      setProgress({ ...clean });
      setSelectedOption(null);
    }
  };

  // Progress stats
  const totalAttempted = Object.keys(progress.attempts).length;
  const totalCorrect = Object.values(progress.attempts).filter(a => a.isCorrect).length;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Subsections Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100/90 dark:bg-slate-900/70 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubsection('practice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubsection === 'practice'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Practice Bank (500 Questions)
          </button>

          <button
            onClick={() => setActiveSubsection('pyq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubsection === 'pyq'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" /> Previous Year Question Papers (PYQs)
          </button>
        </div>

        <span className="text-[11px] font-mono font-medium text-slate-500 px-3 hidden sm:inline">
          {activeSubsection === 'practice' ? '500 Practice Questions' : 'Verified Authentic GATE CSE & University Papers'}
        </span>
      </div>

      {activeSubsection === 'pyq' ? (
        <PyqSubsection
          onSendToAnalyzer={onSendToAnalyzer}
          onOpenAiTutorWithMessage={onOpenAiTutorWithMessage}
        />
      ) : (
        <>
          {/* Top Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                DBMS Competitive Exams Practice Bank
              </h1>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                500 Verified Questions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Curated for GATE CS, ISRO, UGC NET & University DBMS Exams with direct Analyzer Workbench integration.
            </p>
          </div>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ATTEMPTED</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">{totalAttempted} / {allQuestions.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">CORRECT</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{totalCorrect}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ACCURACY</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">{accuracy}%</span>
            </div>
          </div>

          <button
            onClick={handleResetProgress}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset All Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Interface: Left Filters & Navigator (4 cols) | Right Practice Stage (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Filters, Search & Question Grid Navigator */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter & Navigate
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {filteredQuestions.length} Found
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions or schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Topic Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Topics ({allQuestions.length})</option>
                {allTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Difficulty</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDifficulty(d)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      selectedDifficulty === d
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Attempt Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Questions</option>
                <option value="Unattempted">Unattempted</option>
                <option value="Correct">Correct</option>
                <option value="Incorrect">Incorrect</option>
                <option value="Bookmarked">Bookmarked</option>
              </select>
            </div>

            {/* Schedule Only Toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasScheduleOnly}
                onChange={(e) => setHasScheduleOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Only schedule analysis problems (with Analyzer link)</span>
            </label>

            {/* Quick Jump Question Grid Navigator */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Jump to Question ({currentIndex + 1} of {filteredQuestions.length})</span>
              </div>
              <div className="max-h-56 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-6 sm:grid-cols-8 gap-1">
                {filteredQuestions.map((q, idx) => {
                  const att = progress.attempts[q.id];
                  const isCur = idx === currentIndex;
                  let bg = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
                  if (att) {
                    bg = att.isCorrect 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
                  }
                  if (isCur) {
                    bg += ' ring-2 ring-blue-600 font-extrabold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-7 rounded text-[11px] font-mono border flex items-center justify-center transition-all ${bg}`}
                      title={`Question ${idx + 1}: ${q.topic}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Presentation, Options & Answer Engine */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {currentQ ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              
              {/* Question Header & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Question {currentIndex + 1} of {filteredQuestions.length}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    currentQ.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : currentQ.difficulty === 'Medium'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {currentQ.topic}
                  </span>
                  {currentQ.exam && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {currentQ.exam}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-2 rounded-xl border transition-colors ${
                      isBookmarked
                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h2>

                {/* If Schedule is present, show schedule card with DIRECT ANALYZER ACTION */}
                {currentQ.scheduleText && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                        Schedule Under Analysis
                      </span>
                      <code className="text-sm font-mono font-bold text-blue-900 dark:text-blue-200">
                        {currentQ.scheduleText}
                      </code>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSendToAnalyzer(currentQ.scheduleText!)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105 shrink-0"
                      title="Load and analyze this schedule in Analyzer Workbench"
                    >
                      <Layers className="w-4 h-4" /> Analyze in Workbench
                    </button>
                  </div>
                )}
              </div>

              {/* Options Grid (A, B, C, D) */}
              <div className="space-y-3">
                {currentQ.options.map((optText, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === idx;
                  const isSubmitted = currentAttempt !== undefined;
                  const isCorrect = idx === currentQ.correctIndex;

                  let style = 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60';
                  
                  if (isSubmitted) {
                    if (isCorrect) {
                      style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isSelected && !isCorrect) {
                      style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
                    } else {
                      style = 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    style = 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-900 dark:text-blue-100 font-bold shadow-sm';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${style}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1 mt-0.5 leading-relaxed">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button or Post-Submission Explanation */}
              {!currentAttempt ? (
                <div className="pt-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                  {currentAttempt.isCorrect ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Correct!
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        {currentQ.explanation}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-sm">
                        <XCircle className="w-5 h-5 text-rose-600" /> Incorrect
                      </div>
                      <div className="space-y-1.5 font-sans text-slate-800 dark:text-slate-200">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                          Correct Answer: {String.fromCharCode(65 + currentQ.correctIndex)}. {currentQ.options[currentQ.correctIndex]}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          <strong>Reasoning & Verification:</strong> {currentQ.explanation}
                        </p>
                      </div>

                      {onOpenAiTutorWithMessage && (
                        <button
                          type="button"
                          onClick={() => {
                            const selectedLabel = String.fromCharCode(65 + currentAttempt.selectedIndex);
                            const correctLabel = String.fromCharCode(65 + currentQ.correctIndex);
                            const prompt = `Please explain this DBMS competitive exam question:\nQuestion: "${currentQ.question}"\n${currentQ.scheduleText ? `Schedule: ${currentQ.scheduleText}\n` : ''}Correct Answer: Option ${correctLabel} ("${currentQ.options[currentQ.correctIndex]}")\nMy Answer: Option ${selectedLabel} ("${currentQ.options[currentAttempt.selectedIndex]}")\nPlease explain the theoretical reasoning and how to solve this step-by-step.`;
                            onOpenAiTutorWithMessage(prompt);
                          }}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                        >
                          <Bot className="w-4 h-4" /> Ask AI Tutor for Detailed Step-by-Step Breakdown
                        </button>
                      )}
                    </div>
                  )}

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    <button
                      onClick={() => setCurrentIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                      disabled={currentIndex === filteredQuestions.length - 1}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-30"
                    >
                      Next Question <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-sm">No questions match your current filter criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting topic, difficulty, or search query.</p>
              <button
                onClick={() => {
                  setSelectedTopic('All');
                  setSelectedDifficulty('All');
                  setSelectedStatus('All');
                  setSearchQuery('');
                  setHasScheduleOnly(false);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
