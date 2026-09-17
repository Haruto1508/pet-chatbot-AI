import React, { useState, useEffect } from 'react';
import { Settings, User, Shield, Key, Moon, Check, Save, Database, Trash2, MessageSquare, AlertTriangle, LogOut, Smartphone } from 'lucide-react';
import { UserProfile, ChatSession } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { LogoutConfirmModal } from '../common/LogoutConfirmModal';

interface Props {
  currentUser: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
}

export const AccountSettingsView: React.FC<Props> = ({ currentUser, onUpdateUser }) => {
  const { showSuccess, showError } = useNotification();
  const [userName, setUserName] = useState(currentUser.name);
  const email = currentUser.email;
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  
  // Modal states
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    setUserName(currentUser.name);
  }, [currentUser]);

  const loadSessions = async () => {
    try {
      const data = await api.getChatSessions(currentUser.id);
      setChatSessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Recalculate storage whenever chatSessions changes
  React.useEffect(() => {
    if (chatSessions.length === 0) {
      setStorageInfo({ usage: 0, quota: 500 * 1024 * 1024 }); // Supabase free = 500MB
      return;
    }
    // Calculate total size of all chat session data
    let totalBytes = 0;
    for (const session of chatSessions) {
      totalBytes += new Blob([JSON.stringify(session)]).size;
    }
    setStorageInfo({ usage: totalBytes, quota: 500 * 1024 * 1024 });
  }, [chatSessions]);

  React.useEffect(() => {
    loadSessions();
  }, [currentUser.id]);

  const confirmClearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }
    loadSessions(); // triggers storage recalculation via useEffect
    setShowClearCacheModal(false);
    showSuccess('Đã dọn dẹp bộ nhớ đệm trình duyệt!');
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await api.deleteChatSession(sessionToDelete);
      setChatSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      showSuccess('Đã xóa đoạn chat!');
    } catch (e) {
      showError('Xóa thất bại');
    } finally {
      setSessionToDelete(null);
    }
  };

  const calculateSize = (obj: any) => {
    const str = JSON.stringify(obj);
    const bytes = new Blob([str]).size;
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name: userName });
    showSuccess('Cập nhật thông tin cài đặt thành công!');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Tài Khoản & Cài Đặt</h2>
            <p className="text-xs text-slate-500">
              Thiết lập thông tin cá nhân và quản lý dữ liệu tài khoản.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Cập nhật thông tin cài đặt thành công!
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* User Profile Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-emerald-600" /> Thông Tin Cá Nhân
          </h3>

          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">{currentUser.name}</span>
              <span className="text-xs text-slate-500 block">{currentUser.email}</span>
              <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Họ và Tên</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Google</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>
          </div>
        </div>


        {/* Browser Storage & History Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database className="w-4 h-4 text-blue-600" /> Quản Lý Dữ Liệu & Bộ Nhớ
          </h3>
          
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  Dung lượng lịch sử Chat AI
                  {storageInfo && (storageInfo.usage / storageInfo.quota) > 0.8 && (
                    <span title="Sắp đầy!">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    </span>
                  )}
                </p>
                <p>Dữ liệu đoạn chat được lưu trên Supabase Cloud Database.</p>
              </div>
              
              {storageInfo ? (
                <div className="flex-shrink-0 text-right w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-end gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowClearCacheModal(true)}
                      className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors shadow-xs"
                    >
                      Dọn rác Cache
                    </button>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Đã dùng: {storageInfo.usage < 1024 * 1024
                          ? (storageInfo.usage / 1024).toFixed(2) + ' KB'
                          : (storageInfo.usage / (1024 * 1024)).toFixed(2) + ' MB'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Giới hạn: {(storageInfo.quota / (1024 * 1024)).toFixed(0)} MB
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (storageInfo.usage / storageInfo.quota) > 0.8 ? 'bg-red-500' :
                        (storageInfo.usage / storageInfo.quota) > 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (storageInfo.usage / storageInfo.quota) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Đang tính toán...</div>
              )}
            </div>
            
            {/* Chat History List */}
            <div className="border-t border-slate-200/60 pt-4 mt-2">
              <p className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Danh sách lịch sử chat đã lưu
              </p>
              {chatSessions.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">Không có lịch sử chat nào.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {chatSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 truncate">{session.title || 'Đoạn chat'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex gap-2">
                          <span>{new Date(session.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span className="text-emerald-600 font-medium">{calculateSize(session.messages)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSessionToDelete(session.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                        title="Xóa đoạn chat này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PWA App Install Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Cài Đặt Ứng Dụng
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              PWA Web App
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Logo Web / App Icon */}
              <div className="relative group shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  <img
                    src="/logo.png"
                    alt="Vethic AI Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs ring-2 ring-white">
                  ✓
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-extrabold text-slate-900 text-sm">Vethic AI Assistant</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Ứng Dụng Chính Thức
                  </span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Cài đặt ứng dụng vào màn hình chính để truy cập nhanh chóng, toàn màn hình và hoạt động độc lập như app di động.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const promptEvent = (window as any).deferredPrompt;
                if (promptEvent) {
                  promptEvent.prompt();
                  const { outcome } = await promptEvent.userChoice;
                  if (outcome === 'accepted') {
                    showSuccess('Cảm ơn bạn đã cài đặt ứng dụng!');
                    (window as any).deferredPrompt = null;
                  }
                } else if (window.matchMedia('(display-mode: standalone)').matches) {
                  showSuccess('Ứng dụng đã được cài đặt trên thiết bị của bạn!');
                } else {
                  showError('Trình duyệt của bạn không hỗ trợ cài đặt tự động hoặc ứng dụng đã được cài đặt.');
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" /> Cài Đặt Ngay
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {currentUser.id !== 'guest' ? (
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng Xuất Tài Khoản
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs ml-auto"
          >
            <Save className="w-4 h-4" /> Lưu Thay Đổi
          </button>
        </div>
      </form>

      {/* Logout Confirm Modal */}
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

      {/* Clear Cache Modal */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Dọn Dẹp Cache</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa bộ nhớ đệm của trình duyệt không? Lịch sử chat sẽ KHÔNG bị ảnh hưởng.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearCacheModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmClearCache}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-xs"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Xóa Lịch Sử Chat</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa vĩnh viễn đoạn chat này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteSession}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-xs"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
