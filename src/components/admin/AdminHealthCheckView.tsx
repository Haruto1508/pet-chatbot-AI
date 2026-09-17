import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, RefreshCw, Zap, Server, Database, Cpu, CheckCircle2,
  XCircle, AlertTriangle, Clock, ShieldCheck, Wifi, Eye, EyeOff,
  Radio, Play, Pause, Trash2, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

interface PingLogItem {
  id: string;
  time: string;
  service: string;
  status: 'ok' | 'warn' | 'error';
  latencyMs: number;
  message: string;
  target: string;
}

export const AdminHealthCheckView: React.FC = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [pingTarget, setPingTarget] = useState<string | null>(null);
  
  // Auto Keep-Alive State
  const [autoKeepAlive, setAutoKeepAlive] = useState(true);
  const [keepAliveIntervalMinutes, setKeepAliveIntervalMinutes] = useState(10);
  const [nextPingSeconds, setNextPingSeconds] = useState(600);
  
  // Ping logs
  const [pingLogs, setPingLogs] = useState<PingLogItem[]>([]);
  const [showEnvKeyPreview, setShowEnvKeyPreview] = useState(false);

  const autoPingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial health check
  const fetchHealthCheck = async (quiet = false) => {
    if (!quiet) setLoadingHealth(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch (e: any) {
      if (!quiet) showError('Không thể kết nối đến API kiểm tra hệ thống.');
    } finally {
      if (!quiet) setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();
  }, []);

  // Handle Keep-Alive Ping
  const triggerKeepAlive = async (service: string = 'all') => {
    setPinging(true);
    setPingTarget(service);
    try {
      const res = await api.pingKeepAlive(service);
      const timestamp = new Date().toLocaleTimeString('vi-VN');

      // Append to logs
      const newLogs: PingLogItem[] = [];
      if (res.services) {
        Object.entries(res.services).forEach(([key, s]: [string, any]) => {
          newLogs.push({
            id: `${Date.now()}-${key}`,
            time: timestamp,
            service: s.name || key,
            status: s.status,
            latencyMs: s.latencyMs,
            message: s.message,
            target: s.target || key
          });
        });
      }

      setPingLogs(prev => [...newLogs, ...prev].slice(0, 50));
      
      // Update health summary
      await fetchHealthCheck(true);

      if (service === 'all') {
        showSuccess(`⚡ Đã gửi tín hiệu Keep-Alive tới tất cả dịch vụ! (Tổng độ trễ: ${res.totalLatencyMs}ms)`);
      } else {
        showSuccess(`✅ Đã ping dịch vụ ${service}!`);
      }

      // Reset countdown
      setNextPingSeconds(keepAliveIntervalMinutes * 60);
    } catch (err: any) {
      showError(`Lỗi khi ping Keep-Alive: ${err.message}`);
    } finally {
      setPinging(false);
      setPingTarget(null);
    }
  };

  // Auto Keep-Alive Interval Loop
  useEffect(() => {
    if (!autoKeepAlive) {
      if (autoPingTimerRef.current) clearInterval(autoPingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setNextPingSeconds(keepAliveIntervalMinutes * 60);

    countdownTimerRef.current = setInterval(() => {
      setNextPingSeconds(prev => {
        if (prev <= 1) {
          triggerKeepAlive('all');
          return keepAliveIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [autoKeepAlive, keepAliveIntervalMinutes]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Kiểm Tra Hệ Thống & Giữ Sống Dịch Vụ</h1>
          </div>
          <p className="text-sm text-slate-500">
            Giám sát trạng thái kết nối thời gian thực, đánh thức dịch vụ Render & Supabase, chống tình trạng Cold Start trên Free Tier.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchHealthCheck()}
            disabled={loadingHealth || pinging}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            Làm mới kiểm tra
          </button>

          <button
            onClick={() => triggerKeepAlive('all')}
            disabled={pinging}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${pinging && pingTarget === 'all' ? 'animate-bounce text-amber-300' : ''}`} />
            {pinging && pingTarget === 'all' ? 'Đang gửi tín hiệu...' : '⚡ Đánh Thức & Ping Tất Cả'}
          </button>
        </div>
      </div>

      {/* Keep-Alive & Wake-up Controller Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {autoKeepAlive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${autoKeepAlive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Chế độ Giữ Sống (Keep-Alive Service Engine)
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Tự động đánh thức và duy trì hoạt động máy chủ AI & Database
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Các dịch vụ miễn phí như <b>Render (Python AI ResNet)</b> và <b>Supabase</b> sẽ tự động chuyển sang chế độ ngủ (sleep) sau 15 phút không có lượt truy cập. Khi có người dùng chat, lần đầu tiên sẽ mất 30-50s để khởi động lại. Chức năng Keep-Alive sẽ tự động gửi tín hiệu định kỳ để server luôn thức và phản hồi tức thì.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${autoKeepAlive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-xs font-bold text-white">Tự động Ping giữ sống:</span>
              </div>
              <button
                onClick={() => setAutoKeepAlive(!autoKeepAlive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoKeepAlive ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoKeepAlive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {autoKeepAlive ? (
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Chu kỳ ping:</span>
                  <select
                    value={keepAliveIntervalMinutes}
                    onChange={(e) => setKeepAliveIntervalMinutes(Number(e.target.value))}
                    className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-emerald-500"
                  >
                    <option value={5}>Mỗi 5 phút</option>
                    <option value={10}>Mỗi 10 phút (Khuyên dùng)</option>
                    <option value={15}>Mỗi 15 phút</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Lần ping tiếp theo:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {formatSeconds(nextPingSeconds)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-amber-400 pt-1 border-t border-slate-800">
                ⚠️ Đang tắt giữ sống tự động. Dịch vụ Render có thể bị ngủ nếu không có lượt truy cập.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connection Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Supabase PostgreSQL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Database className="w-5 h-5" />
              </div>
              {health?.supabase?.status === 'ok' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Gián đoạn
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Supabase DB (PostgreSQL)</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5" title={health?.supabase?.url}>
                {health?.supabase?.url || 'supabase.co'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Độ trễ truy vấn:</span>
                <span className="font-bold text-slate-900">
                  {health?.supabase?.latencyMs !== null ? `${health?.supabase?.latencyMs}ms` : '—'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {health?.supabase?.message || 'Đang kiểm tra...'}
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerKeepAlive('supabase')}
            disabled={pinging}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Ping Supabase
          </button>
        </div>

        {/* 2. Render Python AI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Cpu className="w-5 h-5" />
              </div>
              {health?.render?.status === 'ok' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Đã Thức
                </span>
              ) : health?.render?.status === 'warn' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Đang ngủ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Lỗi
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Python AI Service (ResNet)</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5" title={health?.render?.url}>
                {health?.render?.url || 'pet-chatbot-ai.onrender.com'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Độ trễ phản hồi:</span>
                <span className="font-bold text-slate-900">
                  {health?.render?.latencyMs !== null ? `${health?.render?.latencyMs}ms` : 'Cold Start'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate" title={health?.render?.message}>
                {health?.render?.message || 'Đang kiểm tra...'}
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerKeepAlive('render')}
            disabled={pinging}
            className="mt-4 w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" /> Đánh thức Render AI
          </button>
        </div>

        {/* 3. Google Gemini AI Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Radio className="w-5 h-5" />
              </div>
              {health?.gemini?.status === 'ok' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Thiếu Key
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Gemini LLM Engine</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Model: <span className="font-semibold text-blue-600">{health?.activeConfig?.aiModel || 'gemini-3.6-flash'}</span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Nguồn API Key:</span>
                <span className="font-bold text-slate-900">
                  {health?.gemini?.source === 'database' ? 'Admin DB' : 'Môi trường (.env)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate font-mono">
                Key: {health?.gemini?.keyPreview || 'Chưa cấu hình'}
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerKeepAlive('gemini')}
            disabled={pinging}
            className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" /> Ping Gemini API
          </button>
        </div>

        {/* 4. Backend Node/Vercel Server */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Server className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Hoạt động
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Backend API Gateway</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Môi trường: <span className="font-semibold text-slate-700">{health?.envVars?.NODE_ENV || 'production'}</span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Nền tảng:</span>
                <span className="font-bold text-slate-900">
                  {health?.envVars?.VERCEL ? 'Vercel Serverless' : 'Node.js Express (Port 3000)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tổng độ trễ:</span>
                <span className="font-bold text-emerald-600">
                  {health?.totalLatencyMs ? `${health.totalLatencyMs}ms` : '1ms'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs text-center font-medium">
            Lần kiểm tra: {health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString('vi-VN') : 'Mới đây'}
          </div>
        </div>
      </div>

      {/* Environment Variables Safe Inspector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Kiểm Tra Biến Môi Trường (Environment Variables)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác nhận các biến cần thiết đã được cấu hình an toàn trên máy chủ backend.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'SUPABASE_URL', status: health?.envVars?.SUPABASE_URL, desc: 'Địa chỉ dự án Supabase' },
            { key: 'SUPABASE_ANON_KEY', status: health?.envVars?.SUPABASE_ANON_KEY, desc: 'Public Client API Key' },
            { key: 'GEMINI_API_KEY', status: health?.envVars?.GEMINI_API_KEY, desc: 'Google AI Studio Key' },
            { key: 'NODE_ENV', status: true, desc: health?.envVars?.NODE_ENV || 'development' }
          ].map((item) => (
            <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800">{item.key}</span>
                {item.status ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ĐÃ CẤU HÌNH
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                    THIẾU
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Keep-Alive & Ping Logs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Nhật Ký Ping & Đánh Thức Dịch Vụ (Live Keep-Alive Logs)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lịch sử các lần gửi tín hiệu keep-alive và đo lường độ trễ của các dịch vụ.
            </p>
          </div>

          {pingLogs.length > 0 && (
            <button
              onClick={() => setPingLogs([])}
              className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa nhật ký
            </button>
          )}
        </div>

        {pingLogs.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Chưa có lượt ping nào được ghi nhận trong phiên này.</p>
            <button
              onClick={() => triggerKeepAlive('all')}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
            >
              <Play className="w-3 h-3" /> Gửi lượt ping đầu tiên ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Thời gian</th>
                  <th className="py-2.5 px-3 font-bold">Dịch vụ</th>
                  <th className="py-2.5 px-3 font-bold">Target</th>
                  <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                  <th className="py-2.5 px-3 font-bold">Độ trễ</th>
                  <th className="py-2.5 px-3 font-bold">Thông điệp phản hồi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{log.time}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{log.service}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[150px]">
                      {log.target}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.status === 'ok' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          OK
                        </span>
                      ) : log.status === 'warn' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          WARN
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          ERROR
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={log.latencyMs < 300 ? 'text-emerald-600' : log.latencyMs < 1000 ? 'text-amber-600' : 'text-red-600'}>
                        {log.latencyMs}ms
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
