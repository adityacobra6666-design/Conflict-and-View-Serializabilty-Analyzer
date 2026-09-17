import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { apiService } from '../../services/api';
import { Bot, Sparkles, BookOpen, HelpCircle, FileText, Send, X } from 'lucide-react';

interface AITutorProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
}

export const AITutor: React.FC<AITutorProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [sourceNote, setSourceNote] = useState<string>('');

  if (!isOpen) return null;

  const handleAsk = async (promptType: string = 'explain_result', question?: string) => {
    if (!analysis) return;
    setLoading(true);
    try {
      const res = await apiService.askAiTutor(analysis, promptType, question);
      setResponse(res.explanation);
      setSourceNote(res.source || 'DBMS Intelligence Assistant');
    } catch (err) {
      setResponse('Failed to reach AI Tutor service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                DBMS AI Tutor Assistant
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Contextual pedagogical explanation engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Quick Action Presets */}
          <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Tutor Prompts:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAsk('explain_result')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Explain Result
              </button>
              <button
                onClick={() => handleAsk('beginner')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> ELI5 Beginner
              </button>
              <button
                onClick={() => handleAsk('conflicts')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5 text-rose-500" /> Conflict Breakdown
              </button>
              <button
                onClick={() => handleAsk('viva')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" /> Viva Questions
              </button>
            </div>
          </div>

          {/* AI Response Output Card */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 min-h-[300px] shadow-inner">
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Synthesizing Pedagogical Explanation...</span>
              </div>
            ) : response ? (
              <div className="flex flex-col gap-2">
                {sourceNote && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 self-start font-bold">
                    Source: {sourceNote}
                  </span>
                )}
                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {response}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs text-center p-6">
                <Bot className="w-8 h-8 text-slate-400 mb-2" />
                Select a tutor prompt above or ask a custom DBMS question below to receive authoritative explanations.
              </div>
            )}
          </div>
        </div>

        {/* Footer Question Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && customQuestion && handleAsk('custom', customQuestion)}
            placeholder="Ask AI Tutor a question about this schedule..."
            className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => customQuestion && handleAsk('custom', customQuestion)}
            disabled={!customQuestion || loading}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
