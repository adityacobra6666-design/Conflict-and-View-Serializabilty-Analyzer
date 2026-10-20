import React, { useState, useRef } from 'react';
import { apiService } from '../../services/api';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Eye, 
  Edit3, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';

interface UploadQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule: (scheduleText: string, andAnalyze?: boolean) => void;
}

export const UploadQuestionModal: React.FC<UploadQuestionModalProps> = ({
  isOpen,
  onClose,
  onConfirmSchedule
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted Result State
  const [extractedData, setExtractedData] = useState<{
    raw_text: string;
    parsed_schedule: string;
    candidate_schedules: Array<{ label: string; schedule_text: string; operation_count: number }>;
    uncertain_parts: string[];
    ai_available: boolean;
    ai_used: boolean;
    message: string;
  } | null>(null);

  // Editable parsed schedule
  const [editableSchedule, setEditableSchedule] = useState<string>('');
  const [editableRawText, setEditableRawText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    setErrorMsg(null);
    setExtractedData(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !['png', 'jpg', 'jpeg', 'pdf'].includes(ext)) {
      setErrorMsg("Please upload a valid PNG, JPG, JPEG, or PDF file.");
      return;
    }

    setFile(selectedFile);
    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      setFilePreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const res = await apiService.uploadQuestionFile(file);
      setExtractedData(res);
      setEditableSchedule(res.parsed_schedule || '');
      setEditableRawText(res.raw_text || '');
    } catch (err: any) {
      console.error("Upload error", err);
      const detail = err.response?.data?.detail || "Failed to extract schedule from document. Please verify backend status.";
      setErrorMsg(detail);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectCandidate = (candidateText: string) => {
    setEditableSchedule(candidateText);
  };

  const parsedChips = editableSchedule
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Question (Image or PDF)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract and automatically analyze DBMS transaction schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: File Selection Area */}
        {!extractedData ? (
          <div className="flex flex-col gap-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 transition-colors text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {file ? file.name : "Click to browse or drag & drop file"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: PNG, JPG, JPEG, PDF (Exam screenshots, question papers, notes)
                </p>
              </div>

              {file && (
                <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/80 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Thumbnail Preview for Images */}
            {filePreviewUrl && (
              <div className="max-h-40 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <img src={filePreviewUrl} alt="Upload preview" className="max-h-36 object-contain rounded" />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || uploading}
                onClick={handleUploadAndExtract}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 transition-all"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {uploading ? 'Extracting Schedule...' : 'Extract & Parse Schedule'}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Verification and Schedule Correction View */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            
            {/* Status & Method Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {extractedData.message}
                </span>
                <span className="text-[11px] text-slate-400">
                  {extractedData.ai_used ? 'AI vision identified transaction operations and exact sequence.' : 'Local document text parser extracted schedule notation.'}
                </span>
              </div>
            </div>

            {/* Candidate Schedules Selection (if multiple detected) */}
            {extractedData.candidate_schedules && extractedData.candidate_schedules.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select Question Schedule:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedData.candidate_schedules.map((cs, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCandidate(cs.schedule_text)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-colors ${
                        editableSchedule === cs.schedule_text
                          ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 font-bold text-blue-900 dark:text-blue-100'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-[10px] uppercase text-slate-400">{cs.label} ({cs.operation_count} ops)</span>
                      <code className="text-[11px] font-mono truncate block">{cs.schedule_text}</code>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editable Schedule Input with Live Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  Parsed Schedule (You can correct or edit operations below):
                </label>
                <span className="text-[11px] font-mono font-bold text-blue-600">
                  {parsedChips.length} Operations
                </span>
              </div>

              <input
                type="text"
                value={editableSchedule}
                onChange={(e) => setEditableSchedule(e.target.value)}
                placeholder="e.g. R1(X), W2(X), W1(X), W3(X)"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
              />

              {/* Visual Operation Flow Chips */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[36px]">
                {parsedChips.length > 0 ? (
                  parsedChips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-900"
                    >
                      {chip}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No valid operations parsed yet. Enter or correct operations above.</span>
                )}
              </div>
            </div>

            {/* Raw Extracted Question Text (Collapsible/Editable) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 block">
                Extracted Question Text:
              </label>
              <textarea
                rows={3}
                value={editableRawText}
                onChange={(e) => setEditableRawText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 resize-y"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Upload Different File
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onConfirmSchedule(editableSchedule, false);
                    onClose();
                  }}
                  disabled={!editableSchedule.trim()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-bold text-xs disabled:opacity-40"
                >
                  Load in Editor
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onConfirmSchedule(editableSchedule, true);
                    onClose();
                  }}
                  disabled={!editableSchedule.trim()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 transition-all hover:scale-105"
                >
                  <Layers className="w-4 h-4" /> Confirm & Analyze
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
