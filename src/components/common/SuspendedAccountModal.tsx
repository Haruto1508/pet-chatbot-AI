import React, { useState } from 'react';
import { ShieldAlert, Send, LogOut, UserPlus, CheckCircle, Lock, Mail, HelpCircle } from 'lucide-react';
import { UserProfile } from '../../types';

interface SuspendedAccountModalProps {
  currentUser: UserProfile;
  onLogoutAndSwitch: () => void | Promise<void>;
}

export const SuspendedAccountModal: React.FC<SuspendedAccountModalProps> = ({
  currentUser,
  onLogoutAndSwitch
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitUnlockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    // Save request to localStorage so admin can inspect or simulate unlock request
    const existingRequests = JSON.parse(localStorage.getItem('petcare_unlock_requests') || '[]');
    const newRequest = {
      id: `req_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      reason: reason.trim(),
      createdAt: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem('petcare_unlock_requests', JSON.stringify([newRequest, ...existingRequests]));
    window.dispatchEvent(new Event('petcare_notifications_updated'));

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-red-200 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Danger Banner Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-7 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-white/10">
            <ShieldAlert className="w-9 h-9 animate-bounce" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Tài Khoản Đã Bị Khóa</h2>
          <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-sm mx-auto">
            Hệ thống tạm dừng quyền truy cập của tài khoản này theo chính sách quản trị.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* User Profile Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-red-400"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                  Đã bị khóa
                </span>
              </div>
              <span className="text-xs text-slate-500 block truncate">{currentUser.email}</span>
            </div>
          </div>

          {/* Unlock Request Section */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Yêu Cầu Mở Khóa Tài Khoản</span>
            </div>

            {isSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-900 mb-0.5">Đã gửi yêu cầu thành công!</span>
                  Quản trị viên đã nhận được yêu cầu mở khóa cho tài khoản <strong>{currentUser.email}</strong>. Vui lòng chờ phản hồi trong thời gian sớm nhất.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitUnlockRequest} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Nếu cho rằng có sự nhầm lẫn, bạn có thể gửi lý do trình bày để Quản trị viên xem xét mở lại tài khoản:
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={2}
                  placeholder="Nhập lý do đề nghị mở khóa (ví dụ: 'Tôi không vi phạm quy định, cần truy cập lại dữ liệu thú cưng...')"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang gửi yêu cầu...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi Yêu Cầu Kháng Nghị / Mở Khóa</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Create New Account or Switch Account Section */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Hoặc sử dụng tài khoản khác:</span>
            
            <button
              onClick={onLogoutAndSwitch}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <UserPlus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Đăng Nhập Tài Khoản Khác / Tạo Tài Khoản Mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
