import React, { useState, useEffect } from 'react';
import {
  Cpu, Save, ShieldAlert, Check, RefreshCw, Sliders,
  Database, Server, Zap, Activity, CheckCircle2,
  XCircle, AlertTriangle, Clock, Eye, EyeOff, Wifi
} from 'lucide-react';
import { SystemConfig } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

type ConnectionStatus = 'idle' | 'checking' | 'done';

interface HealthResult {
  supabase: { status: string; latencyMs: number | null; message: string; url?: string };
  render: { status: string; latencyMs: number | null; message: string; url: string };
  gemini: { status: string; message: string; keyPreview: string | null };
  activeConfig: { status: string; aiModel: string; temperature: number; lastUpdated?: string; source: string };
  envVars: { SUPABASE_URL: boolean; SUPABASE_ANON_KEY: boolean; GEMINI_API_KEY: boolean; NODE_ENV: string; VERCEL: boolean };
  totalLatencyMs: number;
  checkedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ok') return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> OK
    </span>
  );
  if (status === 'warn') return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> WARN
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> L?I
    </span>
  );
}

function LatencyBadge({ ms }: { ms: number | null }) {
  if (ms === null) return <span className="text-[10px] text-slate-400">—</span>;
  const color = ms < 300 ? 'text-emerald-600' : ms < 1000 ? 'text-amber-600' : 'text-red-600';
  return <span className={`text-[11px] font-bold ${color} flex items-center gap-0.5`}><Clock className="w-3 h-3" />{ms}ms</span>;
}

export const AdminSystemConfigView: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [healthStatus, setHealthStatus] = useState<ConnectionStatus>('idle');
  const [healthResult, setHealthResult] = useState<HealthResult | null>(null);
  const [showKeyPreviews, setShowKeyPreviews] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data: any = await api.getSystemConfig();
      if (data && !data.error) {
        setConfig({
          aiModel: data.aiModel || 'gemini-2.5-flash',
          temperature: data.temperature || 0.7,
          systemPrompt: data.systemPrompt || 'Ban la tro ly thu y AI...',
          maxTokens: data.maxTokens || 2048,
          emergencyKeywords: data.emergencyKeywords || ['mau', 'co giat', 'kho tho']
        });
      } else {
        setConfig({
          aiModel: 'gemini-2.5-flash',
          temperature: 0.7,
          systemPrompt: 'Ban la tro ly thu y AI chuyen nghiep.',
          maxTokens: 2048,
          emergencyKeywords: ['mau', 'co giat', 'kho tho']
        });
      }
    } catch (e) {
      setConfig({ aiModel: 'gemini-2.5-flash', temperature: 0.7, systemPrompt: '', maxTokens: 2048, emergencyKeywords: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      await api.updateSystemConfig(config);
      showSuccess('Da luu cau hinh he thong AI!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { showError('Khong the luu cau hinh.'); }
    finally { setSaving(false); }
  };

  const handleCheckHealth = async () => {
    setHealthStatus('checking');
    setHealthResult(null);
    try {
      const result = await api.checkHealth();
      setHealthResult(result);
      setHealthStatus('done');
    } catch {
      showError('Khong the ket noi den server de kiem tra.');
      setHealthStatus('idle');
    }
  };

  if (loading || !config) return <div className="text-center py-20 text-xs text-slate-500">Dang tai cau hinh he thong AI...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-7 h-7 text-amber-400 flex-shrink-0" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Cau Hinh Mo Hinh AI Gemini & Protocol Canh Bao</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tuy chinh tham so sinh tu, System Prompt va danh sach tu khoa phan loai cap cuu.</p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Da luu va cap nhat cau hinh AI thanh cong!
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kiem Tra Ket Noi He Thong</h3>
              <p className="text-[11px] text-slate-500">Ping thuc te toi Supabase, Render AI, Gemini API va cau hinh dang hoat dong.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {healthResult && (
              <button onClick={() => setShowKeyPreviews(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                {showKeyPreviews ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showKeyPreviews ? 'An API Key' : 'Xem API Key'}
              </button>
            )}
            <button onClick={handleCheckHealth} disabled={healthStatus === 'checking'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-xs">
              {healthStatus === 'checking'
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dang kiem tra...</>
                : <><Activity className="w-3.5 h-3.5" /> Kiem Tra Ngay</>}
            </button>
          </div>
        </div>

        {healthStatus === 'idle' && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <Wifi className="w-10 h-10 text-slate-200" />
            <p className="text-xs font-medium">Nhan "Kiem Tra Ngay" de ping tat ca ket noi</p>
          </div>
        )}

        {healthStatus === 'checking' && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="flex gap-3">
              {[{ name: 'Supabase', Icon: Database }, { name: 'Render AI', Icon: Server }, { name: 'Gemini', Icon: Zap }].map(({ name, Icon }, i) => (
                <div key={name} className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 animate-pulse">Dang ping cac ket noi...</p>
          </div>
        )}

        {healthStatus === 'done' && healthResult && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Tong thoi gian:</span>
              <span className="font-black text-blue-700">{healthResult.totalLatencyMs}ms</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Kiem tra luc: {new Date(healthResult.checkedAt).toLocaleTimeString('vi-VN')}</span>
              <span className="text-slate-300">•</span>
              <span className={`font-bold ${healthResult.envVars.VERCEL ? 'text-blue-700' : 'text-emerald-700'}`}>
                {healthResult.envVars.VERCEL ? '?? Vercel' : '?? Local Dev'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">ENV: <strong>{healthResult.envVars.NODE_ENV}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Supabase', sub: 'PostgreSQL DB',
                  icon: <Database className="w-4 h-4 text-emerald-600" />,
                  data: healthResult.supabase,
                  extra: healthResult.supabase.url ? <span className="text-[10px] text-slate-400 font-mono truncate">{healthResult.supabase.url}</span> : null
                },
                {
                  label: 'Render AI', sub: 'Python / ResNet',
                  icon: <Server className="w-4 h-4 text-purple-600" />,
                  data: healthResult.render,
                  extra: <span className="text-[10px] text-slate-400 font-mono">onrender.com</span>
                },
                {
                  label: 'Gemini API', sub: 'Google GenAI',
                  icon: <Zap className="w-4 h-4 text-blue-600" />,
                  data: { ...healthResult.gemini, latencyMs: null as null },
                  extra: (healthResult.gemini.keyPreview && showKeyPreviews)
                    ? <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg">{healthResult.gemini.keyPreview}</span>
                    : null
                },
              ].map(({ label, sub, icon, data, extra }) => (
                <div key={label} className={`p-4 rounded-2xl border-2 space-y-3 ${
                  data.status === 'ok' ? 'border-emerald-200 bg-emerald-50/40' :
                  data.status === 'warn' ? 'border-amber-200 bg-amber-50/40' :
                  'border-red-200 bg-red-50/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">{icon}</div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{label}</p>
                        <p className="text-[10px] text-slate-500">{sub}</p>
                      </div>
                    </div>
                    <StatusBadge status={data.status} />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{data.message}</p>
                  <div className="flex items-center justify-between gap-2">
                    <LatencyBadge ms={data.latencyMs} />
                    {extra}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Cau Hinh AI Dang Hoat Dong</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  healthResult.activeConfig.source.includes('Supabase')
                    ? 'bg-emerald-900 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-900 text-amber-300 border border-amber-800'
                }`}>
                  {healthResult.activeConfig.source.includes('Supabase') ? '? Tu DB' : '?? Default'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Mo Hinh', value: healthResult.activeConfig.aiModel },
                  { label: 'Temperature', value: String(healthResult.activeConfig.temperature) },
                  { label: 'Nguon Config', value: healthResult.activeConfig.source },
                  { label: 'Cap nhat cuoi', value: healthResult.activeConfig.lastUpdated ? new Date(healthResult.activeConfig.lastUpdated).toLocaleDateString('vi-VN') : 'Chua co' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-2.5 bg-slate-800 rounded-xl">
                    <p className="text-slate-400 text-[10px]">{label}</p>
                    <p className="font-bold text-white mt-0.5 text-[11px] truncate" title={value}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Bien Moi Truong (Environment Variables)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: 'SUPABASE_URL', present: healthResult.envVars.SUPABASE_URL, desc: 'Dia chi Supabase project' },
                  { key: 'SUPABASE_ANON_KEY', present: healthResult.envVars.SUPABASE_ANON_KEY, desc: 'Public anon key' },
                  { key: 'GEMINI_API_KEY', present: healthResult.envVars.GEMINI_API_KEY, desc: 'Google AI Studio key' },
                ].map(item => (
                  <div key={item.key} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    item.present ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div>
                      <p className="font-mono font-bold text-slate-800 text-[11px]">{item.key}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {item.present
                      ? <span className="flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-4 h-4" /> Co</span>
                      : <span className="flex items-center gap-1 text-red-700 font-bold"><XCircle className="w-4 h-4" /> Thieu!</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-emerald-600" /> Cau Hinh Mo Hinh Google Gemini
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mo Hinh AI (Model Alias)</label>
              <select value={config.aiModel} onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold">
                <option value="gemini-2.5-flash">gemini-2.5-flash (Nhanh & Toi uu)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Chan doan sau)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Do Sang Tao (Temperature: {config.temperature})</label>
              <input type="range" min="0" max="1" step="0.05" value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                className="w-full accent-emerald-600 mt-2" />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            ?? System Prompt Huan Luyen AI Bac Si Thu Y
          </h3>
          <p className="text-slate-500">Chi thi cot loi dieu khien hanh vi cua AI, ep dinh dang khung canh bao [[TRIAGE_ALERT]].</p>
          <textarea rows={8} value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 leading-relaxed text-slate-800" />
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Tu Khoa Kich Hoat Canh Bao Khan Cap (Canh Bao Do)
          </h3>
          <p className="text-slate-500">Khi phat hien cac tu khoa nay, he thong se uu tien Khung Canh Bao Do ngay lap tuc.</p>
          <input type="text" value={config.emergencyKeywords.join(', ')}
            onChange={(e) => setConfig({ ...config, emergencyKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500" />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Luu Cau Hinh AI
          </button>
        </div>
      </form>
    </div>
  );
};
