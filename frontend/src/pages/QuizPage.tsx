import React, { useState, useEffect } from 'react';
import { QuizConfig, QuizQuestion, DifficultyLevel, QuizAttempt, UserAnswer } from '../types/quiz';
import { fetchQuizQuestions } from '../services/aiQuizService';
import { saveQuizAttempt } from '../services/quizHistory';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw, AlertTriangle, Trophy, Sparkles, Brain, Bot, ArrowLeft } from 'lucide-react';

interface QuizPageProps {
  onOpenAiTutorWithMessage?: (prompt: string) => void;
}

type QuizState = 'setup' | 'active' | 'result' | 'review';

const TOPIC_OPTIONS = [
  'Conflict & View Serializability',
  'Conflict Serializability',
  'View Serializability',
  'Precedence Graphs',
  'Transaction Schedules',
  'Mixed DBMS'
];

export const QuizPage: React.FC<QuizPageProps> = ({ onOpenAiTutorWithMessage }) => {
  // Quiz Setup Config State
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [topic, setTopic] = useState<string>('Conflict & View Serializability');

  // Quiz Execution State
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // User selections & submission history for current quiz session
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Exit Modal Confirmation
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Timer
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (quizState === 'active') {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState, startTime]);

  const handleStartQuiz = async () => {
    const config: QuizConfig = { difficulty, questionCount, topic };
    const fetched = await fetchQuizQuestions(config);
    setQuestions(fetched);
    setCurrentIndex(0);
    setUserAnswers({});
    setSelectedOption(null);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');
  };

  const handleSelectOption = (idx: number) => {
    const currentQ = questions[currentIndex];
    const existing = userAnswers[currentQ.id];
    if (existing?.submitted) return; // Locked after submission
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;

    const answerRecord: UserAnswer = {
      questionId: currentQ.id,
      selectedIndex: selectedOption,
      isCorrect,
      submitted: true
    };

    setUserAnswers(prev => ({ ...prev, [currentQ.id]: answerRecord }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      const existing = userAnswers[nextQ.id];
      setSelectedOption(existing ? existing.selectedIndex : null);
    } else {
      // Quiz finished
      finishQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevQ = questions[prevIdx];
      const existing = userAnswers[prevQ.id];
      setSelectedOption(existing ? existing.selectedIndex : null);
    }
  };

  const finishQuiz = () => {
    const score = questions.reduce((acc, q) => {
      const ans = userAnswers[q.id];
      return ans && ans.isCorrect ? acc + 1 : acc;
    }, 0);

    const percentage = Math.round((score / questions.length) * 100);
    const answersMap: Record<string, number> = {};
    Object.values(userAnswers).forEach(a => {
      answersMap[a.questionId] = a.selectedIndex;
    });

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      difficulty,
      topic,
      totalQuestions: questions.length,
      score,
      percentage,
      timeTakenSeconds: elapsedSeconds,
      userAnswers: answersMap
    };

    saveQuizAttempt(attempt);
    setQuizState('result');
  };

  const handleAskAiTutorForQuestion = (q: QuizQuestion, selectedIdx: number) => {
    if (!onOpenAiTutorWithMessage) return;
    const selectedLabel = String.fromCharCode(65 + selectedIdx);
    const selectedText = q.options[selectedIdx];
    const correctLabel = String.fromCharCode(65 + q.correctIndex);
    const correctText = q.options[q.correctIndex];

    const prompt = `Explain why option ${selectedLabel} ("${selectedText}") is incorrect for the question: "${q.question}" and why option ${correctLabel} ("${correctText}") is correct. Please explain it in clear, beginner-friendly terms.`;
    onOpenAiTutorWithMessage(prompt);
  };

  const calculateScore = () => {
    return questions.reduce((acc, q) => {
      const ans = userAnswers[q.id];
      return ans && ans.isCorrect ? acc + 1 : acc;
    }, 0);
  };

  // ==========================================
  // RENDER 1: SETUP SCREEN
  // ==========================================
  if (quizState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
        {/* Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Brain className="w-4 h-4 text-blue-600" /> Educational Quiz Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            DBMS Knowledge Quiz
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Test your understanding of Conflict Serializability, View Serializability, Precedence Graphs, and Schedules.
          </p>
        </div>

        {/* Setup Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Choose Quiz Preferences
          </h2>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              DIFFICULTY LEVEL
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                    difficulty === d
                      ? d === 'Easy'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : d === 'Medium'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
              {difficulty === 'Easy' && 'Basic definitions, conflict rules, and straightforward schedule concepts.'}
              {difficulty === 'Medium' && 'Multi-operation schedules, precedence graph edges, cycles, and reads-from relationships.'}
              {difficulty === 'Hard' && 'Complex multi-transaction schedules, blind writes, NP-completeness, and candidate serial orders.'}
            </p>
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              NUMBER OF QUESTIONS
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[5, 10, 15, 20].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                    questionCount === count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              TOPIC FOCUS
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TOPIC_OPTIONS.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Start Quiz Action */}
          <div className="pt-4">
            <button
              onClick={handleStartQuiz}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> START QUIZ NOW
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: ACTIVE QUIZ SCREEN
  // ==========================================
  if (quizState === 'active' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const currentAnswer = userAnswers[currentQ.id];
    const isSubmitted = currentAnswer?.submitted || false;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
        {/* Header Progress & Exit Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span className="text-slate-600 dark:text-slate-300">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                Score: {calculateScore()}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Exit Quiz
          </button>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {currentQ.difficulty} • {currentQ.topic}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {elapsedSeconds}s
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h2>

            {currentQ.scheduleText && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
                Schedule: <span className="underline">{currentQ.scheduleText}</span>
              </div>
            )}
          </div>

          {/* Options (Exactly 4 Options) */}
          <div className="space-y-3">
            {currentQ.options.map((optText, idx) => {
              const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === currentQ.correctIndex;

              let optionStyle = 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60';

              if (isSubmitted) {
                if (isCorrectOption) {
                  optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
                } else {
                  optionStyle = 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                optionStyle = 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-900 dark:text-blue-100 font-bold shadow-sm';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${optionStyle}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {optionLabel}
                  </span>
                  <span className="flex-1 mt-0.5">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          {!isSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm disabled:opacity-40 transition-colors"
            >
              Submit Answer
            </button>
          ) : (
            /* Post-Submission Feedback Box */
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
              {currentAnswer?.isCorrect ? (
                /* Correct Feedback */
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Correct!
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {currentQ.explanation}
                  </p>
                </div>
              ) : (
                /* Incorrect Feedback — Explicit Breakdown */
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-sm">
                    <XCircle className="w-5 h-5 text-rose-600" /> Incorrect
                  </div>

                  <div className="space-y-1.5 font-sans text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                        Correct Answer: {String.fromCharCode(65 + currentQ.correctIndex)}. {currentQ.options[currentQ.correctIndex]}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        <strong>Why?</strong> {currentQ.explanation}
                      </p>
                    </div>

                    {selectedOption !== null && (
                      <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/60">
                        <span className="font-bold text-rose-700 dark:text-rose-400 block font-mono">
                          Your Selected Answer: {String.fromCharCode(65 + selectedOption)}. {currentQ.options[selectedOption]}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          <strong>Why it is wrong:</strong> {currentQ.optionExplanations ? currentQ.optionExplanations[selectedOption] : 'This option does not satisfy the required DBMS conditions for this question.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ask AI Tutor Button */}
                  {onOpenAiTutorWithMessage && selectedOption !== null && (
                    <button
                      type="button"
                      onClick={() => handleAskAiTutorForQuestion(currentQ, selectedOption)}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Bot className="w-4 h-4" /> Ask AI Tutor to Explain This
                    </button>
                  )}
                </div>
              )}

              {/* Navigation Action */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-30"
                >
                  Previous
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>Next Question <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Finish & View Results <Trophy className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Exit Quiz?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your current quiz progress will be lost.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setQuizState('setup');
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Exit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER 3: RESULT SCREEN
  // ==========================================
  if (quizState === 'result') {
    const score = calculateScore();
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    let bandText = 'Review the fundamentals';
    let bandColor = 'text-rose-600 dark:text-rose-400';
    if (percentage >= 90) {
      bandText = 'Excellent understanding!';
      bandColor = 'text-emerald-600 dark:text-emerald-400';
    } else if (percentage >= 70) {
      bandText = 'Good understanding!';
      bandColor = 'text-blue-600 dark:text-blue-400';
    } else if (percentage >= 50) {
      bandText = 'Needs some revision';
      bandColor = 'text-amber-600 dark:text-amber-400';
    }

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800 shadow-sm">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              QUIZ COMPLETED
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {topic}
            </h1>
          </div>

          {/* Big Score Card */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto space-y-2">
            <div className="text-4xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
              {score} / {total}
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">
              {percentage}%
            </div>
            <div className={`text-xs font-bold uppercase tracking-wider ${bandColor}`}>
              {bandText}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold">CORRECT</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{score}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold">INCORRECT</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{total - score}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold">DIFFICULTY</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{difficulty}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setQuizState('review')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              [ Review Answers ]
            </button>
            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> [ Retake Quiz ]
            </button>
            <button
              onClick={() => setQuizState('setup')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              [ Back to Quiz Setup ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 4: REVIEW MODE
  // ==========================================
  if (quizState === 'review') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Quiz Answer Review
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Reviewing {questions.length} questions ({difficulty} Difficulty)
            </p>
          </div>
          <button
            onClick={() => setQuizState('result')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const ans = userAnswers[q.id];
            const isCorrect = ans?.isCorrect || false;
            const selectedIdx = ans ? ans.selectedIndex : -1;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 space-y-4 shadow-2xs ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
                    <span className="font-mono text-slate-400">{idx + 1}.</span> {q.question}
                  </h3>
                  {isCorrect ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold font-mono flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold font-mono flex items-center gap-1 shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs font-sans">
                  {selectedIdx !== -1 && (
                    <div className={isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-bold font-mono' : 'text-rose-700 dark:text-rose-400 font-bold font-mono'}>
                      Your Answer: {String.fromCharCode(65 + selectedIdx)}. {q.options[selectedIdx]}
                    </div>
                  )}

                  {!isCorrect && (
                    <div className="text-emerald-700 dark:text-emerald-400 font-bold font-mono pt-1">
                      Correct Answer: {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs mt-2 leading-relaxed">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
