import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, PawPrint, FileText, ShieldAlert, MessageSquare, Activity, ArrowUpRight } from 'lucide-react';
import { SystemStats, MedicalRecord } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';

export const AdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const sData = await api.getStats();
      const rData = await api.getMedicalRecords();
      setStats(sData);
      setRecentRecords(rData.slice(0, 5));
    } catch (e) {
      console.error('Error loading admin dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !stats) {
    return <div className="text-center py-20 text-xs text-slate-500">Đang tải dữ liệu thống kê Admin...</div>;
  }

  const totalTriage = stats.triageRedCount + stats.triageYellowCount + stats.triageGreenCount || 1;
  const redPct = Math.round((stats.triageRedCount / totalTriage) * 100);
  const yellowPct = Math.round((stats.triageYellowCount / totalTriage) * 100);
  const greenPct = Math.round((stats.triageGreenCount / totalTriage) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold">Trang Thống Kê & Báo Cáo Admin</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tổng quan thời gian thực về người dùng, lượt tư vấn AI, phân loại rủi ro sức khỏe và hệ thống hồ sơ bệnh án.
          </p>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Người Dùng</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            +12% so với tháng trước <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Tổng Thú Cưng</span>
            <PawPrint className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalPets}</p>
          <span className="text-[10px] text-slate-400">Đang quản lý hồ sơ</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Cuộc Chat AI</span>
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.activeChats}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Trực tuyến 24/7</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Hồ Sơ Bệnh Án</span>
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalMedicalRecords}</p>
          <span className="text-[10px] text-purple-600 font-bold">Đã lưu từ AI</span>
        </div>
      </div>

      {/* Triage Danger Level Proportions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" /> Thống Kê Phân Loại Mức Độ Nguy Hiểm (Triage Level Proportions)
        </h3>

        {/* Visual Progress Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${redPct}%` }} className="bg-red-500 h-full" title={`Đỏ: ${redPct}%`} />
          <div style={{ width: `${yellowPct}%` }} className="bg-amber-400 h-full" title={`Vàng: ${yellowPct}%`} />
          <div style={{ width: `${greenPct}%` }} className="bg-emerald-500 h-full" title={`Xanh: ${greenPct}%`} />
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center justify-between font-bold text-red-900">
              <span>🔴 Cảnh báo Đỏ (Cấp Bách)</span>
              <span>{stats.triageRedCount} ca ({redPct}%)</span>
            </div>
            <p className="text-[11px] text-red-700 mt-1">Cần can thiệp bác sĩ thú y gấp trong 1 giờ</p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span>🟡 Cảnh báo Vàng (Theo Dõi)</span>
              <span>{stats.triageYellowCount} ca ({yellowPct}%)</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">Theo dõi triệu chứng nhẹ trong 24h</p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span>🟢 Khung Xanh (An Toàn)</span>
              <span>{stats.triageGreenCount} ca ({greenPct}%)</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Tư vấn dinh dưỡng và chăm sóc chuẩn</p>
          </div>
        </div>
      </div>

      {/* Recent Medical Records Feed */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> Bệnh Án Mới Nhất Trên Hệ Thống
        </h3>

        <div className="space-y-3">
          {recentRecords.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    🐾 {rec.petName} ({rec.petSpecies})
                  </span>
                  <span className="text-[11px] text-slate-400">• {rec.date}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">{rec.symptomSummary}</p>
              </div>

              <TriageBadge level={rec.triageLevel} compact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
