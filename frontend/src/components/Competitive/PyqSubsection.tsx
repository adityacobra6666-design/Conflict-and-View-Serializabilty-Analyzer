import React, { useState, useMemo, useEffect } from 'react';
import { PyqQuestion } from '../../data/pyqQuestions';
import { pyqService, PyqProgress } from '../../services/pyqService';
import {
  FileText,
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
  Bot,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building
} from 'lucide-react';

interface PyqSubsectionProps {
  onSendToAnalyzer: (scheduleText: string) => void;
  onOpenAiTutorWithMessage?: (prompt: string) => void;
}

export const PyqSubsection: React.FC<PyqSubsectionProps> = ({
  onSendToAnalyzer,
  onOpenAiTutorWithMessage
}) => {
  const allPyqs = useMemo(() => pyqService.getAllQuestions(), []);
  const allExams = useMemo(() => pyqService.getExams(), []);
  const allYears = useMemo(() => pyqService.getYears(), []);
  const allTopics = useMemo(() => pyqService.getTopics(), []);

  // Filter States
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasScheduleOnly, setHasScheduleOnly] = useState<boolean>(false);

  // Active question index in filtered list
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // User progress from local storage
  const [progress, setProgress] = useState<PyqProgress>(() => pyqService.getProgress());

  // Filter PYQs
  const filteredPyqs = useMemo(() => {
    return allPyqs.filter(q => {
      if (selectedExam !== 'All' && q.exam !== selectedExam) return false;
      if (selectedYear !== 'All' && q.year !== Number(selectedYear)) return false;
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
        const inExam = q.officialSource.examName.toLowerCase().includes(query) || q.officialSource.sourceCitation.toLowerCase().includes(query);
        if (!inQ && !inSched && !inExp && !inExam) return false;
      }

      return true;
    });
  }, [allPyqs, selectedExam, selectedYear, selectedTopic, selectedDifficulty, selectedStatus, searchQuery, hasScheduleOnly, progress]);

  useEffect(() => {
    if (currentIndex >= filteredPyqs.length) {
      setCurrentIndex(Math.max(0, filteredPyqs.length - 1));
    }
  }, [filteredPyqs.length, currentIndex]);

  const currentQ: PyqQuestion | undefined = filteredPyqs[currentIndex];
  const currentAttempt = currentQ ? progress.attempts[currentQ.id] : undefined;
  const isBookmarked = currentQ ? progress.bookmarks.includes(currentQ.id) : false;

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
    const updated = pyqService.saveAttempt(currentQ.id, selectedOption, isCorrect);
    setProgress({ ...updated });
  };

  const handleToggleBookmark = () => {
    if (!currentQ) return;
    const updated = pyqService.toggleBookmark(currentQ.id);
    setProgress({ ...updated });
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all PYQ practice progress and answers?')) {
      const clean = pyqService.resetProgress();
      setProgress({ ...clean });
      setSelectedOption(null);
    }
  };

  const totalAttempted = Object.keys(progress.attempts).length;
  const totalCorrect = Object.values(progress.attempts).filter(a => a.isCorrect).length;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Subheader Banner with PYQ Source Authentication */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Previous Year Question Papers (PYQs)
              </h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                Verified Authentic Papers
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authentic GATE CSE & University exam questions organized by paper year, topic, and difficulty with detailed official solutions.
            </p>
          </div>
        </div>

        {/* PYQ Stats Badges */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ATTEMPTED</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">{totalAttempted} / {allPyqs.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">CORRECT</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{totalCorrect}</span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">ACCURACY</span>
              <span className="font-extrabold text-purple-600 dark:text-purple-400">{accuracy}%</span>
            </div>
          </div>

          <button
            onClick={handleResetProgress}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset PYQ Progress"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Interface: Left Filters (4 cols) | Right Stage (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Filters, Search & PYQ Navigator */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> PYQ Filters
              </span>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                {filteredPyqs.length} matched
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search PYQs, schedules, years..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Exam Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Examination</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="All">All Examinations ({allExams.join(', ')})</option>
                {allExams.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Examination Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="All">All Exam Years</option>
                {allYears.map(yr => (
                  <option key={yr} value={String(yr)}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">DBMS Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="All">All Topics ({allTopics.length})</option>
                {allTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Difficulty</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`text-[11px] font-bold py-1.5 rounded-lg transition-colors ${
                      selectedDifficulty === d
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Attempt Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="All">All Statuses</option>
                <option value="Unattempted">Unattempted</option>
                <option value="Correct">Correct</option>
                <option value="Incorrect">Incorrect</option>
                <option value="Bookmarked">Bookmarked</option>
              </select>
            </div>

            {/* Schedule Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasScheduleOnly}
                onChange={(e) => setHasScheduleOnly(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Has Workbench-Analyzable Schedule
              </span>
            </label>
          </div>

          {/* Quick Question List Navigator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>PYQ Navigator</span>
              <span className="text-[11px] font-mono text-slate-500">
                {filteredPyqs.length > 0 ? `${currentIndex + 1} of ${filteredPyqs.length}` : '0 of 0'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto p-1">
              {filteredPyqs.map((q, idx) => {
                const att = progress.attempts[q.id];
                const isCur = idx === currentIndex;
                const isBmk = progress.bookmarks.includes(q.id);

                let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                if (att) {
                  bgClass = att.isCorrect
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
                }
                if (isCur) {
                  bgClass += ' ring-2 ring-purple-600 font-extrabold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative p-2 rounded-lg text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${bgClass}`}
                  >
                    <span>{idx + 1}</span>
                    <span className="text-[9px] font-sans opacity-70">
                      {q.year.toString().slice(-2)}
                    </span>
                    {isBmk && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Stage & Answer Inspector */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {currentQ ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-5">
              {/* Question Header & Verification Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {currentQ.exam} {currentQ.year} {currentQ.paperSet ? `(${currentQ.paperSet})` : ''} {currentQ.questionNumber ? `Q${currentQ.questionNumber}` : ''}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {currentQ.topic}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentQ.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : currentQ.difficulty === 'Medium'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-2 rounded-xl border transition-colors ${
                      isBookmarked
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this PYQ'}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Official Source & Verification Citation Card */}
              <div className="p-3 bg-purple-50/60 dark:bg-slate-950/80 rounded-xl border border-purple-200 dark:border-purple-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-semibold">Official Exam Verification:</span>
                  <span className="font-mono">{currentQ.officialSource.sourceCitation}</span>
                  {currentQ.officialSource.organizingInstitute && (
                    <span className="hidden sm:inline text-purple-600 dark:text-purple-400">
                      ({currentQ.officialSource.organizingInstitute})
                    </span>
                  )}
                </div>

                {currentQ.officialSource.officialPaperUrl && (
                  <a
                    href={currentQ.officialSource.officialPaperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline"
                  >
                    Official Portal <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </div>

              {/* Interactive Schedule Workbench Banner */}
              {currentQ.scheduleText && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Schedule Token Sequence</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm tracking-wide">
                      {currentQ.scheduleText}
                    </span>
                  </div>

                  <button
                    onClick={() => onSendToAnalyzer(currentQ.scheduleText!)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Layers className="w-3.5 h-3.5" /> Analyze in Workbench
                  </button>
                </div>
              )}

              {/* Multiple Choice Options */}
              <div className="flex flex-col gap-2.5 pt-1">
                {currentQ.options.map((option, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  const hasSubmitted = Boolean(currentAttempt);
                  const isCorrect = oIdx === currentQ.correctIndex;
                  const isUserSelection = currentAttempt?.selectedIndex === oIdx;

                  let optClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-purple-300 dark:hover:border-purple-700';

                  if (hasSubmitted) {
                    if (isCorrect) {
                      optClass = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isUserSelection && !isCorrect) {
                      optClass = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold';
                    } else {
                      optClass = 'border-slate-200 dark:border-slate-800 opacity-60 text-slate-500';
                    }
                  } else if (isSelected) {
                    optClass = 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 font-bold shadow-sm';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={hasSubmitted}
                      onClick={() => setSelectedOption(oIdx)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition-all ${optClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {hasSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {hasSubmitted && isUserSelection && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit & Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {!currentAttempt ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {currentAttempt.isCorrect ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Correct Answer!
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Incorrect Answer
                        </span>
                      )}
                    </div>
                  )}

                  {onOpenAiTutorWithMessage && (
                    <button
                      onClick={() => onOpenAiTutorWithMessage(`Explain this official PYQ from ${currentQ.officialSource.sourceCitation}:\nQuestion: ${currentQ.question}\nOptions:\n${currentQ.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}\nCorrect Answer is Option ${String.fromCharCode(65 + currentQ.correctIndex)}: ${currentQ.options[currentQ.correctIndex]}\nExplanation:\n${currentQ.explanation}`)}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5" /> Explain with AI Tutor
                    </button>
                  )}
                </div>

                {/* Question Next/Prev Stepper */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(filteredPyqs.length - 1, prev + 1))}
                    disabled={currentIndex === filteredPyqs.length - 1}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detailed Official Explanation Box (shown after attempt or revealed) */}
              {currentAttempt && (
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 mt-2 animate-in fade-in duration-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Official Solution & Theoretical Derivation
                  </span>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-line bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {currentQ.explanation}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-8 h-8 mb-2 text-slate-400" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No PYQs Match Your Filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the exam, year, or topic filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
