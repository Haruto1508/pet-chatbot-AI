import React from 'react';
import { RefreshCw } from 'lucide-react';

interface MaintenanceViewProps {
  error?: Error | null;
  resetError?: () => void;
  isCrash?: boolean;
  message?: string;
  onAdminLogin?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ resetError, message, onAdminLogin }) => {
  const handleReload = () => {
    sessionStorage.removeItem('chunk_retry_reloaded');
    sessionStorage.removeItem('vite_preload_reloaded');
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans selection:bg-emerald-200">
      {/* Soft Ambient Background Decor Matching Vethic Style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px]" />
        <div className="absolute -bottom-[10%] right-1/4 w-[450px] h-[450px] rounded-full bg-teal-500/5 blur-[80px]" />
      </div>

      {/* Main Clean White Card */}
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Logo with Soft Aura */}
        <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 blur-md animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-200/80 p-2.5 flex items-center justify-center shadow-md shadow-emerald-500/10 hover:scale-105 transition-transform duration-300">
            <img 
              src="/logo.png" 
              alt="Vethic AI" 
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.tried) {
                  target.dataset.tried = '1';
                  target.src = 'logo.png';
                }
              }}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex items-center justify-center gap-1 mb-3">
          <span className="text-xl font-black text-slate-900 tracking-tight">Vethic</span>
          <span className="text-emerald-600 text-sm font-black">AI</span>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Bảo trì định kỳ
        </div>

        {/* Title & Clean Notification */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
          Hệ thống đang bảo trì nâng cấp
        </h1>
        <p className="text-sm font-medium text-slate-500 mb-6">
          {message || 'Vui lòng quay lại sau'}
        </p>

        {/* Clean Single Action Button */}
        <button
          onClick={handleReload}
          className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Tải lại trang
        </button>

        {/* Discrete Admin Login for maintenance bypass */}
        {onAdminLogin && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onAdminLogin}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-medium"
            >
              Dành cho Quản trị viên (Đăng nhập)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
