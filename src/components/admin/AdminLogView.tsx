import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Trash2, Filter, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle, AlertTriangle, Info,
  MessageSquare, Database, Server, Zap, Shield, Activity,
  Search, X, ChevronLeft, ChevronsLeft, ChevronsRight, Copy, Check
} from 'lucide-react';
import { ApiLog, ApiLogLevel, ApiLogType } from '../../types';
import { api } from '../../services/api';
import { AdminChatSessionsModal } from './AdminChatSessionsModal';

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
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch { return ts; }
}

export const AdminLogView: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<ApiLogType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ApiLogLevel | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI helpers
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const fetchLogs = useCallback(async (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.getLogs({
        log_type: typeFilter !== 'all' ? typeFilter : undefined,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        limit: targetPageSize,
        page: targetPage,
        search: searchQuery || undefined,
      });

      setLogs(res.logs);
      setTotalLogs(res.total);
      setTotalPages(Math.max(1, res.totalPages));
      setPage(res.page);
      setLastRefresh(new Date());
    } catch (e: any) {
      setFetchError(e.message || 'Không thể tải log');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, levelFilter, searchQuery, page, pageSize]);

  // Refetch whenever filters, search query, page or pageSize change
  useEffect(() => {
    fetchLogs(page, pageSize);
  }, [page, pageSize, typeFilter, levelFilter, searchQuery]);

  // Auto-refresh interval (30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      fetchLogs(page, pageSize);
    }, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchLogs, page, pageSize]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  // Filter change handlers reset page to 1
  const handleTypeFilterChange = (val: ApiLogType | 'all') => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleLevelFilterChange = (val: ApiLogLevel | 'all') => {
    setLevelFilter(val);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPageInput('');
    }
  };

  const handleCopyMetadata = (id: string, metadata: any) => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await api.clearLogs(typeFilter !== 'all' ? typeFilter : undefined);
      setPage(1);
      await fetchLogs(1, pageSize);
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  };

  // Calculate sliding page window for pagination buttons
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount  = logs.filter(l => l.level === 'warn').length;
  const infoCount  = logs.filter(l => l.level === 'info').length;

  const startRecordIndex = totalLogs === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecordIndex = Math.min(page * pageSize, totalLogs);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Log Hệ Thống &amp; Nhật Ký API
            </h1>
            <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {totalLogs.toLocaleString()} bản ghi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi chi tiết yêu cầu Chat · Render Server · Gemini AI · Supabase · Fallback Pool
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-red-50 rounded-lg text-xs font-bold text-red-700 border border-red-200" title="Số lỗi trang hiện tại">
            <AlertCircle className="w-3 h-3" /> {errorCount}
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg text-xs font-bold text-amber-700 border border-amber-200" title="Cảnh báo trang hiện tại">
            <AlertTriangle className="w-3 h-3" /> {warnCount}
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 border border-emerald-200" title="Thông tin trang hiện tại">
            <CheckCircle className="w-3 h-3" /> {infoCount}
          </span>

          <button
            onClick={() => setAutoRefresh(v => !v)}
            title="Tự động tải mới sau mỗi 30 giây"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              autoRefresh ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Auto 30s {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => fetchLogs(page, pageSize)}
            disabled={loading}
            title="Làm mới trang log hiện tại"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => setIsChatModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Xem hội thoại &amp; Lỗi</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm nội dung log..."
            className="w-full text-xs pl-8.5 pr-8 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Log types & level filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          
          <div className="flex items-center gap-1">
            {LOG_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => handleTypeFilterChange(t.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  typeFilter === t.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-slate-200 flex-shrink-0 mx-1" />

          <div className="flex items-center gap-1">
            {(['all', 'info', 'warn', 'error'] as const).map(l => (
              <button
                key={l}
                onClick={() => handleLevelFilterChange(l)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  levelFilter === l
                    ? l === 'error' ? 'bg-red-600 text-white border-red-600'
                    : l === 'warn'  ? 'bg-amber-500 text-white border-amber-500'
                    : l === 'info'  ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {l === 'all' ? 'TẤT CẢ' : l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
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
                className="text-xs text-red-700 font-semibold hover:text-red-900 mt-1 underline cursor-pointer"
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

      {/* ── Log Table List ── */}
      <div className="flex-1 overflow-y-auto px-6 py-3">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
            <p className="text-sm font-semibold">Đang truy vấn nhật ký hệ thống...</p>
          </div>
        ) : logs.length === 0 && !fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <Activity className="w-12 h-12 mb-3 opacity-20 text-indigo-500" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy bản ghi log nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="space-y-1.5">
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
                    'border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-black/[0.015] rounded-xl select-none"
                    onClick={() => hasMetadata && setExpandedId(isExpanded ? null : log.id)}
                  >
                    <span className={`flex-shrink-0 ${level.color}`}>{level.icon}</span>

                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase ${type.bg} ${type.color}`}>
                      {log.log_type}
                    </span>

                    <span className={`flex-1 text-xs leading-relaxed truncate ${
                      log.level === 'error' ? 'text-red-800 font-semibold' : 'text-slate-800'
                    }`}>
                      {log.message}
                    </span>

                    {log.latency_ms != null && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono hidden sm:block bg-slate-100 px-1.5 py-0.5 rounded">
                        {log.latency_ms}ms
                      </span>
                    )}

                    {log.status_code != null && (
                      <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded hidden sm:block ${
                        log.status_code >= 400 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        HTTP {log.status_code}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </span>

                    {hasMetadata && (
                      <span className="text-slate-400 hover:text-slate-700 flex-shrink-0 p-0.5">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </span>
                    )}
                  </div>

                  {isExpanded && hasMetadata && (
                    <div className="px-4 pb-3.5 pt-1 border-t border-slate-100/80 bg-slate-50/50 rounded-b-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Dữ liệu chi tiết (Metadata Payload):</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyMetadata(log.id, log.metadata);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer transition-colors"
                        >
                          {copiedId === log.id ? (
                            <><Check className="w-3 h-3 text-emerald-600" /> Đã sao chép</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Sao chép JSON</>
                          )}
                        </button>
                      </div>

                      <pre className="text-[11px] bg-slate-900 text-emerald-300 p-3.5 rounded-xl overflow-x-auto leading-relaxed font-mono shadow-xs">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500">
                        {log.user_id && (
                          <span>
                            User ID: <code className="text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px]">{log.user_id}</code>
                          </span>
                        )}
                        {log.session_id && (
                          <span>
                            Session ID: <code className="text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px]">{log.session_id}</code>
                          </span>
                        )}
                        <span>
                          Log ID: <code className="text-slate-500 font-mono text-[10px]">{log.id}</code>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination Bar (Thanh phân trang cố định) ── */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 shadow-xs">
        {/* Left: Summary and Page Size selector */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>
            Hiển thị <strong>{startRecordIndex}</strong> - <strong>{endRecordIndex}</strong> trong tổng số <strong>{totalLogs.toLocaleString()}</strong> logs
          </span>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-slate-400 text-[11px]">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Navigation buttons & Jump to page */}
        <div className="flex items-center gap-2">
          {/* First page */}
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1 || loading}
            title="Về trang đầu"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev page */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            title="Trang trước"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page number buttons */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs select-none">
                    ...
                  </span>
                );
              }

              const isActive = p === page;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={loading}
                  className={`min-w-[30px] h-[30px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            title="Trang sau"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading}
            title="Đến trang cuối"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* Jump to page quick input */}
          {totalPages > 3 && (
            <form onSubmit={handleJumpToPage} className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`${page}/${totalPages}`}
                className="w-14 text-xs px-1.5 py-1 rounded-lg border border-slate-200 text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đi
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Clear Confirm Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h3 className="font-black text-slate-900">Xóa Nhật Ký Hệ Thống</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              {typeFilter !== 'all'
                ? `Bạn có chắc muốn xóa toàn bộ log loại "${typeFilter}"?`
                : 'Bạn có chắc muốn xóa toàn bộ tất cả nhật ký log trong cơ sở dữ liệu?'}
              {' '}Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer text-xs"
              >
                {clearing ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Live Chat Sessions & Message Error Inspector Modal */}
      <AdminChatSessionsModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
    </div>
  );
};
