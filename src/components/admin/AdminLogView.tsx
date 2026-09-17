import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Trash2, Filter, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle, AlertTriangle, Info,
  MessageSquare, Database, Server, Zap, Shield, Activity
} from 'lucide-react';
import { ApiLog, ApiLogLevel, ApiLogType } from '../../types';
import { api } from '../../services/api';

const LOG_TYPES: { value: ApiLogType | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all',      label: 'Tất cả',    icon: <Activity className="w-3.5 h-3.5" /> },
  { value: 'chat',     label: 'Chat',       icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { value: 'render',   label: 'Render',     icon: <Server className="w-3.5 h-3.5" /> },
  { value: 'gemini',   label: 'Gemini',     icon: <Zap className="w-3.5 h-3.5" /> },
  { value: 'fallback', label: 'Fallback',   icon: <Shield className="w-3.5 h-3.5" /> },
  { value: 'supabase', label: 'Supabase',   icon: <Database className="w-3.5 h-3.5" /> },
  { value: 'error',    label: 'Lỗi',        icon: <AlertCircle className="w-3.5 h-3.5" /> },
  { value: 'system',   label: 'System',     icon: <Info className="w-3.5 h-3.5" /> },
];

const LEVEL_CONFIG: Record<ApiLogLevel, { label: string; color: string; icon: React.ReactNode }> = {
  info:  { label: 'INFO',  color: 'text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  warn:  { label: 'WARN',  color: 'text-amber-700',   icon: <AlertTriangle className="w-3 h-3" /> },
  error: { label: 'ERROR', color: 'text-red-700',     icon: <AlertCircle className="w-3 h-3" /> },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  chat:     { color: 'text-blue-700',    bg: 'bg-blue-50' },
  render:   { color: 'text-purple-700',  bg: 'bg-purple-50' },
  gemini:   { color: 'text-indigo-700',  bg: 'bg-indigo-50' },
  fallback: { color: 'text-orange-700',  bg: 'bg-orange-50' },
  supabase: { color: 'text-teal-700',    bg: 'bg-teal-50' },
  error:    { color: 'text-red-700',     bg: 'bg-red-50' },
  system:   { color: 'text-slate-600',   bg: 'bg-slate-100' },
};

const SQL_MIGRATION = `CREATE TABLE api_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  log_type text NOT NULL,
  level text DEFAULT 'info',
  user_id text,
  session_id text,
  message text NOT NULL,
  metadata jsonb,
  latency_ms integer,
  status_code integer
);

ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON api_logs
  FOR ALL USING (true) WITH CHECK (true);`;

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      day: '2-digit', month: '2-digit'
    });
  } catch { return ts; }
}

export const AdminLogView: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ApiLogType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ApiLogLevel | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api.getLogs({
        log_type: typeFilter !== 'all' ? typeFilter : undefined,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        limit: 300,
      });
      setLogs(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setFetchError(e.message || 'Không thể tải log');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, levelFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchLogs, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchLogs]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await api.clearLogs(typeFilter !== 'all' ? typeFilter : undefined);
      await fetchLogs();
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  };

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount  = logs.filter(l => l.level === 'warn').length;
  const infoCount  = logs.filter(l => l.level === 'info').length;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Log Hệ Thống
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi Chat · Render · Gemini · Supabase · Fallback
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg text-xs font-bold text-red-700 border border-red-100">
            <AlertCircle className="w-3 h-3" /> {errorCount}
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg text-xs font-bold text-amber-700 border border-amber-100">
            <AlertTriangle className="w-3 h-3" /> {warnCount}
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-3 h-3" /> {infoCount}
          </span>

          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Auto 30s
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3 flex-shrink-0 overflow-x-auto scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          {LOG_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border ${
                typeFilter === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-slate-200 flex-shrink-0 mx-1" />

        {(['all', 'info', 'warn', 'error'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
              levelFilter === l
                ? l === 'error' ? 'bg-red-600 text-white border-red-600'
                : l === 'warn'  ? 'bg-amber-500 text-white border-amber-500'
                : l === 'info'  ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-700 text-white border-slate-700'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {l === 'all' ? 'Tất cả' : l.toUpperCase()}
          </button>
        ))}

        {lastRefresh && (
          <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
            Cập nhật: {lastRefresh.toLocaleTimeString('vi-VN')}
          </span>
        )}
      </div>

      {/* ── Error / Migration hint ── */}
      {fetchError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-800">Lỗi tải log</p>
              <p className="text-xs text-red-600 mt-0.5">{fetchError}</p>
              <p className="text-xs text-red-500 mt-2 font-medium">
                💡 Cần tạo bảng <code className="bg-red-100 px-1 rounded">api_logs</code> trong Supabase Dashboard.
              </p>
              <button
                onClick={() => setShowMigration(v => !v)}
                className="text-xs text-red-700 font-semibold hover:text-red-900 mt-1 underline"
              >
                {showMigration ? 'Ẩn SQL' : 'Xem SQL Migration ▸'}
              </button>
              {showMigration && (
                <pre className="mt-2 p-3 bg-slate-900 text-emerald-300 rounded-lg text-[10px] overflow-x-auto font-mono leading-relaxed whitespace-pre">
                  {SQL_MIGRATION}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Log Table ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
            <p className="text-sm">Đang tải log...</p>
          </div>
        ) : logs.length === 0 && !fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Activity className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Không có log nào</p>
            <p className="text-xs mt-1">Bảng api_logs trống hoặc chưa có hoạt động</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map(log => {
              const level = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info;
              const type  = TYPE_CONFIG[log.log_type] ?? TYPE_CONFIG.system;
              const isExpanded = expandedId === log.id;
              const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

              return (
                <div
                  key={log.id}
                  className={`rounded-xl border transition-all ${
                    log.level === 'error' ? 'border-red-200 bg-red-50/40' :
                    log.level === 'warn'  ? 'border-amber-200 bg-amber-50/20' :
                    'border-slate-100 bg-white'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-black/[0.02] rounded-xl"
                    onClick={() => hasMetadata && setExpandedId(isExpanded ? null : log.id)}
                  >
                    <span className={`flex-shrink-0 ${level.color}`}>{level.icon}</span>

                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${type.bg} ${type.color}`}>
                      {log.log_type.toUpperCase()}
                    </span>

                    <span className={`flex-1 text-xs leading-relaxed truncate ${
                      log.level === 'error' ? 'text-red-800 font-semibold' : 'text-slate-700'
                    }`}>
                      {log.message}
                    </span>

                    {log.latency_ms != null && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono hidden sm:block">
                        {log.latency_ms}ms
                      </span>
                    )}

                    {log.status_code != null && (
                      <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded hidden sm:block ${
                        log.status_code >= 400 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {log.status_code}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </span>

                    {hasMetadata && (
                      <span className="text-slate-300 flex-shrink-0">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>

                  {isExpanded && hasMetadata && (
                    <div className="px-3 pb-3">
                      <pre className="text-[10px] bg-slate-900 text-emerald-300 p-3 rounded-lg overflow-x-auto leading-relaxed font-mono">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                      {log.user_id && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          User: <code className="text-slate-600 bg-slate-100 px-1 rounded">{log.user_id}</code>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Clear Confirm Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h3 className="font-black text-slate-900">Xóa Log</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              {typeFilter !== 'all'
                ? `Xóa toàn bộ log loại "${typeFilter}"?`
                : 'Xóa toàn bộ tất cả log hệ thống?'}
              {' '}Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {clearing ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
