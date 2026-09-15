import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Image as ImageIcon,
  Loader2,
  FilePlus,
  PawPrint,
  User,
  CheckCircle,
  X,
  Trash2,
  MessageSquare,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Clock,
  Calendar,
  History,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { PetProfile, ChatMessage, UserProfile, ChatSession, TriageLevel, MedicalRecord } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

interface Props {
  pets: PetProfile[];
  selectedPet: PetProfile | null;
  setSelectedPet: (pet: PetProfile | null) => void;
  onNavigateToRecords: () => void;
  onNavigateToPets: () => void;
  currentUser: UserProfile;
}

// Helper to group sessions by date
function groupSessionsByDate(sessions: ChatSession[]): { label: string; sessions: ChatSession[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups: Record<string, ChatSession[]> = {
    'Hôm nay': [],
    'Hôm qua': [],
    'Tuần này': [],
    'Tháng này': [],
    'Trước đó': [],
  };

  for (const session of sessions) {
    const sessionDate = new Date(session.updatedAt || session.createdAt);
    if (sessionDate >= today) {
      groups['Hôm nay'].push(session);
    } else if (sessionDate >= yesterday) {
      groups['Hôm qua'].push(session);
    } else if (sessionDate >= thisWeekStart) {
      groups['Tuần này'].push(session);
    } else if (sessionDate >= thisMonthStart) {
      groups['Tháng này'].push(session);
    } else {
      groups['Trước đó'].push(session);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, sessions: items }));
}

// Helper to format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export const PetChatView: React.FC<Props> = ({
  pets,
  selectedPet,
  setSelectedPet,
  onNavigateToRecords,
  onNavigateToPets,
  currentUser
}) => {
  const { showSuccess, showError } = useNotification();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [editRecordDraft, setEditRecordDraft] = useState<Partial<MedicalRecord> | null>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getWelcomeMsg = (): ChatMessage => ({
    id: 'msg_welcome',
    sender: 'ai',
    text: `Xin chào! Tôi là **PetCare AI Assistant** - Bác sĩ Thú y Trực tuyến hỗ trợ 24/7. 🐾\n\nHãy mô tả chi tiết các triệu chứng hoặc câu hỏi về sức khỏe, dinh dưỡng thú cưng của bạn. Tôi sẽ chẩn đoán ban đầu, đưa ra hướng dẫn sơ cứu và phân loại mức độ nguy hiểm theo **Khung Cảnh Báo 🔴 Đỏ / 🟡 Vàng / 🟢 Xanh**.\n\n*Lưu ý: Nếu cần lưu lại để theo dõi lâu dài, hãy bấm nút **"Lưu hồ sơ bệnh án"** bên dưới.*`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    triageLevel: 'GREEN'
  });

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await api.getChatSessions(currentUser.id, selectedPet?.id);
      setSessions(data);
      if (data.length > 0) {
        setCurrentSessionId(data[0].id);
        setMessages(data[0].messages);
      } else {
        startNewChat();
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
      startNewChat();
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [currentUser.id, selectedPet?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  // Group filtered sessions by date
  const groupedSessions = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions]);

  const promptSuggestions = [
    '🐱 Mèo bị nôn bọt trắng 2 lần sáng nay',
    '🐶 Chó bỏ ăn, lờ đờ và đi tiêu phân lỏng',
    '🚨 Sơ cứu khẩn cấp chó ăn nhầm socola',
    '🥗 Chế độ dinh dưỡng cho mèo bị bệnh thận',
    '🩸 Chó bị chảy máu nướu răng và hôi miệng'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([getWelcomeMsg()]);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setIsMobileHistoryOpen(false);
  };

  const handleDeleteSessionClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(id);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await api.deleteChatSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        startNewChat();
      }
    } catch (e) {
      showError('Xóa thất bại');
    } finally {
      setSessionToDelete(null);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      await api.deleteAllChatSessions(currentUser.id);
      setSessions([]);
      startNewChat();
    } catch (e) {
      showError('Xóa tất cả thất bại');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText,
      imageUrl: selectedImage || undefined,
      petId: selectedPet?.id,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const initialTitle = queryText.length > 30 ? queryText.substring(0, 30) + '...' : queryText;
      
      if (currentUser.id !== 'guest') {
        try {
          const newSession = await api.createChatSession({
            userId: currentUser.id,
            petId: selectedPet?.id || null,
            title: initialTitle,
            messages: newMessages
          });
          activeSessionId = newSession.id;
          setCurrentSessionId(activeSessionId);
          setSessions(prev => [newSession, ...prev]);

          // Generate smart title in the background
          api.generateTitle(queryText).then(async ({ title }) => {
            if (title && activeSessionId) {
               await api.updateChatSession(activeSessionId, { title });
               setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
            }
          }).catch(console.error);
          
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (currentUser.id !== 'guest') {
        try {
          await api.updateChatSession(activeSessionId, { messages: newMessages });
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: newMessages } : s));
        } catch (e) {
          console.error(e);
        }
      }
    }

    try {
      const aiMessageId = `ai_${Date.now()}`;
      let finalText = '';
      let finalTriageLevel: TriageLevel | undefined = undefined;
      let finalTriageDetails: any = null;

      await api.sendChatStream(
        {
          message: queryText,
          petId: selectedPet?.id,
          petInfo: selectedPet,
          imageBase64: imageToSend || undefined,
          history: newMessages
        },
        (chunkText) => {
          setIsLoading(false);
          finalText += chunkText;
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === aiMessageId);
            if (!exists) {
              return [...prev, {
                id: aiMessageId,
                sender: 'ai',
                text: finalText,
                triageLevel: finalTriageLevel,
                triageDetails: finalTriageDetails,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              }];
            }
            return prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: finalText }
                : msg
            );
          });
        },
        (triageLevel, triageDetails) => {
          setIsLoading(false);
          finalTriageLevel = triageLevel;
          finalTriageDetails = triageDetails;
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === aiMessageId);
            if (!exists) {
              return [...prev, {
                id: aiMessageId,
                sender: 'ai',
                text: finalText,
                triageLevel: triageLevel,
                triageDetails: triageDetails,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              }];
            }
            return prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, triageLevel: triageLevel, triageDetails: triageDetails }
                : msg
            );
          });
        }
      );

      // Save the finalized chat history to the current session in the background
      if (activeSessionId) {
        setMessages(prev => {
          const finalMessages = [...prev];
          api.updateChatSession(activeSessionId, { messages: finalMessages }).catch(console.error);
          setSessions(currentSessions => 
            currentSessions.map(s => s.id === activeSessionId ? { ...s, messages: finalMessages } : s)
          );
          return finalMessages;
        });
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Lỗi kết nối**: ${err.message || 'Không thể kết nối tới hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại.'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        triageLevel: 'YELLOW'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMedicalRecord = async () => {
    if (messages.length <= 1) {
      showError('Vui lòng trò chuyện với AI để cung cấp triệu chứng trước khi tạo hồ sơ bệnh án.');
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await api.summarizeMedicalRecordFromChat(selectedPet, messages, currentUser.id);
      if (res.success) {
        setEditRecordDraft(res.record);
      }
    } catch (e) {
      showError('Không thể tổng hợp triệu chứng lúc này. Vui lòng thử lại.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!editRecordDraft) return;
    setIsSavingRecord(true);
    try {
      const savedRecord = await api.createMedicalRecord(editRecordDraft);
      showSuccess(`Đã lưu hồ sơ bệnh án thành công cho thú cưng ${savedRecord.petName}!`);
      setEditRecordDraft(null);
    } catch (e) {
      showError('Lưu hồ sơ bệnh án thất bại. Vui lòng thử lại.');
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Find pet name for a session
  const getPetNameForSession = (session: ChatSession): string | null => {
    if (!session.petId) return null;
    const pet = pets.find(p => p.id === session.petId);
    return pet ? pet.name : null;
  };

  // Render the session list (shared between desktop sidebar and mobile drawer)
  const renderSessionList = () => (
    <>
      {/* Search Input */}
      <div className="px-3 pt-3 pb-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Session Groups */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin space-y-0.5">
        {isLoadingSessions ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-500" />
            <p className="text-xs">Đang tải lịch sử...</p>
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            {searchQuery ? (
              <>
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">Không tìm thấy kết quả</p>
                <p className="text-[10px] mt-1 text-slate-300">Thử từ khóa khác</p>
              </>
            ) : (
              <>
                <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">Chưa có lịch sử trò chuyện</p>
                <p className="text-[10px] mt-1 text-slate-300">Bắt đầu cuộc trò chuyện mới</p>
              </>
            )}
          </div>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label}>
              {/* Date Group Header */}
              <div className="flex items-center gap-1.5 px-2 pt-3 pb-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </span>
                <span className="text-[10px] text-slate-300 ml-auto">
                  {group.sessions.length}
                </span>
              </div>

              {/* Sessions in this group */}
              {group.sessions.map(session => {
                const petName = getPetNameForSession(session);
                const isActive = currentSessionId === session.id;
                const msgCount = session.messages?.filter(m => m.sender === 'user').length || 0;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`group relative flex flex-col gap-1 p-2.5 mx-1 rounded-xl cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-50 border border-emerald-200/80 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {/* Title row */}
                    <div className="flex items-start gap-2">
                      <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-500'
                      }`} />
                      <span className={`text-[13px] font-medium leading-snug line-clamp-2 flex-1 ${
                        isActive ? 'text-emerald-900' : 'text-slate-700'
                      }`}>
                        {session.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSessionClick(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 -mr-0.5 -mt-0.5"
                        title="Xóa đoạn chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Metadata row */}
                    <div className="flex items-center gap-1.5 pl-5.5 ml-[22px]">
                      {petName && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <PawPrint className="w-2.5 h-2.5" />
                          {petName}
                        </span>
                      )}
                      <span className={`text-[10px] flex items-center gap-0.5 ${
                        isActive ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(session.updatedAt || session.createdAt)}
                      </span>
                      {msgCount > 0 && (
                        <span className={`text-[10px] ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                          • {msgCount} tin nhắn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full gap-4 relative">
      {/* Desktop Sidebar for Chat History */}
      {isSidebarOpen && (
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm hidden md:flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex gap-2">
              <button
                onClick={startNewChat}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all text-sm shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Chat Mới
              </button>
              {sessions.length > 0 && (
                <button
                  onClick={() => setIsDeletingAll(true)}
                  title="Xóa tất cả lịch sử chat"
                  className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 border border-slate-200 rounded-xl transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {renderSessionList()}

          {/* Session Count Footer */}
          {sessions.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              {sessions.length} cuộc trò chuyện
            </div>
          )}
        </div>
      )}

      {/* Mobile History Bottom Sheet */}
      {isMobileHistoryOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileHistoryOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh]"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            
            {/* Mobile Sheet Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Lịch sử trò chuyện</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { startNewChat(); setIsMobileHistoryOpen(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mới
                </button>
                <button
                  onClick={() => setIsMobileHistoryOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {renderSessionList()}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Compact Header Toolbar */}
        <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-slate-50/50 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar toggle (desktop) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors hidden md:block"
              title={isSidebarOpen ? "Đóng lịch sử" : "Mở lịch sử"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Mobile History toggle */}
            <button
              onClick={() => setIsMobileHistoryOpen(true)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors md:hidden relative"
              title="Lịch sử chat"
            >
              <History className="w-4 h-4" />
              {sessions.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {sessions.length > 9 ? '9+' : sessions.length}
                </span>
              )}
            </button>

            {selectedPet ? (
              <img
                src={selectedPet.avatarUrl}
                alt={selectedPet.name}
                className="w-8 h-8 rounded-xl object-cover border border-emerald-500 shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <PawPrint className="w-4 h-4" />
              </div>
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {selectedPet ? `Tư Vấn: ${selectedPet.name}` : 'Tư Vấn Chung'}
                </h2>
                {selectedPet && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold hidden sm:inline-block">
                    {selectedPet.species}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight hidden sm:block">
                {selectedPet
                  ? `${selectedPet.breed} | ${selectedPet.age} tháng | ${selectedPet.weight}kg`
                  : 'Chọn thú cưng để tư vấn chính xác hơn.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <select
              value={selectedPet?.id || ''}
              onChange={(e) => {
                const pet = pets.find(p => p.id === e.target.value) || null;
                setSelectedPet(pet);
              }}
              className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 sm:flex-initial"
            >
              <option value="">-- Chọn Thú Cưng --</option>
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateMedicalRecord}
              disabled={isSummarizing || messages.length <= 1}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-2xs whitespace-nowrap transition-all"
            >
              {isSummarizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FilePlus className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Lưu Hồ Sơ</span>
              <span className="sm:hidden">Lưu</span>
            </button>
          </div>
        </div>

        {/* Main Chat Box — ChatGPT Style */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white scrollbar-thin">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (isUser) {
                return (
                  <div key={msg.id} className="py-4 flex justify-end">
                    <div className="max-w-[80%] flex flex-col items-end gap-2">
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Triệu chứng thú cưng"
                          className="max-w-[280px] rounded-2xl border border-slate-200 object-cover shadow-sm"
                        />
                      )}
                      {msg.text && (
                        <div className="bg-slate-100 text-slate-900 rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 pr-1">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              // AI message — full width, clean, ChatGPT style
              const triageTooltip = msg.triageDetails
                ? `${msg.triageDetails.riskTitle}\n${msg.triageDetails.urgency}${
                    msg.triageDetails.immediateActions?.length
                      ? '\n• ' + msg.triageDetails.immediateActions.join('\n• ')
                      : ''
                  }`
                : '';

              return (
                <div key={msg.id} className="group py-6">
                  {/* AI Header: logo + name + triage badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      <img
                        src="/logo.png"
                        alt="PetCare AI"
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">PetCare AI</span>

                    {msg.triageLevel && (
                      <span
                        title={triageTooltip}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full cursor-help select-none ${
                          msg.triageLevel === 'RED'
                            ? 'bg-red-100 text-red-700'
                            : msg.triageLevel === 'YELLOW'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {msg.triageLevel === 'RED' ? '🔴' : msg.triageLevel === 'YELLOW' ? '🟡' : '🟢'}
                        <span className="hidden sm:inline">
                          {msg.triageDetails?.riskTitle || (msg.triageLevel === 'GREEN' ? 'Bình thường' : msg.triageLevel)}
                        </span>
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 ml-auto">{msg.timestamp}</span>
                  </div>

                  {/* AI Content */}
                  <div className="pl-8 markdown-body prose prose-sm max-w-none text-slate-800
                    prose-headings:text-slate-900 prose-headings:font-bold
                    prose-strong:text-slate-900 prose-strong:font-semibold
                    prose-li:marker:text-slate-400
                    prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-emerald-700
                    prose-blockquote:border-emerald-400 prose-blockquote:text-slate-600">
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Triệu chứng thú cưng"
                        className="max-w-[280px] rounded-xl border border-slate-200 mb-4 object-cover shadow-sm"
                      />
                    )}
                    <Markdown>{msg.text}</Markdown>
                  </div>

                  {/* Action buttons — appear on hover */}
                  <div className="pl-8 mt-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.text);
                        setCopiedMsgId(msg.id);
                        setTimeout(() => setCopiedMsgId(null), 2000);
                      }}
                      title="Sao chép"
                      className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {copiedMsgId === msg.id ? (
                        <><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-emerald-600 font-medium">Đã sao chép</span></>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button title="Hữu ích" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button title="Không hữu ích" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Typing dots loading indicator */}
            {isLoading && (
              <div className="py-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                    <img src="/logo.png" alt="PetCare AI" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">PetCare AI</span>
                </div>
                <div className="pl-8 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

          <div className="shrink-0 p-2 sm:p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setInput(prompt);
                  inputRef.current?.focus();
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 whitespace-nowrap transition-all border border-slate-200/60"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Area suggestion prompt list */}

          {selectedImage && (
            <div className="shrink-0 px-3 py-1.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <ImageIcon className="w-4 h-4" />
                <span>Đã đính kèm ảnh</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-red-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="shrink-0 p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm ảnh triệu chứng thú cưng"
              className="p-2.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleCreateMedicalRecord}
              disabled={isSummarizing || messages.length <= 1}
              title={
                messages.length <= 1
                  ? 'Hãy chat với AI trước khi lưu hồ sơ'
                  : 'Lưu Hồ Sơ Bệnh Án từ đoạn chat'
              }
              className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors relative"
            >
              {isSummarizing ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <FilePlus className="w-5 h-5" />
              )}
            </button>

            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                selectedPet
                  ? `Mô tả triệu chứng bệnh của ${selectedPet.name}...`
                  : 'Mô tả triệu chứng, tình trạng bỏ ăn, nôn mửa...'
              }
              className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Gửi AI</span>
            </button>
          </div>
        </div>

      {/* Confirmation Modals */}
      {(sessionToDelete || isDeletingAll) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {isDeletingAll ? 'Xóa tất cả lịch sử' : 'Xóa đoạn chat'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              {isDeletingAll 
                ? 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không? Hành động này không thể hoàn tác.'
                : 'Bạn có chắc chắn muốn xóa đoạn chat này không? Hành động này không thể hoàn tác.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSessionToDelete(null);
                  setIsDeletingAll(false);
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={isDeletingAll ? confirmDeleteAll : confirmDeleteSession}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Edit Medical Record Draft Modal */}
      {editRecordDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-950">Xem & Xác Nhận Hồ Sơ Bệnh Án AI</h3>
              </div>
              <button
                onClick={() => setEditRecordDraft(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 text-xs sm:text-sm overflow-y-auto pr-1">
              <p className="text-slate-500 font-semibold mb-3">
                Dưới đây là thông tin bệnh án được AI tự động tổng hợp từ đoạn chat. Bạn có thể kiểm tra và tùy ý chỉnh sửa lại trước khi lưu trữ chính thức.
              </p>

              {/* Grid 2 Columns for Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tên thú cưng</label>
                  <input
                    type="text"
                    value={editRecordDraft.petName || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, petName: e.target.value } : null)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Loài vật</label>
                  <input
                    type="text"
                    value={editRecordDraft.petSpecies || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, petSpecies: e.target.value } : null)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Mức cảnh báo</label>
                  <select
                    value={editRecordDraft.triageLevel || 'GREEN'}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, triageLevel: e.target.value as any } : null)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="GREEN">🟢 Xanh (An toàn / Nhẹ)</option>
                    <option value="YELLOW">🟡 Vàng (Theo dõi thêm)</option>
                    <option value="RED">🔴 Đỏ (Khẩn cấp / Nguy hiểm)</option>
                  </select>
                </div>
              </div>

              {/* Textareas */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">🩺 Tóm tắt triệu chứng</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.symptomSummary || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, symptomSummary: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">🔬 Chẩn đoán ban đầu</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.diagnosis || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, diagnosis: e.target.value } : null)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed bg-blue-50/20 text-blue-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">💊 Phác đồ điều trị & Sơ cứu</label>
                  <textarea
                    rows={3}
                    value={editRecordDraft.treatmentPlan || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, treatmentPlan: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed bg-emerald-50/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-amber-700 uppercase tracking-wider mb-1">🥗 Chế độ dinh dưỡng & Chăm sóc</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.dietaryAdvice || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, dietaryAdvice: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed bg-amber-50/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-purple-600 uppercase tracking-wider mb-1">📌 Lưu ý tái khám & Theo dõi</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.followUpNotes || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, followUpNotes: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed bg-purple-50/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setEditRecordDraft(null)}
                disabled={isSavingRecord}
                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveMedicalRecord}
                disabled={isSavingRecord}
                className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-2 text-xs"
              >
                {isSavingRecord ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Đang lưu trữ...
                  </>
                ) : (
                  'Xác nhận & Lưu Hồ Sơ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
