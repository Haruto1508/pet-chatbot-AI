import React, { useState } from 'react';
import { X, LogOut, AlertTriangle } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  userName?: string;
  userEmail?: string;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName = 'người dùng',
  userEmail = ''
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shadow-xs">
            <LogOut className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Xác Nhận Đăng Xuất
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
              Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng <strong className="text-slate-800 font-semibold">{userName}</strong> không?
            </p>
          </div>
        </div>

        {/* User Info Badge */}
        {userEmail && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 block truncate">{userName}</span>
              <span className="text-[11px] text-slate-500 block truncate">{userEmail}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
