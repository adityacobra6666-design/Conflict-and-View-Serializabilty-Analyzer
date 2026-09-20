import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, CheckCircle, AlertTriangle, ShieldCheck, Loader2, RefreshCw, Trash2, Compass } from 'lucide-react';
import { apiService } from '../../services/api';

export interface BYOKConfig {
  provider: string; // 'openai-compatible' | 'openrouter' | 'gemini' | 'openai'
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const STORAGE_KEY = 'byok_ai_config';

export const getStoredBYOKConfig = (): BYOKConfig | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.apiKey.trim()) {
      return parsed;
    }
  } catch {
    // Silent catch
  }
  return null;
};

export const saveBYOKConfig = (config: BYOKConfig): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Clear localStorage to enforce session-only storage
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silent catch
  }
};

export const removeBYOKConfig = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silent catch
  }
};

interface BYOKSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: BYOKConfig | null) => void;
}

const PROVIDER_OPTIONS = [
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible (OpenRouter, Custom, Local)',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    placeholder: 'sk-or-v1-... or your API key'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-1.5-flash',
    placeholder: 'AIzaSy...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    placeholder: 'sk-...'
  }
];

const MODEL_EXAMPLES = [
  'google/gemini-2.5-flash',
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-4o-mini'
];

export const BYOKSettingsModal: React.FC<BYOKSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [provider, setProvider] = useState<string>('openai-compatible');
  const [baseUrl, setBaseUrl] = useState<string>('https://openrouter.ai/api/v1');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('openai/gpt-4o-mini');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const [testing, setTesting] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [discovering, setDiscovering] = useState<boolean>(false);
  const [discoveredModels, setDiscoveredModels] = useState<Array<{ id: string; name: string }>>([]);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const activeConfig = getStoredBYOKConfig();
      if (activeConfig && activeConfig.apiKey) {
        setProvider(activeConfig.provider || 'openai-compatible');
        setBaseUrl(activeConfig.baseUrl || 'https://openrouter.ai/api/v1');
        setApiKey(activeConfig.apiKey || '');
        setModel(activeConfig.model || 'openai/gpt-4o-mini');
        setIsSaved(true);
      } else {
        setProvider('openai-compatible');
        setBaseUrl('https://openrouter.ai/api/v1');
        setApiKey('');
        setModel('openai/gpt-4o-mini');
        setIsSaved(false);
      }
      setTestStatus(null);
      setShowKey(false);
      setDiscoveredModels([]);
      setDiscoverError(null);
      setShowModelDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizeUrlInput = (inputUrl: string, pId: string): string => {
    let clean = (inputUrl || '').trim();
    while (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    if (pId === 'openai-compatible' || clean.includes('openrouter.ai')) {
      if (!clean) return 'https://openrouter.ai/api/v1';
      if (clean === 'https://openrouter.ai') return 'https://openrouter.ai/api/v1';
      if (clean.endsWith('/api/v1')) return clean;
      return `${clean}/api/v1`;
    }
    return clean;
  };

  const handleProviderChange = (newProviderId: string) => {
    setProvider(newProviderId);
    setTestStatus(null);
    setDiscoveredModels([]);
    setDiscoverError(null);
    setShowModelDropdown(false);

    const pDef = PROVIDER_OPTIONS.find((p) => p.id === newProviderId) || PROVIDER_OPTIONS[0];
    setBaseUrl(pDef.defaultBaseUrl);
    setModel(pDef.defaultModel);
  };

  const handleDiscoverModels = async () => {
    if (!apiKey.trim()) {
      setDiscoverError('API key required to discover models.');
      return;
    }
    setDiscovering(true);
    setDiscoverError(null);
    setDiscoveredModels([]);

    const normUrl = normalizeUrlInput(baseUrl, provider);
    setBaseUrl(normUrl);

    try {
      const res = await apiService.discoverAiModels(provider, apiKey.trim(), normUrl);
      if (res.success && res.models && res.models.length > 0) {
        setDiscoveredModels(res.models);
        setShowModelDropdown(true);
      } else {
        setDiscoverError(res.message || 'Unable to discover models. You can enter a model ID manually.');
      }
    } catch {
      setDiscoverError('Unable to discover models. You can enter a model ID manually.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!apiKey.trim()) {
      setTestStatus({ success: false, message: '✕ API key cannot be empty.' });
      return;
    }
    if (!model.trim()) {
      setTestStatus({ success: false, message: '✕ Model Identifier cannot be empty.' });
      return;
    }

    const normUrl = normalizeUrlInput(baseUrl, provider);
    setBaseUrl(normUrl);

    setTesting(true);
    setTestStatus(null);

    try {
      const res = await apiService.testAiConnection(provider, apiKey.trim(), normUrl, model.trim());
      if (res.success) {
        const newConfig: BYOKConfig = {
          provider,
          baseUrl: normUrl,
          apiKey: apiKey.trim(),
          model: model.trim()
        };
        saveBYOKConfig(newConfig);
        setIsSaved(true);
        setTestStatus({ success: true, message: '✓ Connection Successful! Configuration Saved.' });
        onConfigSaved(newConfig);
      } else {
        setIsSaved(false);
        setTestStatus({ success: false, message: res.message || '✕ Connection Failed' });
      }
    } catch {
      setIsSaved(false);
      setTestStatus({ success: false, message: '✕ Connection Failed: Unable to reach the AI provider.' });
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveKey = () => {
    removeBYOKConfig();
    setApiKey('');
    setIsSaved(false);
    setTestStatus(null);
    setDiscoveredModels([]);
    setDiscoverError(null);
    onConfigSaved(null);
  };

  const getMaskedFingerprint = (key: string) => {
    if (!key) return '';
    const clean = key.trim();
    if (clean.length <= 8) return '••••••••••••';
    const prefix = clean.slice(0, 3);
    const suffix = clean.slice(-4);
    return `${prefix}-••••••••••••${suffix}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                AI Assistant Configuration (BYOK)
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                {isSaved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ● Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    ● Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleTestAndSave} className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* SELECT AI PROVIDER */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              SELECT AI PROVIDER
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {PROVIDER_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* BASE API URL */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                BASE API URL
              </label>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                AUTO-NORMALIZED
              </span>
            </div>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setTestStatus(null);
              }}
              onBlur={(e) => setBaseUrl(normalizeUrlInput(e.target.value, provider))}
              placeholder="https://openrouter.ai/api/v1"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              For OpenRouter, enter: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">https://openrouter.ai/</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">https://openrouter.ai/api/v1</code>
            </p>
          </div>

          {/* API KEY */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                API KEY
              </label>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                STORED IN BROWSER SESSION
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsSaved(false);
                  setTestStatus(null);
                }}
                placeholder={PROVIDER_OPTIONS.find((p) => p.id === provider)?.placeholder}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showKey ? 'Hide Key' : 'Show Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isSaved && !showKey && apiKey && (
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                Configured Key Fingerprint: {getMaskedFingerprint(apiKey)}
              </p>
            )}
          </div>

          {/* MODEL IDENTIFIER */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                MODEL IDENTIFIER
              </label>
              <button
                type="button"
                onClick={handleDiscoverModels}
                disabled={discovering || !apiKey.trim()}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40"
              >
                {discovering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Discovering...
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" /> [ Discover Models ]
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestStatus(null);
              }}
              placeholder="openai/gpt-4o-mini"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Discovered Models Dropdown / Picker */}
            {showModelDropdown && discoveredModels.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 max-h-36 overflow-y-auto flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 px-1">
                  Select Discovered Model ({discoveredModels.length} available):
                </span>
                {discoveredModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModel(m.id);
                      setShowModelDropdown(false);
                    }}
                    className="text-left text-xs font-mono py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    {m.id} {m.name && m.name !== m.id ? `(${m.name})` : ''}
                  </button>
                ))}
              </div>
            )}

            {discoverError && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {discoverError}
              </p>
            )}

            {/* Examples list */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-medium">Examples:</span>
              <div className="flex flex-wrap gap-1">
                {MODEL_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setModel(ex)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-700 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test & Connection Status Feedback */}
          {testStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 font-medium leading-relaxed ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <span className="font-semibold">{testStatus.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={testing || !apiKey.trim() || !model.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-40"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Testing Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> [ Test Connection & Save ]
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRemoveKey}
              className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> [ Remove Key ]
            </button>
          </div>

          {/* Security Assurance Footnote */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Security Assurance:</strong> Your API key is stored only in your browser session and is never saved in the project database or source code.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
