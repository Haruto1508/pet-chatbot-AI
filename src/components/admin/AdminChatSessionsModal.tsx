import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Search,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
  User,
  Trash2,
  RefreshCw,
  Filter,
  Copy,
  Check,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatSession, ChatMessage, UserProfile, TriageLevel } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { TriageBadge } from '../common/TriageBadge';

interface AdminChatSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string | null;
  users?: UserProfile[];
}

export const AdminChatSessionsModal: React.FC<AdminChatSessionsModalProps> = ({
  isOpen,
  onClose,
  initialUserId,
  users = []
}) => {
  const { showSuccess, showError } = useNotification();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>(initialUserId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'error' | 'fallback' | 'success'>('all');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // When initialUserId changes or modal opens, sync filter
  useEffect(() => {
    if (isOpen) {
      setSelectedUserFilter(initialUserId || 'all');
      loadAllSessions();
    }
  }, [isOpen, initialUserId]);

  const loadAllSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getChatSessions();
      setSessions(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        if (initialUserId) {
          const userSessions = data.filter(s => s.userId === initialUserId);
          if (userSessions.length > 0) {
            setSelectedSessionId(userSessions[0].id);
          } else {
            setSelectedSessionId(data[0].id);
          }
        } else {
          setSelectedSessionId(data[0].id);
        }
      }
    } catch (e: any) {
      console.error('Error loading chat sessions:', e);
      showError('Không thể tải danh sách phiên trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên hội thoại này không?')) return;
    setDeletingId(id);
    try {
      await api.deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSessionId === id) {
        const remaining = sessions.filter(s => s.id !== id);
        setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      showSuccess('Đã xóa phiên hội thoại thành công');
    } catch (e: any) {
      showError(e.message || 'Lỗi khi xóa phiên hội thoại');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Helper to test if a message had error
  const isMessageError = (msg: ChatMessage) => {
    return msg.status === 'error' || msg.text.startsWith('⚠️') || (msg.errorMessage && msg.errorMessage.length > 0);
  };

  // Helper to test if a message used fallback
  const isMessageFallback = (msg: ChatMessage) => {
    return msg.status === 'fallback';
  };

  // Analyze session messages
  const getSessionStats = (session: ChatSession) => {
    const msgs = session.messages || [];
    let errorCount = 0;
    let fallbackCount = 0;
    let successCount = 0;

    for (const msg of msgs) {
      if (msg.sender === 'ai') {
        if (isMessageError(msg)) {
          errorCount++;
        } else if (isMessageFallback(msg)) {
          fallbackCount++;
        } else {
          successCount++;
        }
      }
    }

    return { total: msgs.length, errorCount, fallbackCount, successCount };
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // User filter
      if (selectedUserFilter === 'guest') {
        if (session.userId !== 'guest' && !session.user?.email.includes('guest')) return false;
      } else if (selectedUserFilter === 'registered') {
        if (session.userId === 'guest' || session.user?.email.includes('guest')) return false;
      } else if (selectedUserFilter !== 'all') {
        if (session.userId !== selectedUserFilter) return false;
      }

      const stats = getSessionStats(session);

      // Status filter
      if (statusFilter === 'error' && stats.errorCount === 0) return false;
      if (statusFilter === 'fallback' && stats.fallbackCount === 0) return false;
      if (statusFilter === 'success' && stats.errorCount > 0) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (session.title || '').toLowerCase().includes(q);
        const userMatch = (session.user?.name || '').toLowerCase().includes(q) || (session.user?.email || '').toLowerCase().includes(q);
        const msgMatch = (session.messages || []).some(m => (m.text || '').toLowerCase().includes(q));
        if (!titleMatch && !userMatch && !msgMatch) return false;
      }

      return true;
    });
  }, [sessions, selectedUserFilter, statusFilter, searchQuery]);

  // Currently selected session
  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || filteredSessions[0] || null;
  }, [sessions, selectedSessionId, filteredSessions]);

  // Overall system stats across loaded sessions
  const overallStats = useMemo(() => {
    let totalMsgs = 0;
    let totalErrors = 0;
    let totalFallbacks = 0;
    let guestSessions = 0;

    for (const s of sessions) {
      if (s.userId === 'guest') guestSessions++;
      const stats = getSessionStats(s);
      totalMsgs += stats.total;
      totalErrors += stats.errorCount;
      totalFallbacks += stats.fallbackCount;
    }

    return {
      totalSessions: sessions.length,
      totalMsgs,
      totalErrors,
      totalFallbacks,
      guestSessions
    };
  }, [sessions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Kiểm Tra Tin Nhắn & Trạng Thái Trò Chuyện (Live Inspector)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Admin Tool
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Theo dõi nhật ký hội thoại của người dùng, kiểm tra tin nhắn thành công, dùng Fallback AI hoặc gặp lỗi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllSessions}
              disabled={loading}
              title="Tải lại danh sách"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              title="Đóng cửa sổ"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Statistics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 py-2.5 bg-slate-100/60 border-b border-slate-200/80 text-xs shrink-0">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <div>
              <span className="text-slate-400 block text-[10px]">Tổng phiên chat</span>
              <strong className="text-slate-800 font-bold">{overallStats.totalSessions}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <User className="w-3.5 h-3.5 text-amber-600" />
            <div>
              <span className="text-slate-400 block text-[10px]">Phiên Khách (Guest)</span>
              <strong className="text-amber-700 font-bold">{overallStats.guestSessions}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <div>
              <span className="text-slate-400 block text-[10px]">Tổng tin nhắn</span>
              <strong className="text-emerald-700 font-bold">{overallStats.totalMsgs}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <span className="text-slate-400 block text-[10px]">Dùng Fallback AI</span>
              <strong className="text-amber-600 font-bold">{overallStats.totalFallbacks}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <div>
              <span className="text-slate-400 block text-[10px]">Tin nhắn có lỗi</span>
              <strong className={overallStats.totalErrors > 0 ? "text-red-600 font-bold" : "text-slate-700 font-bold"}>
                {overallStats.totalErrors}
              </strong>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-200/80 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* User Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả người dùng</option>
                <option value="guest">👤 Khách vãng lai (Guest)</option>
                <option value="registered">👥 Người dùng có tài khoản</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('error')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  statusFilter === 'error'
                    ? 'bg-red-500 text-white shadow-2xs'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Chỉ phiên lỗi ({sessions.filter(s => getSessionStats(s).errorCount > 0).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('fallback')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  statusFilter === 'fallback'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Fallback ({sessions.filter(s => getSessionStats(s).fallbackCount > 0).length})</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, tin nhắn, email..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
        </div>

        {/* Main Content: Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Sessions List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
            <div className="p-3 border-b border-slate-200/70 bg-white/80 flex items-center justify-between text-xs text-slate-500">
              <span>Hiển thị <strong>{filteredSessions.length}</strong> phiên hội thoại</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  Đang tải danh sách hội thoại...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  Không tìm thấy phiên trò chuyện nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const stats = getSessionStats(session);
                  const isSelected = session.id === selectedSession?.id;
                  const isGuest = session.userId === 'guest' || session.user?.email.includes('guest');
                  const sessionUser = session.user;

                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-slate-50/90 border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      {/* User Info Bar */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={sessionUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={sessionUser?.name || 'User'}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {isGuest ? 'Khách (Guest)' : (sessionUser?.name || session.userId)}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          {stats.errorCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 text-red-700 flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" />
                              {stats.errorCount} lỗi
                            </span>
                          ) : stats.fallbackCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                              <Zap className="w-3 h-3" />
                              Fallback
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" />
                              OK
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Session Title */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 flex-1">
                          {session.title || 'Hội thoại không tiêu đề'}
                        </h4>
                        {session.isHiddenFromUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0" title="Đoạn chat này đã được người dùng ẩn/xóa khỏi giao diện cá nhân">
                            Đã ẩn bởi user
                          </span>
                        )}
                      </div>

                      {/* Footer Details */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.updatedAt || session.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </span>
                        <span className="font-medium text-slate-500">
                          {stats.total} tin nhắn
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Inspector */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {selectedSession ? (
              <>
                {/* Session Details Header */}
                <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedSession.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt="User"
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">
                          {selectedSession.title}
                        </h3>
                        {selectedSession.userId === 'guest' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Khách vãng lai (Guest)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Tài khoản: {selectedSession.user?.name || selectedSession.userId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Email: <strong>{selectedSession.user?.email || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Tạo lúc: {new Date(selectedSession.createdAt).toLocaleString('vi-VN')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteSession(selectedSession.id)}
                      disabled={deletingId === selectedSession.id}
                      title="Xóa phiên hội thoại này"
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa phiên</span>
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/30">
                  {selectedSession.messages && selectedSession.messages.length > 0 ? (
                    selectedSession.messages.map((msg, index) => {
                      const isUser = msg.sender === 'user';
                      const isErr = isMessageError(msg);
                      const isFb = isMessageFallback(msg);

                      return (
                        <div
                          key={msg.id || index}
                          className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          {/* Avatar */}
                          <div className="shrink-0">
                            {isUser ? (
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                <User className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs overflow-hidden">
                                <img src="/logo.png" alt="AI" className="w-full h-full object-contain p-0.5" />
                              </div>
                            )}
                          </div>

                          {/* Message Card */}
                          <div className={`flex flex-col min-w-0 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                            {/* Message Metadata Header */}
                            <div className="flex items-center gap-2 mb-1 px-1 text-[11px]">
                              <span className="font-bold text-slate-700">
                                {isUser ? 'Người dùng' : 'Vethic AI'}
                              </span>
                              <span className="text-slate-400">
                                {msg.timestamp || 'N/A'}
                              </span>

                              {/* Status Tag for this Message */}
                              {!isUser && (
                                <>
                                  {isErr ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 shadow-2xs">
                                      <AlertCircle className="w-3 h-3" />
                                      LỖI HỆ THỐNG / AI ERROR
                                    </span>
                                  ) : isFb ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
                                      <Zap className="w-3 h-3" />
                                      BACKUP FALLBACK AI
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                      <CheckCircle className="w-3 h-3" />
                                      THÀNH CÔNG (200 OK)
                                    </span>
                                  )}

                                  {msg.latencyMs && (
                                    <span className="text-slate-400 text-[10px] font-medium">
                                      ⏱️ {(msg.latencyMs / 1000).toFixed(1)}s
                                    </span>
                                  )}

                                  {msg.triageLevel && (
                                    <TriageBadge level={msg.triageLevel} />
                                  )}
                                </>
                              )}

                              {isUser && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Đã gửi
                                </span>
                              )}
                            </div>

                            {/* Attached Image if any */}
                            {msg.imageUrl && (
                              <div className="mb-2 max-w-sm rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <img
                                  src={msg.imageUrl}
                                  alt="Attached"
                                  className="w-full h-auto max-h-60 object-cover"
                                />
                              </div>
                            )}

                            {/* Message Bubble Body */}
                            <div
                              className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs relative group ${
                                isUser
                                  ? 'bg-blue-600 text-white rounded-tr-xs'
                                  : isErr
                                  ? 'bg-red-50 text-red-900 border-2 border-red-300 rounded-tl-xs'
                                  : isFb
                                  ? 'bg-amber-50/80 text-slate-800 border border-amber-200 rounded-tl-xs'
                                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                              }`}
                            >
                              {/* Error Banner Callout if this message experienced an error */}
                              {isErr && (
                                <div className="mb-3 p-2.5 rounded-xl bg-red-100/80 border border-red-300 text-red-800 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold block text-[11px]">Chi tiết lỗi ghi nhận:</span>
                                    <span className="text-[11px] font-mono break-all">
                                      {msg.errorMessage || 'Lỗi kết nối máy chủ AI hoặc vượt hạn ngạch API (429/500)'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="prose prose-xs max-w-none break-words">
                                <Markdown>{msg.text}</Markdown>
                              </div>

                              {/* Message Actions */}
                              <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(msg.text, msg.id || `${index}`)}
                                  className={`p-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors ${
                                    isUser
                                      ? 'hover:bg-blue-700 text-blue-100'
                                      : 'hover:bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {copiedMsgId === (msg.id || `${index}`) ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                                      <span>Đã sao chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Sao chép</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Phiên trò chuyện này không có tin nhắn nào.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-600">Chưa chọn phiên hội thoại</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Chọn một phiên hội thoại từ danh sách bên trái để kiểm tra chi tiết từng tin nhắn và trạng thái lỗi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
