import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogIn, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminAccessDeniedViewProps {
  currentUser: UserProfile;
  onOpenLoginModal: () => void;
  onGoHome: () => void;
}

export const AdminAccessDeniedView: React.FC<AdminAccessDeniedViewProps> = ({
  currentUser,
  onOpenLoginModal,
  onGoHome,
}) => {
  const [countdown, setCountdown] = useState<number>(6);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onGoHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onGoHome]);

  const isGuest = !currentUser.id || currentUser.id === 'guest';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 mb-3">
          <Lock className="w-3 h-3" />
          403 Forbidden — Quyền Truy Cập Bị Giới Hạn
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Khu Vực Quản Trị Được Bảo Vệ
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
          Bạn đang cố gắng truy cập trang quản trị của <strong className="text-slate-200">Vethic AI</strong>. Khu vực này chỉ dành riêng cho tài khoản có vai trò <strong className="text-amber-400">Quản trị viên (Admin)</strong>.
        </p>

        {/* User Status Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 mb-6 text-left flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[11px]">Tài khoản hiện tại:</span>
            <div className="font-semibold text-white truncate max-w-[200px]">
              {isGuest ? 'Khách chưa đăng nhập' : currentUser.email || currentUser.name}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
            Role: {currentUser.role}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {isGuest ? (
            <button
              onClick={onOpenLoginModal}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              Đăng Nhập Tài Khoản Admin
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              Chuyển Sang Tài Khoản Admin Khác
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay Về Trang Tư Vấn Chat
          </button>
        </div>

        {/* Auto redirect counter */}
        <div className="mt-5 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <span>Tự động chuyển về trang chính sau <strong>{countdown}s</strong></span>
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="text-indigo-400 hover:underline text-[10px]"
          >
            ({isPaused ? 'Tiếp tục' : 'Tạm dừng'})
          </button>
        </div>
      </div>
    </div>
  );
};
