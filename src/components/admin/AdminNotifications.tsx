import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, UserCog, CheckCircle, Info, X, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

interface NotificationItem {
  id: string;
  type: 'unlock_request' | 'system_alert' | 'info';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionTab: string;
}

interface AdminNotificationsProps {
  onNavigateToTab: (tab: string) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onNavigateToTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const notifs: NotificationItem[] = [];
    
    // Read persisted states
    const readIds: string[] = JSON.parse(localStorage.getItem('petcare_read_notifs') || '[]');
    const deletedSysIds: string[] = JSON.parse(localStorage.getItem('petcare_deleted_sys_notifs') || '[]');
    
    // 1. Unlock requests
    try {
      const unlockReqs = await api.getUnlockRequests();
      if (Array.isArray(unlockReqs)) {
        unlockReqs.forEach((req: any) => {
          notifs.push({
            id: req.id,
            type: 'unlock_request',
            title: 'Yêu cầu mở khóa tài khoản',
            message: `Người dùng ${req.userEmail} yêu cầu mở khóa: "${req.reason}"`,
            time: new Date(req.createdAt).toLocaleString('vi-VN'),
            isRead: readIds.includes(req.id),
            actionTab: 'admin_users'
          });
        });
      } else {
        console.warn('API did not return an array for unlock requests:', unlockReqs);
      }
    } catch (e) {
      console.error('Error fetching unlock requests:', e);
    }

    // 2. Mock System Alerts
    if (!deletedSysIds.includes('sys_1')) {
      notifs.push({
        id: 'sys_1',
        type: 'system_alert',
        title: 'Cảnh báo bộ nhớ đệm',
        message: 'Dung lượng lưu trữ vector cho RAG đã đạt 80%.',
        time: new Date().toLocaleString('vi-VN'),
        isRead: readIds.includes('sys_1'),
        actionTab: 'admin_config'
      });
    }

    // Sort: System alerts first, then unlock requests (newest first)
    // unlockReqs are already newest-first because we used [newRequest, ...existingRequests]
    // So we just need to ensure the system alert is where we want it (e.g., top)
    const sysAlerts = notifs.filter(n => n.type === 'system_alert');
    const userReqs = notifs.filter(n => n.type === 'unlock_request');
    
    setNotifications([...sysAlerts, ...userReqs]);
  };

  useEffect(() => {
    loadNotifications();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && !e.key.startsWith('petcare_')) return;
      loadNotifications();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('petcare_notifications_updated', () => loadNotifications());

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('petcare_notifications_updated', () => loadNotifications());
    };
  }, []);

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

  const markAsRead = (id: string) => {
    const readIds: string[] = JSON.parse(localStorage.getItem('petcare_read_notifs') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('petcare_read_notifs', JSON.stringify(readIds));
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    loadNotifications();
    setIsOpen(false);
    onNavigateToTab(notif.actionTab);
  };

  const markAllAsRead = () => {
    const readIds: string[] = JSON.parse(localStorage.getItem('petcare_read_notifs') || '[]');
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    localStorage.setItem('petcare_read_notifs', JSON.stringify(readIds));
    loadNotifications();
  };

  const handleDelete = async (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation();
    
    if (notif.type === 'unlock_request') {
      try {
        await api.deleteUnlockRequest(notif.id);
        window.dispatchEvent(new Event('petcare_notifications_updated'));
      } catch (err) {
        console.error('Error deleting unlock request:', err);
      }
    } else {
      const deletedSysIds = JSON.parse(localStorage.getItem('petcare_deleted_sys_notifs') || '[]');
      if (!deletedSysIds.includes(notif.id)) {
        deletedSysIds.push(notif.id);
        localStorage.setItem('petcare_deleted_sys_notifs', JSON.stringify(deletedSysIds));
      }
    }
    
    loadNotifications();
  };

  const clearAllNotifications = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ thông báo?')) {
      // Clear unlock requests via API
      const unlockReqs = notifications.filter(n => n.type === 'unlock_request');
      try {
        await Promise.all(unlockReqs.map(req => api.deleteUnlockRequest(req.id)));
      } catch (err) {
        console.error('Error clearing unlock requests:', err);
      }
      
      const deletedSysIds = JSON.parse(localStorage.getItem('petcare_deleted_sys_notifs') || '[]');
      deletedSysIds.push('sys_1');
      localStorage.setItem('petcare_deleted_sys_notifs', JSON.stringify(deletedSysIds));
      
      window.dispatchEvent(new Event('petcare_notifications_updated'));
      loadNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
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
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  Đánh dấu đã đọc
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[10px] text-red-600 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
                  <li key={notif.id} className="relative group">
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer pr-10 ${
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
                    
                    {/* Delete Notification Button */}
                    <button
                      onClick={(e) => handleDelete(e, notif)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Xóa thông báo"
                    >
                      <X className="w-4 h-4" />
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
