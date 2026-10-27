import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../services/api';
import { QuestionUploadResponse } from '../../types';
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
  EyeOff,
  Edit3, 
  RotateCcw,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface UploadQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule: (scheduleText: string, andAnalyze?: boolean) => void;
}

const SUPPORTED_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];

export const UploadQuestionModal: React.FC<UploadQuestionModalProps> = ({
  isOpen,
  onClose,
  onConfirmSchedule
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(true);

  // Extracted Result State
  const [extractedData, setExtractedData] = useState<QuestionUploadResponse | null>(null);

  // Editable parsed schedule & raw text
  const [editableSchedule, setEditableSchedule] = useState<string>('');
  const [editableRawText, setEditableRawText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePreviewUrlRef = useRef<string | null>(null);

  const cleanupPreviewUrl = () => {
    if (filePreviewUrlRef.current) {
      URL.revokeObjectURL(filePreviewUrlRef.current);
      filePreviewUrlRef.current = null;
    }
  };

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrl();
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    cleanupPreviewUrl();
    setFile(null);
    setFilePreviewUrl(null);
    setExtractedData(null);
    setErrorMsg(null);
    setUploading(false);
    onClose();
  };

  const handleFileChange = (selectedFile: File) => {
    setErrorMsg(null);
    setExtractedData(null);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !SUPPORTED_EXTS.includes(ext)) {
      setErrorMsg(`Unsupported file type '.${ext || 'unknown'}'. Please upload a PNG, JPG, JPEG, WEBP image or PDF document.`);
      return;
    }

    cleanupPreviewUrl();
    setFile(selectedFile);

    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      const url = URL.createObjectURL(selectedFile);
      filePreviewUrlRef.current = url;
      setFilePreviewUrl(url);
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
    if (!file || uploading) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const res = await apiService.uploadQuestionFile(file);
      setExtractedData(res);
      setEditableSchedule(res.parsed_schedule || '');
      setEditableRawText(res.raw_text || '');
    } catch (err: any) {
      console.error("Upload error", err);
      const detail = err.response?.data?.detail || "Failed to extract schedule from document. Please verify the document or retry.";
      setErrorMsg(detail);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectCandidate = (candidateText: string) => {
    setEditableSchedule(candidateText);
  };

  const handleResetFile = () => {
    cleanupPreviewUrl();
    setFile(null);
    setFilePreviewUrl(null);
    setExtractedData(null);
    setErrorMsg(null);
  };

  // Live parsed tokens and validation
  const parsedTokens = editableSchedule
    .split(/[\n\r,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const tokenValidation = parsedTokens.map(tok => {
    const isValid = /^(?:[rRwW]\d+\([a-zA-Z0-9_]+\)|T\d+:[rRwW]\([a-zA-Z0-9_]+\))$/i.test(tok);
    return { token: tok, isValid };
  });

  const hasInvalidTokens = tokenValidation.some(t => !t.isValid);
  const isValidSchedule = parsedTokens.length > 0 && !hasInvalidTokens;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 my-8 max-h-[90vh] overflow-y-auto">
        
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
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Close dialog"
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
                accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
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
                  Supported formats: PNG, JPG, JPEG, WEBP, PDF (Exam screenshots, question papers, notes)
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
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-semibold flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Image Preview
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetFile();
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    Remove file
                  </button>
                </div>
                <img src={filePreviewUrl} alt="Upload preview" className="max-h-48 max-w-full object-contain rounded" />
              </div>
            )}

            {/* PDF File Info Card */}
            {file && !filePreviewUrl && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{file.name}</span>
                    <span className="text-slate-400 text-[11px]">PDF Document ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="text-xs text-rose-500 hover:text-rose-700"
                >
                  Change file
                </button>
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
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || uploading}
                onClick={handleUploadAndExtract}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {uploading ? 'Extracting Schedule with OCR...' : 'Extract & Parse Schedule'}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Verification and Schedule Correction View */
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            
            {/* Status & Method Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-2.5">
              {extractedData.operation_count > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {extractedData.message}
                </span>
                <span className="text-[11px] text-slate-400">
                  {extractedData.ai_used 
                    ? 'AI vision transcribed the question document and identified transaction operations.' 
                    : 'Local OCR engine extracted text and parsed transaction operations with zero external API dependencies.'}
                </span>
              </div>
            </div>

            {/* Toggleable Original Image Preview for easy side-by-side verification */}
            {filePreviewUrl && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                    Original Question Image
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowImagePreview(!showImagePreview)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showImagePreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showImagePreview ? 'Hide Image' : 'Show Image'}
                  </button>
                </div>
                {showImagePreview && (
                  <div className="mt-2 max-h-40 overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                    <img src={filePreviewUrl} alt="Uploaded question reference" className="max-h-36 object-contain rounded" />
                  </div>
                )}
              </div>
            )}

            {/* Candidate Schedules Selection (if multiple detected in document) */}
            {extractedData.candidate_schedules && extractedData.candidate_schedules.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Multiple Candidate Schedules Detected — Select One:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedData.candidate_schedules.map((cs, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCandidate(cs.schedule_text)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                        editableSchedule === cs.schedule_text
                          ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 font-bold text-blue-900 dark:text-blue-100 shadow-xs'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                      }`}
                    >
                      <span className="block text-[10px] uppercase text-slate-400">{cs.label} ({cs.operation_count} ops)</span>
                      <code className="text-[11px] font-mono truncate block text-blue-600 dark:text-blue-400">{cs.schedule_text}</code>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notice for Uncertain / Ambiguous Tokens */}
            {extractedData.uncertain_parts && extractedData.uncertain_parts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Uncertain / Incomplete Operations Detected in Question:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1 text-amber-800 dark:text-amber-200">
                  {extractedData.uncertain_parts.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                  Please correct or complete any missing transactions or data items below before confirming.
                </p>
              </div>
            )}

            {/* Editable Schedule Input with Live Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  Extracted Schedule (Review and correct operations below):
                </label>
                <span className="text-[11px] font-mono font-bold text-blue-600">
                  {parsedTokens.length} Operations
                </span>
              </div>

              <input
                type="text"
                value={editableSchedule}
                onChange={(e) => setEditableSchedule(e.target.value)}
                placeholder="e.g. R1(X), W2(X), W1(X), W3(X)"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
              />

              {/* Visual Operation Flow Chips with Live Validation Badges */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[40px]">
                {tokenValidation.length > 0 ? (
                  tokenValidation.map((item, idx) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border transition-colors ${
                        item.isValid
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      }`}
                      title={item.isValid ? 'Valid operation' : 'Unrecognized format. Expected e.g. R1(X) or W2(Y)'}
                    >
                      {item.token}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No operations detected yet. Type operations above (e.g. R1(X), W2(X)).</span>
                )}
              </div>

              {hasInvalidTokens && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Some operations are malformed (highlighted in red). Expected syntax like R1(X), W2(Y).
                </p>
              )}
            </div>

            {/* Raw Extracted Question Text (Collapsible) */}
            <details className="group border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-xs">
              <summary className="cursor-pointer p-2.5 font-semibold text-slate-600 dark:text-slate-300 select-none flex items-center justify-between">
                <span>View Raw Extracted Document Text</span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-2.5 pt-0">
                <textarea
                  rows={3}
                  value={editableRawText}
                  onChange={(e) => setEditableRawText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono resize-y"
                />
              </div>
            </details>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Upload Different File
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleUploadAndExtract}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
                  title="Re-run OCR extraction on the file"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onConfirmSchedule(editableSchedule, false);
                    handleClose();
                  }}
                  disabled={!isValidSchedule}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-bold text-xs disabled:opacity-40 cursor-pointer"
                >
                  Load in Editor
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onConfirmSchedule(editableSchedule, true);
                    handleClose();
                  }}
                  disabled={!isValidSchedule}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 transition-all hover:scale-105 cursor-pointer"
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
