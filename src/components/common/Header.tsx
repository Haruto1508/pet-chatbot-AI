import React, { useState } from 'react';
import {
  Menu,
  HeartPulse,
  UserCheck,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  LogIn,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../../types';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { AdminNotifications } from '../admin/AdminNotifications';

interface HeaderProps {
  currentTab: string;
  currentUser: UserProfile;
  isAuthLoading?: boolean;
  onOpenLoginModal: () => void;
  onToggleSidebar: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  isAuthLoading = false,
  onOpenLoginModal,
  onToggleSidebar,
  onNavigateToTab
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  // Map active tab to human readable title
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'chat':
        return { title: 'Chat AI Tư Vấn Bệnh Lý', badge: 'Gemini 3.6 Flash' };
      case 'records':
        return { title: 'Hồ Sơ Bệnh Án Thú Cưng', badge: 'Lịch Sử Y Tế' };
      case 'record_detail':
        return { title: 'Chi Tiết Hồ Sơ Bệnh Án', badge: 'AI Diagnostic' };
      case 'news':
        return { title: 'Tin Tức & Bệnh Lý Thú Y', badge: 'Cẩm Nang' };
      case 'emergency':
        return { title: 'Sơ Cứu Khẩn Cấp 24/7', badge: 'Cấp Cứu' };
      case 'clinics':
        return { title: 'Tìm Phòng Khám Thú Y Gần Nhất', badge: 'Bản Đồ Google' };
      case 'pets':
        return { title: 'Quản Lý Danh Sách Thú Cưng', badge: 'Thú Cưng' };
      case 'account':
        return { title: 'Tài Khoản & Cài Đặt Hệ Thống', badge: 'Cá Nhân' };
      case 'admin_dashboard':
        return { title: 'Bảng Điều Khiển Quản Trị Admin', badge: 'Dashboard' };
      case 'admin_users':
        return { title: 'Quản Lý Tài Khoản Người Dùng', badge: 'Admin Role' };
      case 'admin_records':
        return { title: 'Quản Lý Hồ Sơ Y Tế & Chẩn Đoán', badge: 'Admin System' };
      case 'admin_clinics':
        return { title: 'Cấu Hình Danh Sách Phòng Khám', badge: 'Google Maps Data' };
      case 'admin_rag':
        return { title: 'Cơ Sở Tri Thức RAG & Bệnh Lý AI', badge: 'Gemini Vector' };
      case 'admin_config':
        return { title: 'Cấu Hình Mô Hình AI & Tham Số', badge: 'System Config' };
      case 'admin_eval':
        return { title: 'Kiểm Định Chất Lượng AI', badge: 'TorchMetrics & Ragas' };
      case 'admin_health':
        return { title: 'Kiểm Tra Kết Nối & Giữ Sống', badge: 'Health Check' };
      case 'admin_logs':
        return { title: 'Nhật Ký Hệ Thống', badge: 'Audit Logs' };
      default:
        return { title: 'Vethic AI System', badge: 'Trực Tuyến' };
    }
  };

  const currentTabMeta = getTabTitle(currentTab);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0"></span>
            <span className="font-medium text-[11px] sm:text-xs">
              <span className="hidden sm:inline">Vethic AI — Hệ Thống Tư Vấn Bệnh Lý & Sơ Cứu Khẩn Cấp Thú Cưng 24/7</span>
              <span className="sm:hidden">Vethic AI — Tư Vấn Thú Cưng 24/7</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-100">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-amber-300" />
              <span className="hidden md:inline">Hotline: </span>
              <strong className="text-amber-300">0903 123 456</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Side: Mobile Sidebar Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 cursor-pointer rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
            title="Đóng/Mở Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Tab Title Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
              {currentTabMeta.title}
            </h1>
            <span
              className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                currentTab.startsWith('admin')
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {currentTabMeta.badge}
            </span>
          </div>
        </div>

        {/* Right Side: Google Login Profile Button */}
        <div className="flex items-center gap-3">
          {isAuthLoading ? (
            /* Premium loading skeleton to prevent login button flickering */
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 animate-pulse text-xs font-semibold text-slate-400">
              <div className="w-5 h-5 rounded-full bg-slate-200" />
              <span className="hidden md:inline">Đang xác thực...</span>
            </div>
          ) : (
            <>
              {isAdmin && <AdminNotifications onNavigateToTab={onNavigateToTab} />}
              
              {/* Quick role status badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold">
                <span className="text-slate-500">Google Auth:</span>
                {isAdmin ? (
                  <span className="text-amber-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> ADMIN
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> USER
                  </span>
                )}
              </div>

              {currentUser.id === 'guest' ? (
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md font-bold text-xs"
                  title="Đăng Nhập tài khoản Google"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-left shadow-2xs" title={`${currentUser.name} — ${currentUser.email}`}>
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-400"
                    />
                    <div className="hidden md:block">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[120px]">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="text-slate-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1"
                    title="Đăng Xuất"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        userName={currentUser.name}
        userEmail={currentUser.email}
        onConfirm={async () => {
          const { supabase } = await import('../../services/supabaseClient');
          await supabase.auth.signOut();
        }}
      />
    </header>
  );
};
