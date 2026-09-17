import React, { useState, useEffect } from 'react';
import {
  Cpu, Save, ShieldAlert, Check, RefreshCw, Sliders,
  Key, Database, Server, Zap, Activity, CheckCircle2,
  XCircle, AlertTriangle, Clock, Eye, EyeOff, Sparkles,
  Layers, Lock, HelpCircle, ArrowRight, ExternalLink
} from 'lucide-react';
import { SystemConfig } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { parseApiKeys, maskApiKey } from '../../utils/apiKeys';

export const AdminSystemConfigView: React.FC = () => {
  const { showError, showSuccess, showInfo } = useNotification();
  
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Key visibility toggles
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showBackupKey, setShowBackupKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);

  // API Key Testing states
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  // Multi-Key Pool testing states
  const [testingPool, setTestingPool] = useState(false);
  const [poolResults, setPoolResults] = useState<Array<{ key: string; maskedKey: string; ok: boolean; latencyMs?: number; error?: string }> | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data: any = await api.getSystemConfig();
      const savedFallback = localStorage.getItem('petcare_fallback_config');
      let localFallback: any = {};
      try {
        if (savedFallback) localFallback = JSON.parse(savedFallback);
      } catch {}

      const merged = {
        aiModel: data?.aiModel || 'gemini-2.5-flash',
        temperature: data?.temperature ?? 0.4,
        systemPrompt: data?.systemPrompt || '',
        maxTokens: data?.maxTokens || 2048,
        emergencyKeywords: data?.emergencyKeywords || ['máu', 'co giật', 'khó thở', 'bất tỉnh'],
        geminiApiKey: data?.geminiApiKey || '',
        backupGeminiApiKey: data?.backupGeminiApiKey || '',
        renderServiceUrl: data?.renderServiceUrl || 'https://pet-chatbot-ai.onrender.com',
        openaiApiKey: data?.openaiApiKey || '',
        customApiBaseUrl: data?.customApiBaseUrl || '',
        customModelName: data?.customModelName || '',
        apiProvider: data?.apiProvider || 'gemini',
        autoKeepAliveIntervalMinutes: data?.autoKeepAliveIntervalMinutes || 10,
        enableGeminiFallback: data?.enableGeminiFallback ?? localFallback.enableGeminiFallback ?? true,
        fallbackGeminiApiKey: data?.fallbackGeminiApiKey || localFallback.fallbackGeminiApiKey || data?.backupGeminiApiKey || '',
        fallbackModel: data?.fallbackModel || localFallback.fallbackModel || 'gemini-2.5-flash',
        fallbackTimeoutMs: data?.fallbackTimeoutMs || localFallback.fallbackTimeoutMs || 20000
      };

      setConfig(merged);
    } catch (e) {
      showError('Không thể tải cấu hình từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      // 1. Immediately cache in browser localStorage
      localStorage.setItem('petcare_fallback_config', JSON.stringify({
        enableGeminiFallback: config.enableGeminiFallback ?? true,
        fallbackGeminiApiKey: config.fallbackGeminiApiKey || config.backupGeminiApiKey || '',
        fallbackModel: config.fallbackModel || 'gemini-2.5-flash',
        fallbackTimeoutMs: config.fallbackTimeoutMs || 20000
      }));

      // 2. Persist to server & Supabase
      await api.updateSystemConfig(config);
      showSuccess('✅ Đã lưu cấu hình AI & API Keys thành công!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showError('Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async () => {
    if (!config?.geminiApiKey) {
      showInfo('Vui lòng nhập Gemini API Key để kiểm tra.');
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await api.testApiKey({
        apiKey: config.geminiApiKey,
        model: config.aiModel || 'gemini-2.5-flash',
        provider: config.apiProvider || 'gemini',
        customBaseUrl: config.customApiBaseUrl
      });
      if (res.ok) {
        setTestResult({
          ok: true,
          message: res.message || 'API Key hợp lệ và hoạt động tốt!',
          latencyMs: res.latencyMs
        });
        showSuccess(`✅ API Key kiểm tra thành công (${res.latencyMs}ms)!`);
      } else {
        setTestResult({
          ok: false,
          message: res.error || 'API Key không hợp lệ.'
        });
        showError(res.error || 'Lỗi kiểm tra API Key.');
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Lỗi mạng khi kiểm tra API Key.'
      });
      showError(err.message || 'Không thể kết nối để kiểm tra.');
    } finally {
      setTestingKey(false);
    }
  };

  const handleTestBackupPool = async () => {
    const rawVal = config?.backupGeminiApiKey || config?.fallbackGeminiApiKey || '';
    const keys = parseApiKeys(rawVal);
    if (keys.length === 0) {
      showInfo('Vui lòng nhập ít nhất 1 API Key dự phòng để kiểm tra.');
      return;
    }

    setTestingPool(true);
    setPoolResults(null);
    try {
      const results = await api.testGeminiKeyPool(keys, config?.fallbackModel || config?.aiModel || 'gemini-2.5-flash');
      setPoolResults(results);
      const passedCount = results.filter(r => r.ok).length;
      if (passedCount === results.length) {
        showSuccess(`Tất cả ${results.length} API Key trong Pool đều sẵn sàng hoạt động!`);
      } else {
        showInfo(`Đã kiểm tra xong: ${passedCount}/${results.length} API Key hợp lệ.`);
      }
    } catch (err: any) {
      showError(err?.message || 'Lỗi khi kiểm tra danh sách API Key');
    } finally {
      setTestingPool(false);
    }
  };

  const handleResetPrompt = () => {
    if (!config) return;
    if (window.confirm('Khôi phục Lời nhắc Hệ thống (System Prompt) về mẫu Bác sĩ Thú y chuẩn?')) {
      setConfig({
        ...config,
        systemPrompt: `Bạn là Bác Sĩ Thú Y AI chuyên nghiệp của hệ thống PetCare AI. Nhiệm vụ của bạn là tư vấn sức khỏe thú cưng (chó, mèo) dựa trên triệu chứng mô tả từ chủ nuôi. Luôn ưu tiên an toàn của thú cưng, trả lời súc tích, đi thẳng vào hành động. Bắt buộc bắt đầu mỗi câu trả lời bằng khối TRIAGE_ALERT để phân loại mức độ nguy hiểm.`
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs text-slate-500">Đang tải cấu hình AI & API...</span>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Cấu Hình AI & Quản Lý API Keys</h1>
          </div>
          <p className="text-sm text-slate-500">
            Cấu hình mô hình AI, quản lý API Keys (Gemini, OpenAI, Custom), kết nối Python AI ResNet và tinh chỉnh tham số hoạt động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadConfig}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-950" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu!' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: API Keys & Providers Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Quản Lý Nhà Cung Cấp & API Keys</h2>
                <p className="text-xs text-slate-500">
                  Thêm hoặc thay đổi API Key trực tiếp trên giao diện mà không cần chỉnh sửa tệp .env hay khởi động lại máy chủ.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Lấy Gemini API Key <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Gemini API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Google Gemini API Key (Khóa Chính)
                </label>
                <span className="text-[11px] text-slate-400">Ưu tiên sử dụng</span>
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={config.geminiApiKey || ''}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy... (Nếu để trống sẽ dùng GEMINI_API_KEY trong .env)"
                  className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  title={showGeminiKey ? 'Ẩn key' : 'Hiện key'}
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  Dùng để gọi mô hình Gemini 2.5 Flash / Pro và tạo Vector Embeddings RAG.
                </p>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey || !config.geminiApiKey}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  {testingKey ? 'Đang test...' : 'Kiểm tra Key'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="flex-1 font-medium">{testResult.message}</span>
                  {testResult.latencyMs && (
                    <span className="font-mono font-bold">{testResult.latencyMs}ms</span>
                  )}
                </div>
              )}
            </div>

            {/* Backup Gemini API Key Pool */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                  Gemini API Key Dự Phòng (Backup Keys Pool)
                </label>
                {(() => {
                  const detected = parseApiKeys(config.backupGeminiApiKey || config.fallbackGeminiApiKey);
                  return detected.length > 0 ? (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Đã nhận diện {detected.length} Keys
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Tùy chọn</span>
                  );
                })()}
              </div>
              <div className="relative">
                {showBackupKey ? (
                  <textarea
                    rows={3}
                    value={config.backupGeminiApiKey || ''}
                    onChange={(e) => setConfig({ ...config, backupGeminiApiKey: e.target.value, fallbackGeminiApiKey: e.target.value })}
                    placeholder="Nhập 1 hoặc nhiều API Key phân cách bằng dấu phẩy hoặc xuống dòng:&#10;AIzaSyKey1...&#10;AIzaSyKey2..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-slate-50/50"
                  />
                ) : (
                  <input
                    type="password"
                    value={config.backupGeminiApiKey || ''}
                    onChange={(e) => setConfig({ ...config, backupGeminiApiKey: e.target.value, fallbackGeminiApiKey: e.target.value })}
                    placeholder="AIzaSy1..., AIzaSy2... (Nhập nhiều key phân cách bằng dấu phẩy)"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-slate-50/50"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowBackupKey(!showBackupKey)}
                  className="absolute right-2 top-2.5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  title={showBackupKey ? 'Ẩn key' : 'Hiện key'}
                >
                  {showBackupKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  Hỗ trợ nhập <b>nhiều key</b> (dấu phẩy hoặc xuống dòng). Tự động luân phiên khi key chạm quota 429.
                </p>
                <button
                  type="button"
                  onClick={handleTestBackupPool}
                  disabled={testingPool || !parseApiKeys(config.backupGeminiApiKey || config.fallbackGeminiApiKey).length}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  {testingPool ? 'Đang test...' : 'Kiểm tra Pool'}
                </button>
              </div>

              {/* Pool Test Results List */}
              {poolResults && poolResults.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {poolResults.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg border ${
                        item.ok
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-red-50/70 border-red-200 text-red-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        )}
                        <span className="font-mono font-bold">Key #{idx + 1} ({item.maskedKey})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.ok ? (
                          <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {item.latencyMs}ms - Sẵn sàng
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-red-700 max-w-[180px] truncate" title={item.error}>
                            {item.error || 'Lỗi'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Render Python AI Service URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-600" />
                  Render Python AI Service URL (ResNet)
                </label>
                <span className="text-[11px] text-emerald-600 font-bold">Image AI</span>
              </div>
              <input
                type="text"
                value={config.renderServiceUrl || ''}
                onChange={(e) => setConfig({ ...config, renderServiceUrl: e.target.value })}
                placeholder="https://pet-chatbot-ai.onrender.com"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-400">
                Địa chỉ dịch vụ FastAPI ResNet18 chẩn đoán hình ảnh giống và bệnh lý thú cưng trên Render.
              </p>
            </div>

            {/* Provider Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-700" />
                  Nhà Cung Cấp Mô Hình AI (AI Provider)
                </label>
                <span className="text-[11px] text-slate-400">Hiện tại: Google Gemini</span>
              </div>
              <select
                value={config.apiProvider || 'gemini'}
                onChange={(e) => setConfig({ ...config, apiProvider: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              >
                <option value="gemini">Google Gemini AI (Khuyên dùng — Đầy đủ Multimodal & Tốc độ cao)</option>
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="custom">Custom / Groq / Ollama (OpenAI Compatible API)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Chọn nhà cung cấp AI chính được hệ thống ưu tiên sử dụng trong phiên chat.
              </p>
            </div>
          </div>

          {/* Conditional: OpenAI / Custom API Key fields */}
          {(config.apiProvider === 'openai' || config.apiProvider === 'custom') && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                Cấu hình bổ sung cho {config.apiProvider === 'openai' ? 'OpenAI' : 'Custom Provider'}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">OpenAI / Provider API Key</label>
                  <input
                    type="password"
                    value={config.openaiApiKey || ''}
                    onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Custom Base URL (Tùy chọn)</label>
                  <input
                    type="text"
                    value={config.customApiBaseUrl || ''}
                    onChange={(e) => setConfig({ ...config, customApiBaseUrl: e.target.value })}
                    placeholder="https://api.groq.com/openai/v1 hoặc http://localhost:11434/v1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: AI Model & Hyperparameters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Cpu className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Mô Hình AI & Tham Số Siêu Cấp</h2>
              <p className="text-xs text-slate-500">
                Chọn phiên bản mô hình xử lý, điều chỉnh độ sáng tạo (Temperature) và độ dài câu trả lời.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Mô hình AI Đang Dùng</label>
              <select
                value={config.aiModel}
                onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Mặc định — Nhanh & Mới nhất)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Tốc độ phản hồi cao)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Tiết kiệm Token)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ổn định)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Phân tích chuyên sâu)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Gemini 2.5 Flash mang lại tốc độ stream câu trả lời nhanh nhất và độ chính xác phân loại Triage cao.
              </p>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Temperature (Độ sáng tạo)</label>
                <span className="font-mono text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  {config.temperature}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.0 (Chính xác y khoa)</span>
                <span>0.5 (Cân bằng)</span>
                <span>1.0 (Sáng tạo cao)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Max Output Tokens</label>
                <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {config.maxTokens}
                </span>
              </div>
              <select
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              >
                <option value={1024}>1024 Tokens (~750 từ)</option>
                <option value={2048}>2048 Tokens (~1500 từ - Khuyên dùng)</option>
                <option value={4096}>4096 Tokens (~3000 từ)</option>
                <option value={8192}>8192 Tokens (~6000 từ)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Giới hạn độ dài tối đa của phản hồi chẩn đoán y khoa thú cưng.
              </p>
            </div>
          </div>

          {/* Emergency Keywords */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              Từ Khóa Kích Hoạt Triage Khẩn Cấp (Emergency Keywords)
            </label>
            <input
              type="text"
              value={config.emergencyKeywords.join(', ')}
              onChange={(e) =>
                setConfig({
                  ...config,
                  emergencyKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 bg-slate-50/50"
              placeholder="máu, co giật, khó thở, bất tỉnh, không thở, liệt..."
            />
            <p className="text-[11px] text-slate-400">
              Nhập các từ khóa phân cách bằng dấu phẩy. Khi người dùng đề cập đến các từ này, hệ thống sẽ tự động nâng mức cảnh báo cấp cứu RED ngay lập tức.
            </p>
          </div>
        </div>

        {/* Section 3: System Prompt */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lời Nhắc Hệ Thống (System Prompt)</h2>
              <p className="text-xs text-slate-500">
                Định hình nhân cách, phong cách trả lời và quy tắc chuẩn y khoa thú y của PetCare AI.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetPrompt}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline"
            >
              Khôi phục mẫu chuẩn
            </button>
          </div>

          <textarea
            rows={8}
            value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            placeholder="Nhập System Prompt..."
            className="w-full p-4 rounded-xl border border-slate-200 text-xs text-slate-900 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 bg-slate-50/50"
          />
          <p className="text-[11px] text-slate-400">
            System Prompt sẽ được gắn vào đầu mỗi phiên tư vấn của AI cùng với ngữ cảnh thú cưng và tri thức RAG.
          </p>
        </div>

        {/* Section: Fallback & Dự Phòng */}
        <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-orange-100 pb-4">
            <div className="p-2 bg-orange-50 rounded-xl">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Fallback & Dự Phòng</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Khi Render backend lỗi hoặc timeout, tự động gọi thẳng Gemini API từ frontend
              </p>
            </div>
            {/* Enable toggle */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">
                {config.enableGeminiFallback ? 'Đã bật' : 'Đã tắt'}
              </span>
              <button
                type="button"
                onClick={() => setConfig({ ...config, enableGeminiFallback: !config.enableGeminiFallback })}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
                  config.enableGeminiFallback ? 'bg-orange-500' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${
                  config.enableGeminiFallback ? 'translate-x-5.5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {config.enableGeminiFallback && (
            <div className="space-y-4">
              {/* Fallback API Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Danh Sách Gemini API Key (Fallback Pool)
                  </label>
                  {(() => {
                    const detected = parseApiKeys(config.fallbackGeminiApiKey || config.backupGeminiApiKey);
                    return detected.length > 0 ? (
                      <span className="text-[11px] font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-md">
                        {detected.length} Keys dự phòng
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="relative">
                  <input
                    type={showBackupKey ? 'text' : 'password'}
                    value={config.fallbackGeminiApiKey ?? ''}
                    onChange={(e) => setConfig({ ...config, fallbackGeminiApiKey: e.target.value, backupGeminiApiKey: e.target.value })}
                    placeholder="AIzaSy1..., AIzaSy2... (Nhập 1 hoặc nhiều API Key phân cách bằng dấu phẩy)"
                    className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBackupKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showBackupKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hỗ trợ nhiều key (cách nhau dấu phẩy hoặc xuống dòng). Hệ thống sẽ tự động chuyển sang Key tiếp theo nếu Key trước bị lỗi hoặc chạm giới hạn quota 429.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fallback Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Model Fallback
                  </label>
                  <select
                    value={config.fallbackModel ?? 'gemini-2.5-flash'}
                    onChange={(e) => setConfig({ ...config, fallbackModel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (nhanh nhất)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-pro">gemini-pro (chất lượng cao)</option>
                  </select>
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Timeout Render (ms)
                  </label>
                  <input
                    type="number"
                    min={3000}
                    max={30000}
                    step={1000}
                    value={config.fallbackTimeoutMs ?? 12000}
                    onChange={(e) => setConfig({ ...config, fallbackTimeoutMs: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Chờ tối đa bao nhiêu ms trước khi coi là Render lỗi và chuyển sang fallback.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700">
                  <strong>Lưu ý bảo mật:</strong> Fallback gọi Gemini trực tiếp từ trình duyệt người dùng.
                  API key fallback sẽ xuất hiện trong network request. Chỉ dùng key có quota giới hạn riêng.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-950" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Đang lưu cấu hình...' : saveSuccess ? 'Đã lưu thành công!' : 'Lưu Tất Cả Cấu Hình'}
          </button>
        </div>
      </form>
    </div>
  );
};
