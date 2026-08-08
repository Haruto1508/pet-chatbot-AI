import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, UserCog, CheckCircle, Info } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'unlock_request' | 'system_alert' | 'info';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionTab: string; // The tab to route to
}

interface AdminNotificationsProps {
  onNavigateToTab: (tab: string) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onNavigateToTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load notifications from local storage and mock system alerts
    const loadNotifications = () => {
      const notifs: NotificationItem[] = [];
      
      // 1. Unlock requests
      try {
        const unlockReqs = JSON.parse(localStorage.getItem('petcare_unlock_requests') || '[]');
        unlockReqs.forEach((req: any) => {
          notifs.push({
            id: req.id,
            type: 'unlock_request',
            title: 'Yêu cầu mở khóa tài khoản',
            message: `Người dùng ${req.userEmail} yêu cầu mở khóa: "${req.reason}"`,
            time: req.createdAt,
            isRead: false,
            actionTab: 'admin_users'
          });
        });
      } catch (e) {
        console.error(e);
      }

      // 2. Mock System Alerts
      notifs.push({
        id: 'sys_1',
        type: 'system_alert',
        title: 'Cảnh báo bộ nhớ đệm',
        message: 'Dung lượng lưu trữ vector cho RAG đã đạt 80%.',
        time: new Date().toLocaleString('vi-VN'),
        isRead: false,
        actionTab: 'admin_config'
      });

      // Sort by newest first (assuming IDs with timestamp or just simple reverse)
      setNotifications(notifs.reverse());
    };

    loadNotifications();

    // Listen for storage changes if in same window (for demo purposes)
    const handleStorageChange = () => loadNotifications();
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event to refresh when new unlock request is submitted
    window.addEventListener('petcare_notifications_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('petcare_notifications_updated', handleStorageChange);
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    onNavigateToTab(notif.actionTab);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        title="Thông báo hệ thống"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800">Thông báo quản trị</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded-lg transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Không có thông báo mới</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 ${
                        !notif.isRead ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'unlock_request' && (
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <UserCog className="w-4 h-4" />
                          </div>
                        )}
                        {notif.type === 'system_alert' && (
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                        )}
                        {notif.type === 'info' && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                          {notif.time}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2"></div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
