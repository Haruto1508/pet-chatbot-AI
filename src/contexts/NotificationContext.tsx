import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  type: NotificationType;
  message: string;
  visible: boolean;
}

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    setNotification({ type, message, visible: true });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification((prev) => (prev ? { ...prev, visible: false } : null));
    }, 3000);
  }, []);

  const showSuccess = useCallback((message: string) => showNotification('success', message), [showNotification]);
  const showError = useCallback((message: string) => showNotification('error', message), [showNotification]);
  const showInfo = useCallback((message: string) => showNotification('info', message), [showNotification]);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      
      {/* Toast UI */}
      {notification && notification.visible && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up transition-all duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : notification.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : notification.type === 'info' ? (
              <AlertCircle className="w-5 h-5 text-blue-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium pr-2">{notification.message}</span>
            <button
              onClick={() => setNotification((prev) => (prev ? { ...prev, visible: false } : null))}
              className={`cursor-pointer p-1 rounded-full transition-colors ${
                notification.type === 'success'
                  ? 'hover:bg-emerald-100 text-emerald-600'
                  : notification.type === 'info'
                  ? 'hover:bg-blue-100 text-blue-600'
                  : 'hover:bg-red-100 text-red-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
