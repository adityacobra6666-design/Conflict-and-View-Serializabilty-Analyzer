import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult } from '../../types';
import { apiService } from '../../services/api';
import { Bot, Sparkles, BookOpen, HelpCircle, FileText, Send, X, Settings, Key, AlertCircle, Trash2, User } from 'lucide-react';
import { BYOKSettingsModal, BYOKConfig, getStoredBYOKConfig } from './BYOKSettingsModal';

interface AITutorProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  isError?: boolean;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'init-1',
  role: 'assistant',
  content: 'Hello! I am your AI Assistant and DBMS Tutor. Ask me anything — whether about database transaction schedules, DBMS concepts, programming languages, algorithms, networking, or general topics!'
};

export const AITutor: React.FC<AITutorProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [loading, setLoading] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [byokConfig, setByokConfig] = useState<BYOKConfig | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      const config = getStoredBYOKConfig();
      setByokConfig(config);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptType: string = 'custom', textOverride?: string) => {
    const questionText = textOverride || customQuestion;
    if (!questionText || !questionText.trim()) return;

    const currentConfig = byokConfig || getStoredBYOKConfig();
    if (!currentConfig || !currentConfig.apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText.trim()
    };

    const newMessagesHistory = [...messages, userMsg];
    setMessages(newMessagesHistory);
    setCustomQuestion('');
    setLoading(true);

    // Format conversation messages payload for backend
    const messagesPayload = newMessagesHistory
      .filter((m) => !m.isError && m.id !== 'init-1')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await apiService.askAiTutor(
        analysis,
        promptType,
        questionText.trim(),
        currentConfig,
        messagesPayload
      );

      if (res.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.explanation,
          source: res.source || 'AI Tutor Assistant'
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.explanation || 'Please verify your API key and provider settings.',
          source: 'AI Tutor Error',
          isError: true
        };
        setMessages((prev) => [...prev, errorMsg]);
        if (res.error_code === 'NO_KEY' || res.error_code === 'INVALID_KEY') {
          setIsSettingsOpen(true);
        }
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Please verify your API key and provider settings.',
        source: 'AI Tutor Error',
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
  };

  const providerName =
    byokConfig?.provider === 'gemini'
      ? 'Gemini'
      : byokConfig?.provider === 'openai'
      ? 'OpenAI'
      : byokConfig?.provider === 'openai-compatible' || byokConfig?.provider === 'openrouter'
      ? 'OpenRouter / OpenAI-Compatible'
      : 'Configured Provider';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  AI Tutor & Generic Assistant
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {byokConfig ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {providerName}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Key Required
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="AI Settings"
              >
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">⚙ AI Settings</span>
              </button>

              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Presets */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Tutor Prompts:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSendMessage('explain_result', 'Explain the current schedule analysis result in detail.')}
                className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" /> Explain
              </button>
              <button
                onClick={() => handleSendMessage('beginner', 'Explain this like I am a complete beginner (ELI5).')}
                className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <BookOpen className="w-3 h-3 text-blue-600" /> ELI5
              </button>
              <button
                onClick={() => handleSendMessage('conflicts', 'Explain all conflict operations and precedence graph edges in detail.')}
                className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3 h-3 text-rose-500" /> Conflicts
              </button>
              <button
                onClick={() => handleSendMessage('viva', 'Generate 3 viva interview questions with answers based on this schedule.')}
                className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <FileText className="w-3 h-3 text-purple-600" /> Viva Qs
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-100/50 dark:bg-slate-950">
            {!byokConfig && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-2 font-semibold">
                  <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Bring Your Own Key to enable AI responses.
                </span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700 transition-colors"
                >
                  Configure
                </button>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed font-sans shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800 rounded-tl-xs'
                      : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs'
                  }`}
                >
                  {msg.source && (
                    <span className="block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 mb-1.5 font-bold self-start w-max">
                      {msg.source}
                    </span>
                  )}
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center justify-start">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold">Thinking & generating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('custom')}
              placeholder="Ask anything..."
              className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <button
              onClick={() => handleSendMessage('custom')}
              disabled={!customQuestion.trim() || loading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-40 shadow-sm transition-colors flex items-center gap-1 text-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* BYOK Settings Modal */}
      <BYOKSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={(newConfig) => setByokConfig(newConfig)}
      />
    </>
  );
};
