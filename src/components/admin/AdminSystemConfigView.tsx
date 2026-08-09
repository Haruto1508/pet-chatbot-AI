import React, { useState, useEffect } from 'react';
import { Cpu, Save, ShieldAlert, Check, RefreshCw, Sliders } from 'lucide-react';
import { SystemConfig } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const AdminSystemConfigView: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data: any = await api.getSystemConfig();
      if (data && !data.error) {
        // Ensure defaults if fields are missing
        setConfig({
          aiModel: data.aiModel || 'gemini-1.5-flash',
          temperature: data.temperature || 0.7,
          systemPrompt: data.systemPrompt || 'Bạn là trợ lý thú y AI...',
          maxTokens: data.maxTokens || 2048,
          emergencyKeywords: data.emergencyKeywords || ['máu', 'co giật', 'khó thở']
        });
      } else {
        // Fallback default config if DB is empty or returned error
        setConfig({
          aiModel: 'gemini-1.5-flash',
          temperature: 0.7,
          systemPrompt: 'Bạn là trợ lý thú y AI chuyên nghiệp. Hãy tư vấn ngắn gọn, chính xác.',
          maxTokens: 2048,
          emergencyKeywords: ['máu', 'co giật', 'khó thở']
        });
      }
    } catch (e) {
      console.error('Error loading system config:', e);
      setConfig({
        aiModel: 'gemini-1.5-flash',
        temperature: 0.7,
        systemPrompt: 'Bạn là trợ lý thú y AI...',
        maxTokens: 2048,
        emergencyKeywords: ['máu', 'co giật', 'khó thở']
      });
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
      await api.updateSystemConfig(config);
      showSuccess('Đã lưu cấu hình hệ thống AI!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      showError('Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="text-center py-20 text-xs text-slate-500">Đang tải cấu hình hệ thống AI...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-7 h-7 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold">Cấu Hình Mô Hình AI Gemini & Protocol Cảnh Báo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tùy chỉnh tham số sinh từ, System Prompt và danh sách từ khóa kịch bản phân loại cấp cứu.
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Đã lưu và cập nhật cấu hình AI thành công!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Model Selection & Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-emerald-600" /> Cấu Hình Mô Hình Google Gemini
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mô Hình AI (Model Alias)</label>
              <select
                value={config.aiModel}
                onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Nhanh & Tối ưu)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Chẩn đoán sâu)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Độ Sáng Tạo (Temperature: {config.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                className="w-full accent-emerald-600 mt-2"
              />
            </div>
          </div>
        </div>

        {/* System Prompt Instruction */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            🧠 System Prompt Huấn Luyện AI Bác Sĩ Thú Y
          </h3>

          <p className="text-slate-500">
            Chỉ thị cốt lõi điều khiển hành vi của AI, ép định dạng khung cảnh báo [[TRIAGE_ALERT]] và nguyên tắc chẩn đoán y khoa.
          </p>

          <textarea
            rows={8}
            value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 leading-relaxed text-slate-800"
          />
        </div>

        {/* Emergency Keywords */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Từ Khóa Kích Hoạt Cảnh Báo Khẩn Cấp Cấp Bách (Cảnh Báo Đỏ)
          </h3>

          <p className="text-slate-500">
            Khi phát hiện các từ khóa này trong mô tả của chủ thú cưng, hệ thống sẽ ưu tiên kích hoạt Khung Cảnh Báo Đỏ ngay lập tức.
          </p>

          <input
            type="text"
            value={config.emergencyKeywords.join(', ')}
            onChange={(e) =>
              setConfig({
                ...config,
                emergencyKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Cấu Hình AI
          </button>
        </div>
      </form>
    </div>
  );
};
