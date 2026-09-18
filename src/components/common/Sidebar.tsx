import React, { useState } from "react";
import {
  MessageSquare, FileText, Newspaper, ShieldAlert, MapPin,
  PawPrint, Settings, LayoutDashboard, Users, Database,
  Sliders, X, ShieldCheck, LogOut, LogIn, PawPrint as PawIcon,
  Phone, ChevronLeft, ChevronRight, Menu, Activity, ScrollText, HelpCircle, Award
} from "lucide-react";
import { UserProfile } from "../../types";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import { supabase } from "../../services/supabaseClient";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenLoginModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDesktopOpen: boolean;
  onToggleDesktop: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab, setCurrentTab, currentUser, onOpenLoginModal,
  isOpenMobile, onCloseMobile, isDesktopOpen, onToggleDesktop,
}) => {
  const isAdminRole = currentUser.role === "admin";
  const isAdminView = currentTab.startsWith("admin");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userNavItems = [
    { id: "chat", label: "Chat AI Tư Vấn", icon: MessageSquare },
    // { id: "records", label: "Hồ Sơ Bệnh Án", icon: FileText },
    { id: "news", label: "Tin Tức & Bệnh Lý", icon: Newspaper },
    { id: "emergency", label: "Sơ Cứu Khẩn Cấp", icon: ShieldAlert, badge: "24/7" },
    { id: "clinics", label: "Tìm Phòng Khám", icon: MapPin },
    // { id: "pets", label: "Quản Lý Thú Cưng", icon: PawPrint },
    { id: "account", label: "Tài Khoản & Cài Đặt", icon: Settings },
  ];

  const adminNavItems = [
    { id: "admin_dashboard", label: "Thống Kê & Báo Cáo",      icon: LayoutDashboard },
    { id: "admin_users",     label: "Quản Lý Người Dùng",      icon: Users },
    { id: "admin_records",   label: "Quản Lý Bệnh Án",         icon: FileText },
    { id: "admin_clinics",   label: "Danh Sách Phòng Khám",    icon: MapPin },
    { id: "admin_rag",       label: "Tri Thức RAG & AI",       icon: Database },
    { id: "admin_eval",      label: "Kiểm Định Chất Lượng AI", icon: Award },
    { id: "admin_config",    label: "Cấu Hình AI & API",       icon: Sliders },
    { id: "admin_health",    label: "Kiểm Tra & Giữ Sống",     icon: Activity },
    { id: "admin_logs",      label: "Log Hệ Thống",            icon: ScrollText },
  ];

  const handleNav = (tabId: string) => {
    setCurrentTab(tabId);
    onCloseMobile();
  };

  const avatarInitials = currentUser.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  /* ---- ADMIN SIDEBAR (dark theme kept) ---- */
  if (isAdminView) {
    return (
      <>
        {isOpenMobile && (
          <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden" />
        )}
        <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800 transition-all duration-300 lg:static overflow-hidden shrink-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl w-64" : "-translate-x-full lg:translate-x-0"
        } ${isDesktopOpen ? "lg:w-64 lg:opacity-100" : "lg:w-0 lg:opacity-0 lg:border-none"}`}>
          <div className="w-64 h-full flex flex-col">
            {/* Admin Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div onClick={() => handleNav("admin_dashboard")} className="flex items-center gap-2.5 cursor-pointer group">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white">Vethic</span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">ADMIN</span>
                  </div>
                </div>
              </div>
              <button onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              <p className="px-3 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Menu Quản Trị</p>
              {adminNavItems.map(({ id, label, icon: Icon }) => {
                const isActive = currentTab === id;
                return (
                  <button key={id} onClick={() => handleNav(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Switch to User View */}
            <div className="p-3 border-t border-slate-800">
              <button onClick={() => handleNav("chat")}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" /> Xem Trang Khách Hàng
              </button>
            </div>

            {/* Admin User */}
            <div className="p-3 border-t border-slate-800 flex items-center gap-2.5">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400/60 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Đăng xuất quản trị"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-all flex items-center justify-center shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
        <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
          userName={currentUser.name} userEmail={currentUser.email}
          onConfirm={async () => {
            await supabase.auth.signOut();
            setCurrentTab("chat");
          }} />
      </>
    );
  }

  /* ---- USER SIDEBAR (icon-only when collapsed) ---- */

  /* Collapsed icon-only sidebar */
  if (!isOpenMobile && !isDesktopOpen) {
    return (
      <>
        <aside className="hidden lg:flex flex-col items-center bg-[#f9f9f9] border-r border-slate-200 shrink-0 w-[60px] h-full py-3 gap-1">
          {/* Toggle button */}
          <button onClick={onToggleDesktop} title="Mở sidebar"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 flex items-center justify-center border border-slate-200/60 shadow-xs transition-all mb-1 cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>

          {/* New chat / edit button */}
          <button onClick={() => handleNav("chat")} title="Chat mới"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
            <FileText className="w-5 h-5" />
          </button>

          {/* Nav icons */}
          <div className="flex flex-col gap-0.5 mt-1">
            {userNavItems.map(({ id, label, icon: Icon }: any) => {
              const isActive = currentTab === id || (id === "records" && currentTab === "record_detail");
              return (
                <button key={id} onClick={() => handleNav(id)} title={label}
                  className={`p-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-emerald-600 shadow-xs border border-slate-200/80"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                  }`}>
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          {/* Admin icon */}
          {isAdminRole && (
            <button onClick={() => handleNav("admin_dashboard")} title="Vào Trang Admin"
              className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-all mt-1">
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Avatar at bottom */}
          {currentUser.id === "guest" ? (
            <button onClick={onOpenLoginModal} title="Đăng Nhập"
              className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all">
              <LogIn className="w-4 h-4 text-slate-500" />
            </button>
          ) : (
            <button onClick={() => setShowLogoutModal(true)} title={currentUser.name}
              className="relative group">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-400/60" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black ring-2 ring-violet-400/60">
                  {avatarInitials}
                </div>
              )}
            </button>
          )}
        </aside>

        <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
          userName={currentUser.name} userEmail={currentUser.email}
          onConfirm={async () => { await supabase.auth.signOut(); }} />
      </>
    );
  }

  /* Expanded full sidebar */
  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#f9f9f9] border-r border-slate-200 transition-all duration-300 ease-in-out lg:static overflow-hidden shrink-0 ${
        isOpenMobile ? "translate-x-0 shadow-2xl w-[260px]" : "-translate-x-full lg:translate-x-0 lg:shadow-none lg:w-[260px]"
      }`}>
        <div className="w-[260px] h-full flex flex-col">

          {/* Top: Logo + collapse button */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2">
            <div onClick={() => handleNav("chat")} className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Vethic" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight">Vethic AI</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onCloseMobile} title="Đóng sidebar"
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
                <X className="w-4 h-4" />
              </button>
              <button onClick={onToggleDesktop} title="Thu gọn sidebar"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Section */}
          <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {userNavItems.map(({ id, label, icon: Icon, badge }: any) => {
              const isActive = currentTab === id || (id === "records" && currentTab === "record_detail");
              return (
                <button key={id} data-tour={`nav-${id}`} onClick={() => handleNav(id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left group ${
                    isActive
                      ? "bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900 font-medium"
                  }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-600" : "text-slate-500 group-hover:text-slate-700"}`} />
                    <span className="truncate text-xs">{label}</span>
                  </div>
                  {badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600"
                    }`}>{badge}</span>
                  )}
                </button>
              );
            })}

            {/* Admin Switcher */}
            {isAdminRole && (
              <div className="pt-3 mt-2 border-t border-slate-200">
                <p className="px-3 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quản Trị</p>
                <button onClick={() => handleNav("admin_dashboard")}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-amber-50 hover:text-amber-900 transition-all">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Vào Trang Admin</span>
                </button>
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  window.dispatchEvent(new Event('vethic_open_onboarding_tour'));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Hướng Dẫn Sử Dụng</span>
              </button>
            </div>
          </nav>

          {/* Bottom User Profile Section */}
          <div className="border-t border-slate-200 p-2 space-y-1">
            {currentUser.id === "guest" ? (
              <button onClick={onOpenLoginModal}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-xs">Đăng Nhập Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all cursor-default group">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black ring-1 ring-violet-400 flex-shrink-0">
                    {avatarInitials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
                <button onClick={() => setShowLogoutModal(true)} title="Đăng Xuất"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
        userName={currentUser.name} userEmail={currentUser.email}
        onConfirm={async () => { await supabase.auth.signOut(); }} />
    </>
  );
};