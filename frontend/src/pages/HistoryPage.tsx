import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { apiService } from '../services/api';
import { History, Search, Play, Trash2 } from 'lucide-react';

interface HistoryPageProps {
  onReRunSchedule: (scheduleText: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onReRunSchedule }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    apiService.getHistory().then(res => {
      setHistoryItems(res.history || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
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

  const filtered = historyItems.filter(h =>
    h.schedule_text.toLowerCase().includes(search.toLowerCase()) ||
    h.headline.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" /> Saved Schedule Analysis History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">SQLite persisted past executions with re-run and inspection capabilities</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past analyses..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          Loading persisted history...
        </div>
      ) : filtered.length > 0 ? (
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
              {filtered.map(item => (
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
    </div>
  );
};
