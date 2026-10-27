import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Table, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Upload,
  ChevronDown
} from 'lucide-react';
import { ExampleSchedule } from '../../types';
import { UploadQuestionModal } from './UploadQuestionModal';

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

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
    } else {
      setSelectedExampleId('');
    }
  };

  const textValid = scheduleText.trim().length > 0;

  // Real-time operation count detection for subtle UI indicator
  const recognizedOpCount = scheduleText
    .split(/[\n\r,;]+/)
    .map(t => t.trim())
    .filter(t => /^[rRwW]\s*\d+\s*\(\s*[a-zA-Z0-9_]+\s*\)|^[tT]\s*\d+\s*:\s*[rRwW]\s*\(\s*[a-zA-Z0-9_]+\s*\)/i.test(t))
    .length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5 w-full min-w-0">
      {/* Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Schedule Input
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Define transaction operations sequentially
          </p>
        </div>

        {/* Compact Input-Mode Controls */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* 1. Upload Question */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors shadow-xs cursor-pointer"
            title="Upload a question image (PNG, JPG, WEBP) or PDF document"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="whitespace-nowrap">Upload Question</span>
          </button>

          {/* 2 & 3. Segmented Control for Text Mode & Visual Table */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                mode === 'text'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Text Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                mode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Table className="w-3.5 h-3.5 shrink-0" />
              <span>Visual Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Examples Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Load Preset:</span>
        </div>
        <div className="relative flex-1 min-w-0 max-w-full">
          <select
            value={selectedExampleId}
            onChange={(e) => handleLoadExample(e.target.value)}
            className="w-full min-w-0 max-w-full truncate bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select a classic schedule preset...</option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.schedule_text})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Mode A: Text Input */}
      {mode === 'text' ? (
        <div className="flex flex-col gap-2 min-w-0">
          <textarea
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            rows={3}
            placeholder="e.g. R1(X), W2(X), W1(X), W3(X)"
            className="w-full min-w-0 max-w-full bg-slate-50/70 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[84px] max-h-[180px] leading-relaxed break-all whitespace-pre-wrap"
          />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-1.5">
            <span className="flex items-center gap-1 flex-wrap">
              <span>Syntax:</span>
              <code className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">R1(X)</code>
              <code className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">W2(Y)</code>
              <code className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">T1:R(X)</code>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">
              {recognizedOpCount > 0 ? `${recognizedOpCount} ops detected` : 'Comma or newline separated'}
            </span>
          </div>
        </div>
      ) : (
        /* Mode B: Visual Table Mode */
        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="w-full min-w-0 max-w-full max-h-56 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <table className="w-full text-left text-xs min-w-[320px]">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-2 w-8 text-center">#</th>
                  <th className="p-2">Tx</th>
                  <th className="p-2">Operation</th>
                  <th className="p-2">Data Item</th>
                  <th className="p-2 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-800 dark:text-slate-200">
                {tableRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.tx}
                        onChange={(e) => handleRowChange(row.id, 'tx', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-14 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={row.type}
                        onChange={(e) => handleRowChange(row.id, 'type', e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="READ">READ</option>
                        <option value="WRITE">WRITE</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => handleRowChange(row.id, 'item', e.target.value.toUpperCase())}
                        className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-14 text-xs uppercase"
                      />
                    </td>
                    <td className="p-1.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveRow(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRow(idx, 'down')}
                          disabled={idx === tableRows.length - 1}
                          className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 hover:text-rose-600 text-slate-400 cursor-pointer"
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
            type="button"
            onClick={handleAddRow}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Operation
          </button>
        </div>
      )}

      {/* Live Validation Banner */}
      <div className={`flex items-center gap-2 text-xs py-2 px-3 rounded-xl border min-w-0 ${
        textValid
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
      }`}>
        {textValid ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium truncate">Valid schedule input ready for dual analysis</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium truncate">Please enter at least one schedule operation</span>
          </>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 min-w-0">
        <button
          type="button"
          onClick={() => onAnalyze(scheduleText)}
          disabled={!textValid || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white shrink-0" />
          )}
          <span>{loading ? 'Analyzing Schedule...' : 'Analyze Schedule'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setScheduleText('');
            setSelectedExampleId('');
          }}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          title="Clear Input"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Question Image/PDF Modal */}
      <UploadQuestionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirmSchedule={(text, andAnalyze) => {
          setScheduleText(text);
          setMode('text');
          if (andAnalyze) {
            onAnalyze(text);
          }
        }}
      />
    </div>
  );
};

