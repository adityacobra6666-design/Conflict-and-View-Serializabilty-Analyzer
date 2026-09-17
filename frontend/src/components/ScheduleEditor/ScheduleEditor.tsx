import React, { useState } from 'react';
import { Play, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown, FileText, Table, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { ExampleSchedule } from '../../types';

interface ScheduleEditorProps {
  scheduleText: string;
  setScheduleText: (text: string) => void;
  onAnalyze: (text?: string, opsList?: any[]) => void;
  examples: ExampleSchedule[];
  loading: boolean;
}

interface TableRow {
  id: number;
  tx: string;
  type: 'READ' | 'WRITE';
  item: string;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  scheduleText,
  setScheduleText,
  onAnalyze,
  examples,
  loading
}) => {
  const [mode, setMode] = useState<'text' | 'table'>('text');
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { id: 1, tx: 'T1', type: 'READ', item: 'X' },
    { id: 2, tx: 'T2', type: 'WRITE', item: 'X' },
    { id: 3, tx: 'T1', type: 'WRITE', item: 'X' },
    { id: 4, tx: 'T3', type: 'WRITE', item: 'X' }
  ]);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('');

  const syncTableToText = (rows: TableRow[]) => {
    const text = rows.map(r => `${r.type === 'READ' ? 'R' : 'W'}${r.tx.replace(/\D/g, '') || '1'}(${r.item.toUpperCase() || 'X'})`).join(', ');
    setScheduleText(text);
  };

  const handleAddRow = () => {
    const nextId = tableRows.length > 0 ? Math.max(...tableRows.map(r => r.id)) + 1 : 1;
    const newRows: TableRow[] = [...tableRows, { id: nextId, tx: 'T1', type: 'READ', item: 'X' }];
    setTableRows(newRows);
    syncTableToText(newRows);
  };

  const handleDeleteRow = (id: number) => {
    const newRows = tableRows.filter(r => r.id !== id);
    setTableRows(newRows);
    syncTableToText(newRows);
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tableRows.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newRows = [...tableRows];
    const temp = newRows[index];
    newRows[index] = newRows[targetIndex];
    newRows[targetIndex] = temp;
    setTableRows(newRows);
    syncTableToText(newRows);
  };

  const handleRowChange = (id: number, field: keyof TableRow, value: string) => {
    const newRows = tableRows.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    setTableRows(newRows);
    syncTableToText(newRows);
  };

  const handleLoadExample = (exampleId: string) => {
    const ex = examples.find(e => e.id === exampleId);
    if (ex) {
      setScheduleText(ex.schedule_text);
      setSelectedExampleId(exampleId);
    }
  };

  const textValid = scheduleText.trim().length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header & Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Schedule Input
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Define transaction operations sequentially</p>
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'text'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Text Mode
          </button>
          <button
            onClick={() => setMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'table'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Visual Table
          </button>
        </div>
      </div>

      {/* Preset Examples Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Load Preset:
        </div>
        <select
          value={selectedExampleId}
          onChange={(e) => handleLoadExample(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">Select a classic schedule preset...</option>
          {examples.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title} ({ex.schedule_text})
            </option>
          ))}
        </select>
      </div>

      {/* Mode A: Text Input */}
      {mode === 'text' ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            rows={4}
            placeholder="e.g. R1(X), W2(X), W1(X), W3(X)"
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 transition-colors resize-y shadow-inner"
          />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-1">
            <span>Syntax: <code className="text-blue-600 dark:text-blue-400 font-semibold">R1(X)</code>, <code className="text-blue-600 dark:text-blue-400 font-semibold">W2(Y)</code>, <code className="text-blue-600 dark:text-blue-400 font-semibold">T1:R(X)</code></span>
            <span>Comma or newline separated</span>
          </div>
        </div>
      ) : (
        /* Mode B: Visual Table Mode */
        <div className="flex flex-col gap-3">
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">Transaction</th>
                  <th className="p-2.5">Operation</th>
                  <th className="p-2.5">Data Item</th>
                  <th className="p-2.5 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-800 dark:text-slate-200">
                {tableRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.tx}
                        onChange={(e) => handleRowChange(row.id, 'tx', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-16 text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.type}
                        onChange={(e) => handleRowChange(row.id, 'type', e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="READ">READ</option>
                        <option value="WRITE">WRITE</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => handleRowChange(row.id, 'item', e.target.value.toUpperCase())}
                        className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-16 text-xs uppercase"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleMoveRow(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveRow(idx, 'down')}
                          disabled={idx === tableRows.length - 1}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 hover:text-rose-600 text-slate-400"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleAddRow}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Operation
          </button>
        </div>
      )}

      {/* Live Validation Banner */}
      <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        {textValid ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">Valid schedule input ready for dual analysis</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-800 dark:text-amber-300 font-medium">Please enter at least one schedule operation</span>
          </>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onAnalyze(scheduleText)}
          disabled={!textValid || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          {loading ? 'Analyzing Schedule...' : 'Analyze Schedule'}
        </button>

        <button
          onClick={() => {
            setScheduleText('');
            setSelectedExampleId('');
          }}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Clear Input"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
