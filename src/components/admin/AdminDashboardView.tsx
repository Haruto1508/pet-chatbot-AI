import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  PawPrint,
  FileText,
  ShieldAlert,
  MessageSquare,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Globe,
  Sparkles,
  Eye,
  RefreshCw,
  Target,
  Zap,
  ArrowRight,
  BarChart2,
  Clock,
  CheckCircle2,
  Filter,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { SystemStats, MedicalRecord, AnalyticsEvent } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';

type TabSection = 'acquisition' | 'users' | 'chatbot' | 'events';

export const AdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7days');
  const [activeTab, setActiveTab] = useState<TabSection>('acquisition');
  const [isResettingQuota, setIsResettingQuota] = useState(false);

  const handleResetGuestQuota = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn reset toàn bộ số lượt chat của khách vãng lai? Sau khi reset, tất cả khách sẽ được chat lại 8 lượt.')) {
      return;
    }
    setIsResettingQuota(true);
    try {
      await api.resetGuestQuota();
      await loadData(timeRange, true);
    } catch (e) {
      console.error('Lỗi reset guest quota:', e);
    } finally {
      setIsResettingQuota(false);
    }
  };

  const loadData = async (range: string, showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setLoading(true);

    try {
      const [sData, rData] = await Promise.all([
        api.getStats(range),
        api.getMedicalRecords().catch(() => [])
      ]);
      setStats(sData);
      setRecentRecords(rData.slice(0, 5));
    } catch (e) {
      console.error('Error loading admin dashboard stats:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Đang tải và tổng hợp dữ liệu thống kê Vethic Analytics...</p>
      </div>
    );
  }

  // Triage breakdown percentages
  const totalTriage = stats.triageRedCount + stats.triageYellowCount + stats.triageGreenCount || 1;
  const redPct = Math.round((stats.triageRedCount / totalTriage) * 100);
  const yellowPct = Math.round((stats.triageYellowCount / totalTriage) * 100);
  const greenPct = Math.round((stats.triageGreenCount / totalTriage) * 100);

  // Computed display values
  const websiteVisitors = stats.websiteVisitors || 0;
  const uniqueVisitors = stats.uniqueVisitors || 1;
  const pageViews = stats.pageViews || 0;
  const viewsPerVisitor = (pageViews / Math.max(1, uniqueVisitors)).toFixed(1);
  const activeUsers = stats.activeUsers || 0;
  const chatUsers = stats.chatUsers || 0;
  const guestUsers = stats.guestChatUsers || 0;
  const registeredUsers = stats.registeredUsers || 0;
  const loggedInChatUsers = stats.loggedInChatUsers || 0;
  const chatSessions = stats.chatSessions || 0;
  const totalMessages = stats.totalMessages || 0;
  const avgMessages = stats.avgMessagesPerSession || (chatSessions > 0 ? (totalMessages / chatSessions).toFixed(1) : '0');
  const visitorToChatRate = stats.visitorToChatRate || Math.min(100, Math.round((chatUsers / uniqueVisitors) * 100));
  const guestToRegisteredRate = stats.guestToRegisteredRate || Math.min(100, Math.round((registeredUsers / uniqueVisitors) * 100));

  // User distribution comparison
  const totalUserPool = guestUsers + registeredUsers || 1;
  const guestUserPct = Math.round((guestUsers / totalUserPool) * 100);
  const registeredUserPct = 100 - guestUserPct;

  return (
    <div className="space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. Header Banner & Filter Toolbar
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <LayoutDashboard className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Trung Tâm Thống Kê & Phân Tích Dữ Liệu</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Phân tách đa chiều giữa <strong>Người truy cập web (Visitors)</strong>, <strong>Người sử dụng thực tế (Active Users)</strong>, <strong>Khách vãng lai (Guest)</strong>, <strong>Tài khoản đã đăng ký (Registered)</strong> và tương tác tư vấn thú y.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-1 text-xs">
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === '7days' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Ngày Qua
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === '30days' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Ngày (Tháng)
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(timeRange, true)}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all shadow-xs disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Top 6 Executive KPI Cards (Theo đề xuất nghiên cứu)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Website Visitors */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Website Visitors</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{websiteVisitors.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              Unique: <strong className="text-slate-700">{uniqueVisitors.toLocaleString()}</strong>
            </p>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>{pageViews.toLocaleString()} views</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              +{stats.userGrowth || 0}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. Active Users */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Users</span>
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{activeUsers.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Tương tác thực trên web</p>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-600 font-bold">
            <span>Engaged Traffic</span>
            <span>{Math.round((activeUsers / Math.max(1, websiteVisitors)) * 100)}% visit</span>
          </div>
        </div>

        {/* 3. Chat Users */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chat Users</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{chatUsers.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Đã gửi câu hỏi tư vấn</p>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-bold">
            <span>Tỉ lệ chuyển đổi</span>
            <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700">{visitorToChatRate}%</span>
          </div>
        </div>

        {/* 4. Guest Users */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Guest Users</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{guestUsers.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Dùng dạng vãng lai</p>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-amber-700 font-bold">
            <span>Phiên Guest</span>
            <span>{stats.guestSessions.toLocaleString()} phiên</span>
          </div>
        </div>

        {/* 5. Registered Users */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Registered Users</span>
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{registeredUsers.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Tài khoản chính thức</p>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-purple-700 font-bold">
            <span>Guest → Reg</span>
            <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-700">{guestToRegisteredRate}%</span>
          </div>
        </div>

        {/* 6. Chat Sessions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chat Sessions</span>
            <div className="p-1.5 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{chatSessions.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">{totalMessages.toLocaleString()} tin nhắn</p>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-pink-700 font-bold">
            <span>Độ sâu trung bình</span>
            <span>{avgMessages} tin/phiên</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Visual Conversion Funnel (Phễu Hành Vi & Chuyển Đổi Người Dùng)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" /> Phễu Chuyển Đổi & Cây Hành Trình Người Dùng (User Journey Funnel)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Minh chứng luồng người dùng thực: Từ lúc truy cập website → Phân nhánh Guest/Member → Sử dụng Chatbot → Tạo phiên & Tin nhắn y khoa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Visitor → Chat Rate: <strong>{visitorToChatRate}%</strong>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Guest → Reg: <strong>{guestToRegisteredRate}%</strong>
            </span>
          </div>
        </div>

        {/* Funnel Diagram Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 relative items-stretch">
          {/* Step 1: Website Visitors */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-blue-100/30 border border-blue-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white tracking-wider">
                Bước 1: Vào Web
              </span>
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Website Visitors</p>
              <p className="text-2xl font-black text-slate-900">{websiteVisitors.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Unique: {uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="text-[10px] font-bold text-blue-700 bg-white/80 p-2 rounded-xl border border-blue-200/50">
              100% Tổng lưu lượng ghé thăm
            </div>
          </div>

          {/* Step 2: Split Branch (Guest vs Registered) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-600 text-white tracking-wider">
                Bước 2: Phân Nhánh
              </span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded-xl bg-white border border-amber-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700">Khách Vãng Lai (Guest)</span>
                  <p className="text-sm font-black text-slate-900">{guestUsers.toLocaleString()}</p>
                </div>
                <span className="text-xs font-black text-amber-600">{guestUserPct}%</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-purple-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700">Tài Khoản Đăng Ký</span>
                  <p className="text-sm font-black text-slate-900">{registeredUsers.toLocaleString()}</p>
                </div>
                <span className="text-xs font-black text-purple-600">{registeredUserPct}%</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-indigo-700 bg-white/80 p-2 rounded-xl border border-indigo-200/50">
              Phân loại định danh người dùng
            </div>
          </div>

          {/* Step 3: Chat Users */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border border-emerald-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-600 text-white tracking-wider">
                Bước 3: Tương Tác AI
              </span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Chat Users</p>
              <p className="text-2xl font-black text-slate-900">{chatUsers.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {loggedInChatUsers} User + {guestUsers} Guest
              </p>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 bg-white/80 p-2 rounded-xl border border-emerald-200/50">
              {visitorToChatRate}% người truy cập dùng Chatbot
            </div>
          </div>

          {/* Step 4: Chat Sessions */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/70 to-violet-100/30 border border-violet-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-violet-600 text-white tracking-wider">
                Bước 4: Phiên Khám
              </span>
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Chat Sessions</p>
              <p className="text-2xl font-black text-slate-900">{chatSessions.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.registeredSessions} reg / {stats.guestSessions} guest
              </p>
            </div>
            <div className="text-[10px] font-bold text-violet-700 bg-white/80 p-2 rounded-xl border border-violet-200/50">
              {(chatSessions / Math.max(1, chatUsers)).toFixed(1)} phiên / người chat
            </div>
          </div>

          {/* Step 5: Total Messages & Clinical Value */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-rose-100/30 border border-rose-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider">
                Bước 5: Tin Nhắn & Bệnh Án
              </span>
              <FileText className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">Total Messages</p>
              <p className="text-2xl font-black text-slate-900">{totalMessages.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.totalMedicalRecords} bệnh án đã lưu
              </p>
            </div>
            <div className="text-[10px] font-bold text-rose-700 bg-white/80 p-2 rounded-xl border border-rose-200/50">
              {avgMessages} tin nhắn / phiên chat
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. 3 Nhóm Phân Tích Chuyên Nghiệp (Acquisition, User, Chatbot, Events)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('acquisition')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'acquisition'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" /> Tiếp Cận (Acquisition)
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> Phân Khúc Người Dùng (Users)
          </button>
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'chatbot'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chatbot & Lâm Sàng (Triage)
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" /> Telemetry Real-time ({stats.recentEvents?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* ──── TAB 1: ACQUISITION ──── */}
          {activeTab === 'acquisition' && (
            <div className="space-y-6">
              {/* Acquisition Metric Sub-grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Total Visitors</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{websiteVisitors.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Lượt vào web toàn thời gian</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Unique Visitors</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{uniqueVisitors.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Độc lập theo thiết bị / IP</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Page Views</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{pageViews.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Tổng số lượt xem trang</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Views / Visitor</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{viewsPerVisitor}</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Mức độ tương tác cao</span>
                </div>
              </div>

              {/* AreaChart of Visitors vs Chat Users */}
              {stats.history && stats.history.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" /> Xu Hướng Lượng Truy Cập vs Tương Tác Chat
                    </h3>
                    <span className="text-xs text-slate-500">
                      So sánh Website Visitors và Chat Users thực tế theo ngày
                    </span>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorChatUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="visitors" name="Website Visitors" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                        <Area type="monotone" dataKey="chatUsers" name="Chat Users" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorChatUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──── TAB 2: USERS SEGMENTATION ──── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guest vs Registered Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" /> Tỉ Lệ Phân Phối Người Dùng
                  </h3>
                  {/* Segmented Progress Bar */}
                  <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${guestUserPct}%` }} className="bg-amber-500 h-full transition-all" title={`Khách: ${guestUserPct}%`} />
                    <div style={{ width: `${registeredUserPct}%` }} className="bg-purple-600 h-full transition-all" title={`Đăng ký: ${registeredUserPct}%`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-900">Guest Users (Vãng Lai)</span>
                      <p className="text-xl font-black text-amber-800 mt-1">{guestUsers.toLocaleString()}</p>
                      <span className="text-[10px] text-amber-700">{guestUserPct}% người sử dụng</span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <span className="font-bold text-purple-900">Registered Users</span>
                      <p className="text-xl font-black text-purple-800 mt-1">{registeredUsers.toLocaleString()}</p>
                      <span className="text-[10px] text-purple-700">{registeredUserPct}% người sử dụng</span>
                    </div>
                  </div>
                </div>

                {/* Conversion Performance Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" /> Hiệu Suất Chuyển Đổi Tài Khoản
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700">Guest → Registered Conversion</span>
                        <p className="text-[11px] text-slate-500">Tỷ lệ khách tạo tài khoản để lưu bệnh án lâu dài</p>
                      </div>
                      <span className="text-xl font-black text-purple-600">{guestToRegisteredRate}%</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700">Người Chat Đã Đăng Nhập</span>
                        <p className="text-[11px] text-slate-500">Sử dụng đầy đủ tính năng lịch sử & lưu hồ sơ thú cưng</p>
                      </div>
                      <span className="text-xl font-black text-emerald-600">{loggedInChatUsers}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Rate Limits Management Card */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50/60 to-orange-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Quản Lý Giới Hạn Chat Khách Vãng Lai (Guest Rate Limit)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                      Hệ thống tự động khóa chặt theo <strong>Thiết Bị / IP Máy</strong> (giới hạn 8 tin nhắn miễn phí). Người dùng chuyển sang tab ẩn danh (Incognito) hoặc trình duyệt khác trên cùng máy đều được nhận diện và tính chung 1 hạn mức.
                    </p>
                  </div>
                  <button
                    onClick={handleResetGuestQuota}
                    disabled={isResettingQuota}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs transition-all self-start sm:self-center disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResettingQuota ? 'animate-spin text-amber-600' : 'text-amber-700'}`} />
                    <span>{isResettingQuota ? 'Đang reset...' : 'Reset Toàn Bộ Quota Guest'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-amber-200/50">
                  <span>Hạn mức mặc định: <strong>8 tin nhắn / máy</strong></span>
                  <span>•</span>
                  <span>Đồng bộ thời gian thực với Supabase <code>guest_rate_limits</code></span>
                </div>
              </div>
            </div>
          )}

          {/* ──── TAB 3: CHATBOT & CLINICAL ──── */}
          {activeTab === 'chatbot' && (
            <div className="space-y-6">
              {/* Clinical Metrics Sub-grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Cuộc Chat AI</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{chatSessions.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Phiên tư vấn bệnh học</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Tin Nhắn</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totalMessages.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Hỏi đáp triệu chứng & đơn thuốc</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Thú Cưng</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{stats.totalPets}</p>
                  <span className="text-[10px] text-slate-500">Đang được theo dõi hồ sơ</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Bệnh Án Đã Lưu</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{stats.totalMedicalRecords}</p>
                  <span className="text-[10px] text-purple-600 font-bold">Tổng hợp tự động bởi AI</span>
                </div>
              </div>

              {/* Triage Proportions Bar */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" /> Phân Loại Mức Độ Nguy Hiểm Bệnh Học (Triage Proportions)
                  </h3>
                  <span className="text-xs text-slate-500">Dựa trên triệu chứng AI phát hiện</span>
                </div>

                {/* Progress bar */}
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div style={{ width: `${redPct}%` }} className="bg-red-500 h-full transition-all" title={`Đỏ: ${redPct}%`} />
                  <div style={{ width: `${yellowPct}%` }} className="bg-amber-400 h-full transition-all" title={`Vàng: ${yellowPct}%`} />
                  <div style={{ width: `${greenPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Xanh: ${greenPct}%`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
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
            </div>
          )}

          {/* ──── TAB 4: REAL-TIME TELEMETRY EVENTS ──── */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Dòng Sự Kiện Thời Gian Thực (Live Ingestion Stream)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi nhận trực tiếp từ trình duyệt khi khách vào web, mở chat, gửi tin nhắn và đăng nhập.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {stats.recentEvents?.length || 0} Sự kiện gần nhất
                </span>
              </div>

              {stats.recentEvents && stats.recentEvents.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentEvents.map((ev, idx) => {
                    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (ev.eventType === 'PAGE_VIEW') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    if (ev.eventType === 'CHAT_MESSAGE_SENT') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    if (ev.eventType === 'CHAT_SESSION_STARTED') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                    if (ev.eventType === 'LOGIN' || ev.eventType === 'REGISTER') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <div
                        key={ev.id || idx}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wide ${badgeColor}`}>
                            {ev.eventType}
                          </span>
                          <span className="text-xs font-mono text-slate-700 font-semibold">
                            {ev.path || '/'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: {ev.visitorId?.slice(0, 10)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(ev.createdAt).toLocaleTimeString('vi-VN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  Chưa có sự kiện telemetry mới được ghi nhận trong phiên làm việc.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. Bệnh Án Mới Nhất Trên Hệ Thống (Recent Records Feed)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Bệnh Án Mới Nhất Được AI Ghi Nhận
          </h3>
          <span className="text-xs text-slate-500 font-medium">{stats.totalMedicalRecords} tổng bệnh án</span>
        </div>

        <div className="space-y-3">
          {recentRecords.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
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
