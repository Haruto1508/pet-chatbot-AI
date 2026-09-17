import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Square,
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
  ThumbsDown,
  RotateCcw,
  RefreshCw,
  Download
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
  const { showSuccess, showError, showInfo } = useNotification();
  const [isRetrying, setIsRetrying] = useState(false);
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
  const [hasReceivedFirstChunk, setHasReceivedFirstChunk] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus input on mount & abort on unmount
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleDownloadMarkdown = (text: string, title?: string) => {
    const cleanTitle = (title || 'tu-van-petcare')
      .toLowerCase()
      .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s-]/g, '')
      .replace(/\s+/g, '-');
    const filename = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.md`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Đã tải câu trả lời về máy dưới dạng file .md!');
  };

  const getWelcomeMsg = (): ChatMessage => ({
    id: 'msg_welcome',
    sender: 'ai',
    text: `Xin chào! Tôi là **PetCare AI Assistant** - Bác sĩ Thú y Trực tuyến hỗ trợ 24/7. 🐾\n\nHãy mô tả chi tiết các triệu chứng hoặc câu hỏi về sức khỏe, dinh dưỡng thú cưng của bạn. Tôi sẽ chẩn đoán ban đầu, đưa ra hướng dẫn sơ cứu và phân loại mức độ nguy hiểm theo **Khung Cảnh Báo 🔴 Đỏ / 🟡 Vàng / 🟢 Xanh**.`,
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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setHasReceivedFirstChunk(false);
    inputRef.current?.focus();
  };

  const handleSend = async (textToSend?: string) => {
    if (isLoading) return; // Prevent sending while generating
    const queryText = textToSend || input;
    if (!queryText.trim() && !selectedImage) return;

    // Abort any previous call if still open
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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
    setHasReceivedFirstChunk(false);

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

    const aiMessageId = `ai_${Date.now()}`;

    try {
      let finalText = '';
      let finalTriageLevel: TriageLevel | undefined = undefined;
      let finalTriageDetails: any = null;

      await api.sendChatStreamWithFallback(
        {
          message: queryText,
          petId: selectedPet?.id,
          petInfo: selectedPet,
          imageBase64: imageToSend || undefined,
          history: newMessages
        },
        (chunkText) => {
          setHasReceivedFirstChunk(true);
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
        },
        (usedFallback) => {
          if (usedFallback) {
            console.info('Using Gemini Direct Backup');
          }
        },
        abortController.signal,
        undefined,
        (retrying) => {
          setIsRetrying(retrying);
          if (retrying) {
            showInfo('Đang cố gắng kết nối lại...');
            finalText = '';
            setHasReceivedFirstChunk(false);
            setMessages(prev => prev.filter(m => m.id !== aiMessageId));
          }
        }
      );

      // Save the finalized chat history to the current session in the background
      if (activeSessionId && finalText.trim()) {
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
      // ONLY treat as voluntary stop if the user explicitly clicked Stop button
      if (abortController.signal.aborted) {
        // User voluntarily stopped response - preserve partial response in chat history
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
      } else {
        const isTimeout = err?.name === 'AbortError' || err?.message?.toLowerCase().includes('timeout') || err?.message?.toLowerCase().includes('quá thời gian');
        const errorText = isTimeout
          ? 'Máy chủ phản hồi quá lâu hoặc mất kết nối. Vui lòng thử lại hoặc tải lại trang.'
          : (err?.message || 'Lưu lượng truy cập quá lớn, vui lòng tải lại trang.');

        const errMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **${errorText}**`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          triageLevel: 'YELLOW'
        };

        // Ensure error message is added and persisted into the active chat session
        setMessages(prev => {
          const cleaned = prev.filter(m => m.id !== aiMessageId);
          const updatedWithErr = [...cleaned, errMsg];
          if (activeSessionId) {
            api.updateChatSession(activeSessionId, { messages: updatedWithErr }).catch(console.error);
            setSessions(currentSessions => 
              currentSessions.map(s => s.id === activeSessionId ? { ...s, messages: updatedWithErr } : s)
            );
          }
          return updatedWithErr;
        });

        showError(errorText);

        // Always log this to api_logs so Admin Log Viewer displays it!
        api.writeLog({
          log_type: 'chat',
          level: 'error',
          message: errorText,
          metadata: { query: queryText.slice(0, 80), error: err?.message || err?.name }
        }).catch(() => {});
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
      setHasReceivedFirstChunk(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
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
    <div className="flex h-full w-full">
      {/* Desktop Sidebar for Chat History */}
      {isSidebarOpen && (
        <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-3 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all text-xs shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              Chat Mới
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              title="Đóng lịch sử"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {renderSessionList()}

          {/* Footer */}
          {sessions.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{sessions.length} cuộc trò chuyện</span>
              <button
                onClick={() => setIsDeletingAll(true)}
                title="Xóa tất cả"
                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
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
      <div className="flex-1 min-w-0 flex flex-col h-full w-full bg-white overflow-hidden relative">

        {/* Floating sidebar toggle — only when sidebar is closed on desktop */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Mở lịch sử chat"
            className="absolute top-3 left-3 z-30 hidden lg:flex w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 items-center justify-center border border-slate-200/60 shadow-xs transition-all cursor-pointer"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}

        {/* Top Right Actions: Mobile History & New Chat */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
          <button
            onClick={() => setIsMobileHistoryOpen(true)}
            title="Lịch sử chat"
            className="md:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 flex items-center justify-center border border-slate-200/60 shadow-xs transition-all cursor-pointer"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={startNewChat}
            title="Cuộc trò chuyện mới"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 flex items-center justify-center border border-slate-200/60 shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* ── Shared: hidden file input ── */}
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        {messages.filter(m => m.sender === 'user').length === 0 && !isLoading ? (
          /* ══════════════════════════════════════════════════════════════════════
             EMPTY STATE — input + greeting centered on screen
             ══════════════════════════════════════════════════════════════════════ */
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 gap-6">
            {/* Greeting (Image 1 style) */}
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
                Chúng ta nên bắt đầu từ đâu?
              </h2>
            </div>

            {/* Centered input bar */}
            <div className="w-full max-w-2xl">
              {selectedImage && (
                <div className="mb-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Đã đính kèm ảnh</span>
                  </div>
                  <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-600 p-0.5 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white rounded-2xl sm:rounded-full border border-slate-200/90 shadow-md hover:shadow-lg transition-all px-3 py-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Đính kèm ảnh"
                  className="p-2 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder={selectedPet ? `Hỏi về triệu chứng của ${selectedPet.name}...` : 'Hỏi bất kỳ điều gì về thú cưng của bạn...'}
                  className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 py-1 px-1"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() && !selectedImage}
                  title="Gửi"
                  className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-all flex items-center justify-center shadow-xs cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick suggestion items */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 w-full max-w-2xl px-2">
              {promptSuggestions.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-xs font-medium px-4 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 transition-all text-left flex items-center gap-2.5 shadow-2xs cursor-pointer"
                >
                  <span className="text-sm">{prompt.slice(0, 2)}</span>
                  <span className="truncate">{prompt.slice(2).trim()}</span>
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ══════════════════════════════════════════════════════════════════════
             CHAT MODE — scrollable messages + floating input bar
             ══════════════════════════════════════════════════════════════════════ */
          <>
        {/* Scrollable Messages — full height */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white scrollbar-thin">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-32">
            {messages.filter(m => m.id !== 'msg_welcome').map((msg, idx) => {
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
                  <div className="pl-8 markdown-body text-slate-800">
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Triệu chứng thú cưng"
                        className="max-w-[280px] rounded-xl border border-slate-200 mb-4 object-cover shadow-sm"
                      />
                    )}
                    <Markdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-medium hover:text-emerald-700" />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
                            <table {...props} className="w-full text-xs border-collapse" />
                          </div>
                        )
                      }}
                    >
                      {msg.text}
                    </Markdown>
                    {isLoading && idx === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
                    )}
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
                      className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedMsgId === msg.id ? (
                        <><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-emerald-600 font-medium">Đã sao chép</span></>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadMarkdown(msg.text, msg.triageDetails?.riskTitle)}
                      title="Tải câu trả lời về file .md"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button title="Hữu ích" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button title="Không hữu ích" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Typing dots loading indicator */}
            {isLoading && !hasReceivedFirstChunk && (
              <div className="py-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                    <img src="/logo.png" alt="PetCare AI" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">PetCare AI</span>
                  {isRetrying && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      Đang cố gắng kết nối lại...
                    </span>
                  )}
                </div>
                <div className="pl-8 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-36" />
          </div>
        </div>
            {/* Floating Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-3">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {selectedImage && (
                  <div className="mb-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-emerald-800">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Đã đính kèm ảnh</span>
                    </div>
                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-600 p-0.5 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white rounded-2xl sm:rounded-full border border-slate-200 shadow-md px-2.5 py-1.5">
                  <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} title="Đính kèm ảnh"
                    className="p-2 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-40 transition-colors flex-shrink-0 cursor-pointer">
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    ref={inputRef}
                    value={input}
                    disabled={isLoading}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSend(); }}
                    placeholder={
                      isRetrying ? 'Đang cố gắng kết nối lại...'
                      : isLoading ? 'AI đang phản hồi, vui lòng chờ hoặc bấm Dừng...'
                      : selectedPet ? `Mô tả triệu chứng bệnh của ${selectedPet.name}...`
                      : 'Mô tả triệu chứng, tình trạng bỏ ăn, nôn mửa...'
                    }
                    className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 disabled:text-slate-400 py-1.5 px-2"
                  />

                  {isLoading ? (
                    <button type="button" onClick={handleStop} title="Dừng"
                      className="p-2 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer">
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs">Dừng</span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleSend()}
                      disabled={!input.trim() && !selectedImage} title="Gửi"
                      className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center shadow-xs cursor-pointer disabled:cursor-not-allowed flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
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
