import React from 'react';
import {
  MessageSquare,
  FileText,
  Newspaper,
  ShieldAlert,
  MapPin,
  PawPrint,
  Settings,
  LayoutDashboard,
  Users,
  Database,
  Sliders,
  X,
  HeartPulse,
  ShieldCheck,
  User,
  LogOut,
  ChevronRight,
  PhoneCall,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenLoginModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDesktopOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenLoginModal,
  isOpenMobile,
  onCloseMobile,
  isDesktopOpen
}) => {
  const isAdminRole = currentUser.role === 'admin';
  const isAdminViewActive = currentTab.startsWith('admin');

  // Nav items for User Portal
  const userNavItems = [
    {
      id: 'chat',
      label: 'Chat AI Tư Vấn Bệnh',
      icon: MessageSquare,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      id: 'records',
      label: 'Hồ Sơ Bệnh Án',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'news',
      label: 'Tin Tức & Bệnh Lý',
      icon: Newspaper,
      color: 'text-teal-600 bg-teal-50'
    },
    {
      id: 'emergency',
      label: 'Sơ Cứu Khẩn Cấp',
      icon: ShieldAlert,
      badge: '24/7',
      color: 'text-red-600 bg-red-50'
    },
    {
      id: 'clinics',
      label: 'Tìm Phòng Khám Gần Nhất',
      icon: MapPin,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'pets',
      label: 'Quản Lý Thú Cưng',
      icon: PawPrint,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      id: 'account',
      label: 'Tài Khoản & Cài Đặt',
      icon: Settings,
      color: 'text-slate-600 bg-slate-100'
    }
  ];

  // Nav items for Admin Workspace
  const adminNavItems = [
    {
      id: 'admin_dashboard',
      label: 'Thống Kê & Báo Cáo',
      icon: LayoutDashboard,
      color: 'text-amber-400 bg-amber-950/60'
    },
    {
      id: 'admin_users',
      label: 'Quản Lý Người Dùng',
      icon: Users,
      color: 'text-blue-400 bg-blue-950/60'
    },
    {
      id: 'admin_records',
      label: 'Quản Lý Bệnh Án & Y Tế',
      icon: FileText,
      color: 'text-emerald-400 bg-emerald-950/60'
    },
    {
      id: 'admin_clinics',
      label: 'Danh Sách Phòng Khám',
      icon: MapPin,
      color: 'text-purple-400 bg-purple-950/60'
    },
    {
      id: 'admin_rag',
      label: 'Tri Thức RAG & Bệnh Lý AI',
      icon: Database,
      color: 'text-cyan-400 bg-cyan-950/60'
    },
    {
      id: 'admin_config',
      label: 'Cấu Hình Mô Hình & API',
      icon: Sliders,
      color: 'text-rose-400 bg-rose-950/60'
    }
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out lg:static overflow-hidden shrink-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full lg:translate-x-0 lg:shadow-none'
        } ${
          isDesktopOpen ? 'lg:w-72 lg:opacity-100' : 'lg:w-0 lg:opacity-0 lg:border-none'
        } ${
          isAdminViewActive
            ? 'bg-slate-950 text-slate-100 border-r border-slate-800'
            : 'bg-white text-slate-900 border-r border-slate-200/80'
        }`}
      >
        <div className="w-72 h-full flex flex-col">
        {/* ==========================================
            ADMIN SIDEBAR LAYOUT (SEPARATE FROM USER)
           ========================================== */}
        {isAdminViewActive ? (
          <div className="flex flex-col h-full">
            {/* Admin Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
              <div
                onClick={() => handleSelectTab('admin_dashboard')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform overflow-hidden p-1">
                  <img src="/logo.png" alt="PetCare Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-white">PetCare</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-400/80 font-bold">Google Auth Admin Console</p>
                </div>
              </div>

              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Đóng Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Google Account Card */}
            <div className="p-3.5 mx-3 my-3 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Google Admin Role
                </span>
                <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-400/30">
                  XÁC THỰC GOOGLE
                </span>
              </div>

              <div className="flex items-center gap-2.5 mb-2.5">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400/60"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={onOpenLoginModal}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border border-amber-500/20"
                title="Đổi Account Google Admin"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span>Đổi Account Google Admin</span>
              </button>
            </div>

            {/* Admin Navigation Menu ONLY */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
              <div className="px-3 mb-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Menu Quản Trị Hệ Thống</span>
                <span className="bg-slate-800 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                  6 Chức Năng
                </span>
              </div>

              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    title={item.label}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black scale-[1.01]'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-xl transition-colors ${
                          isActive ? 'bg-slate-950 text-amber-400' : item.color
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isActive ? 'text-slate-950' : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Switch to User View Option Footer */}
            <div className="p-3 m-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-semibold">
                <span>Chế Độ Xem Khách Hàng</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                  User View
                </span>
              </div>
              <button
                onClick={() => handleSelectTab('chat')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
                title="Chuyển sang giao diện Khách Hàng"
              >
                <PawPrint className="w-4 h-4" />
                <span>Xem Trang Khách Hàng (User)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================
              USER SIDEBAR LAYOUT (SEPARATE FROM ADMIN)
             ========================================== */
          <div className="flex flex-col h-full">
            {/* User Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div
                onClick={() => handleSelectTab('chat')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform overflow-hidden p-1">
                  <img src="/logo.png" alt="PetCare Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black tracking-tight text-slate-900">PetCare</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Hệ Thống Y Tế Thú Cưng</p>
                </div>
              </div>

              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
                title="Đóng Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>              

            {/* User Navigation Menu ONLY */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
              <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Chức Năng Khách Hàng</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  7 Mục
                </span>
              </div>

              {userNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id || (item.id === 'records' && currentTab === 'record_detail');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    title={item.label}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200/60 font-bold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive ? 'bg-white/20 text-white' : item.color
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white text-emerald-800'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Admin Switcher or Banner for Google Admin */}
            {isAdminRole && (
              <div className="p-3 m-3 bg-amber-50 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Bạn là Google Admin
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 mb-2">
                  Đang xem giao diện khách hàng. Nhấn bên dưới để vào trang Quản trị Admin.
                </p>
                <button
                  onClick={() => handleSelectTab('admin_dashboard')}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-xs"
                  title="Chuyển sang giao diện Quản Trị Admin"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Vào Trang Quản Trị Admin</span>
                </button>
              </div>
            )}

            {/* Emergency Phone Hotline */}
            <div className="p-3 mx-3 mb-3 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200/80 rounded-2xl">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-0.5">
                <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                <span>Hotline Cấp Cứu 24/7</span>
              </div>
              <a
                href="tel:0903123456"
                className="text-xs font-extrabold text-red-600 hover:underline block"
                title="Gọi Hotline Cấp Cứu 24/7"
              >
                0903 123 456
              </a>
            </div>
          </div>
        )}
        </div>
      </aside>
    </>
  );
};
