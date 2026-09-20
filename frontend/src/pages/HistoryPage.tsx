import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { QuizAttempt } from '../types/quiz';
import { apiService } from '../services/api';
import { getStoredQuizHistory } from '../services/quizHistory';
import { History, Search, Play, Trash2, Brain, Trophy } from 'lucide-react';

interface HistoryPageProps {
  onReRunSchedule: (scheduleText: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onReRunSchedule }) => {
  const [activeSubTab, setActiveSubTab] = useState<'analysis' | 'quiz'>('analysis');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    apiService.getHistory().then(res => {
      setHistoryItems(res.history || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));

    setQuizAttempts(getStoredQuizHistory());
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this analysis entry?")) return;
    try {
      await apiService.deleteHistoryItem(id);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAnalysis = historyItems.filter(h =>
    h.schedule_text.toLowerCase().includes(search.toLowerCase()) ||
    h.headline.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuiz = quizAttempts.filter(q =>
    q.topic.toLowerCase().includes(search.toLowerCase()) ||
    q.difficulty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" /> Execution & Activity History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Persisted past schedule analysis executions and interactive quiz attempt results</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSubTab('analysis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'analysis'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Schedule Analysis ({historyItems.length})
            </button>
            <button
              onClick={() => setActiveSubTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'quiz'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> Quiz Attempts ({quizAttempts.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ANALYSIS HISTORY TAB */}
      {activeSubTab === 'analysis' && (
        <>
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              Loading persisted history...
            </div>
          ) : filteredAnalysis.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4"># ID</th>
                    <th className="p-4">Schedule Token String</th>
                    <th className="p-4">Tx / Ops</th>
                    <th className="p-4">Conflict Result</th>
                    <th className="p-4">View Result</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {filteredAnalysis.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-500">#{item.id}</td>
                      <td className="p-4 font-mono font-bold text-amber-700 dark:text-amber-300">{item.schedule_text}</td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{item.transaction_count} Tx / {item.operation_count} Ops</td>
                      <td className="p-4 font-bold">
                        {item.conflict_serializable ? (
                          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400">✓ YES</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400">✕ NO</span>
                        )}
                      </td>
                      <td className="p-4 font-bold">
                        {item.view_serializable ? (
                          <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300">✓ YES</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400">✕ NO</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onReRunSchedule(item.schedule_text)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                            title="Replay in Simulator"
                          >
                            <Play className="w-3 h-3 fill-white" /> Replay Simulation
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              No history entries found. Run analyses on the Analyzer screen to save results into history.
            </div>
          )}
        </>
      )}

      {/* QUIZ ATTEMPTS HISTORY TAB */}
      {activeSubTab === 'quiz' && (
        <>
          {filteredQuiz.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Quiz Topic</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Percentage</th>
                    <th className="p-4">Time Elapsed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {filteredQuiz.map(attempt => (
                    <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> {attempt.topic}
                      </td>
                      <td className="p-4 font-bold">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-mono ${
                          attempt.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : attempt.difficulty === 'Medium'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {attempt.difficulty}
                        </span>
                      </td>
                      <td className="p-4 font-bold font-mono">
                        {attempt.score} / {attempt.totalQuestions}
                      </td>
                      <td className="p-4 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {attempt.percentage}%
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        {attempt.timeTakenSeconds}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              No quiz attempts recorded yet. Take a quiz from the Interactive Quiz tab to track your scores.
            </div>
          )}
        </>
      )}
    </div>
  );
};
