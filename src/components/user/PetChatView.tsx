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
    'HĂ´m nay': [],
    'HĂ´m qua': [],
    'Tuáº§n nĂ y': [],
    'ThĂ¡ng nĂ y': [],
    'TrÆ°á»›c Ä‘Ă³': [],
  };

  for (const session of sessions) {
    const sessionDate = new Date(session.updatedAt || session.createdAt);
    if (sessionDate >= today) {
      groups['HĂ´m nay'].push(session);
    } else if (sessionDate >= yesterday) {
      groups['HĂ´m qua'].push(session);
    } else if (sessionDate >= thisWeekStart) {
      groups['Tuáº§n nĂ y'].push(session);
    } else if (sessionDate >= thisMonthStart) {
      groups['ThĂ¡ng nĂ y'].push(session);
    } else {
      groups['TrÆ°á»›c Ä‘Ă³'].push(session);
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

  if (diffMins < 1) return 'Vá»«a xong';
  if (diffMins < 60) return `${diffMins} phĂºt trÆ°á»›c`;
  if (diffHours < 24) return `${diffHours} giá» trÆ°á»›c`;
  if (diffDays < 7) return `${diffDays} ngĂ y trÆ°á»›c`;
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

  const getWelcomeMsg = (): ChatMessage => ({
    id: 'msg_welcome',
    sender: 'ai',
    text: `Xin chĂ o! TĂ´i lĂ  **PetCare AI Assistant** - BĂ¡c sÄ© ThĂº y Trá»±c tuyáº¿n há»— trá»£ 24/7. đŸ¾\n\nHĂ£y mĂ´ táº£ chi tiáº¿t cĂ¡c triá»‡u chá»©ng hoáº·c cĂ¢u há»i vá» sá»©c khá»e, dinh dÆ°á»¡ng thĂº cÆ°ng cá»§a báº¡n. TĂ´i sáº½ cháº©n Ä‘oĂ¡n ban Ä‘áº§u, Ä‘Æ°a ra hÆ°á»›ng dáº«n sÆ¡ cá»©u vĂ  phĂ¢n loáº¡i má»©c Ä‘á»™ nguy hiá»ƒm theo **Khung Cáº£nh BĂ¡o đŸ”´ Äá» / đŸŸ¡ VĂ ng / đŸŸ¢ Xanh**.`,
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
    'đŸ± MĂ¨o bá»‹ nĂ´n bá»t tráº¯ng 2 láº§n sĂ¡ng nay',
    'đŸ¶ ChĂ³ bá» Äƒn, lá» Ä‘á» vĂ  Ä‘i tiĂªu phĂ¢n lá»ng',
    'đŸ¨ SÆ¡ cá»©u kháº©n cáº¥p chĂ³ Äƒn nháº§m socola',
    'đŸ¥— Cháº¿ Ä‘á»™ dinh dÆ°á»¡ng cho mĂ¨o bá»‹ bá»‡nh tháº­n',
    'đŸ©¸ ChĂ³ bá»‹ cháº£y mĂ¡u nÆ°á»›u rÄƒng vĂ  hĂ´i miá»‡ng'
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
      showError('XĂ³a tháº¥t báº¡i');
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
      showError('XĂ³a táº¥t cáº£ tháº¥t báº¡i');
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
        abortController.signal
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
      if (err.name === 'AbortError' || abortController.signal.aborted) {
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
        const errMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `â ï¸ **Lá»—i káº¿t ná»‘i**: ${err.message || 'KhĂ´ng thá»ƒ káº¿t ná»‘i tá»›i há»‡ thá»‘ng AI. Vui lĂ²ng kiá»ƒm tra láº¡i máº¡ng hoáº·c thá»­ láº¡i.'}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          triageLevel: 'YELLOW'
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } finally {
      setIsLoading(false);
      setHasReceivedFirstChunk(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleCreateMedicalRecord = async () => {
    if (messages.length <= 1) {
      showError('Vui lĂ²ng trĂ² chuyá»‡n vá»›i AI Ä‘á»ƒ cung cáº¥p triá»‡u chá»©ng trÆ°á»›c khi táº¡o há»“ sÆ¡ bá»‡nh Ă¡n.');
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await api.summarizeMedicalRecordFromChat(selectedPet, messages, currentUser.id);
      if (res.success) {
        setEditRecordDraft(res.record);
      }
    } catch (e) {
      showError('KhĂ´ng thá»ƒ tá»•ng há»£p triá»‡u chá»©ng lĂºc nĂ y. Vui lĂ²ng thá»­ láº¡i.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!editRecordDraft) return;
    setIsSavingRecord(true);
    try {
      const savedRecord = await api.createMedicalRecord(editRecordDraft);
      showSuccess(`ÄĂ£ lÆ°u há»“ sÆ¡ bá»‡nh Ă¡n thĂ nh cĂ´ng cho thĂº cÆ°ng ${savedRecord.petName}!`);
      setEditRecordDraft(null);
    } catch (e) {
      showError('LÆ°u há»“ sÆ¡ bá»‡nh Ă¡n tháº¥t báº¡i. Vui lĂ²ng thá»­ láº¡i.');
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
            placeholder="TĂ¬m kiáº¿m cuá»™c trĂ² chuyá»‡n..."
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
            <p className="text-xs">Äang táº£i lá»‹ch sá»­...</p>
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            {searchQuery ? (
              <>
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">KhĂ´ng tĂ¬m tháº¥y káº¿t quáº£</p>
                <p className="text-[10px] mt-1 text-slate-300">Thá»­ tá»« khĂ³a khĂ¡c</p>
              </>
            ) : (
              <>
                <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">ChÆ°a cĂ³ lá»‹ch sá»­ trĂ² chuyá»‡n</p>
                <p className="text-[10px] mt-1 text-slate-300">Báº¯t Ä‘áº§u cuá»™c trĂ² chuyá»‡n má»›i</p>
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
                        title="XĂ³a Ä‘oáº¡n chat"
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
                          â€¢ {msgCount} tin nháº¯n
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
              Chat Má»›i
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              title="ÄĂ³ng lá»‹ch sá»­"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {renderSessionList()}

          {/* Footer */}
          {sessions.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{sessions.length} cuá»™c trĂ² chuyá»‡n</span>
              <button
                onClick={() => setIsDeletingAll(true)}
                title="XĂ³a táº¥t cáº£"
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
                <h3 className="text-base font-bold text-slate-900">Lá»‹ch sá»­ trĂ² chuyá»‡n</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { startNewChat(); setIsMobileHistoryOpen(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Má»›i
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

        {/* Floating sidebar toggle â€” only when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Má»Ÿ lá»‹ch sá»­ chat"
            className="absolute top-3 left-3 z-30 hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 bg-white shadow-sm transition-all"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* â”€â”€ Shared: hidden file input â”€â”€ */}
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        {messages.filter(m => m.sender === 'user').length === 0 && !isLoading ? (
          /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
             EMPTY STATE â€” input + greeting centered on screen
             â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 gap-6">
            {/* Greeting */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto shadow-md mb-3 overflow-hidden">
                <img src="/logo.png" alt="PetCare AI" className="w-full h-full object-contain p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">ChĂºng ta nĂªn báº¯t Ä‘áº§u tá»« Ä‘Ă¢u?</h2>
              <p className="text-sm text-slate-400">MĂ´ táº£ triá»‡u chá»©ng hoáº·c cĂ¢u há»i vá» sá»©c khá»e thĂº cÆ°ng cá»§a báº¡n.</p>
            </div>

            {/* Centered input bar */}
            <div className="w-full max-w-2xl">
              {selectedImage && (
                <div className="mb-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>ÄĂ£ Ä‘Ă­nh kĂ¨m áº£nh</span>
                  </div>
                  <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-600 p-0.5 rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 shadow-lg px-2 py-1.5">
                <button onClick={() => fileInputRef.current?.click()} title="ÄĂ­nh kĂ¨m áº£nh"
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors flex-shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder={selectedPet ? `MĂ´ táº£ triá»‡u chá»©ng cá»§a ${selectedPet.name}...` : 'MĂ´ táº£ triá»‡u chá»©ng, tĂ¬nh tráº¡ng bá» Äƒn, nĂ´n má»­a...'}
                  className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 py-1.5 px-2"
                />
                <button type="button" onClick={() => handleSend()}
                  disabled={!input.trim() && !selectedImage}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-all flex items-center justify-center shadow-sm cursor-pointer disabled:cursor-not-allowed flex-shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {promptSuggestions.slice(0, 4).map((prompt, idx) => (
                <button key={idx} type="button"
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-xs">
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
             CHAT MODE â€” scrollable messages + floating input bar
             â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
          <>
            {/* Scrollable Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white scrollbar-thin">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {messages.filter(m => m.id !== 'msg_welcome').map((msg, idx) => {
                  const isUser = msg.sender === 'user';

                  if (isUser) {
                    return (
                      <div key={msg.id} className="py-4 flex justify-end">
                        <div className="max-w-[80%] flex flex-col items-end gap-2">
                          {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="Triá»‡u chá»©ng thĂº cÆ°ng"
                              className="max-w-[280px] rounded-2xl border border-slate-200 object-cover shadow-sm" />
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

                  // AI message
                  const triageTooltip = msg.triageDetails
                    ? `${msg.triageDetails.riskTitle}\n${msg.triageDetails.urgency}${
                        msg.triageDetails.immediateActions?.length
                          ? '\nâ€¢ ' + msg.triageDetails.immediateActions.join('\nâ€¢ ')
                          : ''
                      }`
                    : '';

                  return (
                    <div key={msg.id} className="group py-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                          <img src="/logo.png" alt="PetCare AI" className="w-full h-full object-contain p-0.5"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">PetCare AI</span>

                        {msg.triageLevel && (
                          <span title={triageTooltip}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full cursor-help select-none ${
                              msg.triageLevel === 'RED' ? 'bg-red-100 text-red-700'
                              : msg.triageLevel === 'YELLOW' ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                            }`}>
                            {msg.triageLevel === 'RED' ? 'đŸ”´' : msg.triageLevel === 'YELLOW' ? 'đŸŸ¡' : 'đŸŸ¢'}
                            <span className="hidden sm:inline">
                              {msg.triageDetails?.riskTitle || (msg.triageLevel === 'GREEN' ? 'BĂ¬nh thÆ°á»ng' : msg.triageLevel)}
                            </span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 ml-auto">{msg.timestamp}</span>
                      </div>

                      <div className="pl-8 markdown-body prose prose-sm max-w-none text-slate-800
                        prose-headings:text-slate-900 prose-headings:font-bold
                        prose-strong:text-slate-900 prose-strong:font-semibold
                        prose-li:marker:text-slate-400
                        prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                        prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-emerald-700
                        prose-blockquote:border-emerald-400 prose-blockquote:text-slate-600">
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="Triá»‡u chá»©ng thĂº cÆ°ng"
                            className="max-w-[280px] rounded-xl border border-slate-200 mb-4 object-cover shadow-sm" />
                        )}
                        <Markdown>{msg.text}</Markdown>
                        {isLoading && idx === messages.length - 1 && (
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-600 animate-pulse align-middle rounded-xs" />
                        )}
                      </div>

                      <div className="pl-8 mt-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            setCopiedMsgId(msg.id);
                            setTimeout(() => setCopiedMsgId(null), 2000);
                          }}
                          title="Sao chĂ©p"
                          className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          {copiedMsgId === msg.id
                            ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[11px] text-emerald-600 font-medium">ÄĂ£ sao chĂ©p</span></>
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button title="Há»¯u Ă­ch" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button title="KhĂ´ng há»¯u Ă­ch" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Typing dots */}
                {isLoading && !hasReceivedFirstChunk && (
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
                      <span>ÄĂ£ Ä‘Ă­nh kĂ¨m áº£nh</span>
                    </div>
                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-600 p-0.5 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 shadow-md px-2 py-1.5">
                  <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} title="ÄĂ­nh kĂ¨m áº£nh"
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-40 transition-colors flex-shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    ref={inputRef}
                    value={input}
                    disabled={isLoading}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSend(); }}
                    placeholder={
                      isLoading ? 'AI Ä‘ang pháº£n há»“i, vui lĂ²ng chá» hoáº·c báº¥m Dá»«ng...'
                      : selectedPet ? `MĂ´ táº£ triá»‡u chá»©ng bá»‡nh cá»§a ${selectedPet.name}...`
                      : 'MĂ´ táº£ triá»‡u chá»©ng, tĂ¬nh tráº¡ng bá» Äƒn, nĂ´n má»­a...'
                    }
                    className="flex-1 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 disabled:text-slate-400 py-1.5 px-2"
                  />

                  {isLoading ? (
                    <button type="button" onClick={handleStop} title="Dá»«ng"
                      className="p-2 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold transition-all flex items-center gap-1 flex-shrink-0">
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs">Dá»«ng</span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleSend()}
                      disabled={!input.trim() && !selectedImage} title="Gá»­i"
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all flex items-center justify-center shadow-xs cursor-pointer disabled:cursor-not-allowed flex-shrink-0">
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
              {isDeletingAll ? 'XĂ³a táº¥t cáº£ lá»‹ch sá»­' : 'XĂ³a Ä‘oáº¡n chat'}
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              {isDeletingAll 
                ? 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a toĂ n bá»™ lá»‹ch sá»­ trĂ² chuyá»‡n khĂ´ng? HĂ nh Ä‘á»™ng nĂ y khĂ´ng thá»ƒ hoĂ n tĂ¡c.'
                : 'Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n xĂ³a Ä‘oáº¡n chat nĂ y khĂ´ng? HĂ nh Ä‘á»™ng nĂ y khĂ´ng thá»ƒ hoĂ n tĂ¡c.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSessionToDelete(null);
                  setIsDeletingAll(false);
                }}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Há»§y bá»
              </button>
              <button
                onClick={isDeletingAll ? confirmDeleteAll : confirmDeleteSession}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs"
              >
                XĂ¡c nháº­n XĂ³a
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
                <h3 className="text-lg font-black text-slate-950">Xem & XĂ¡c Nháº­n Há»“ SÆ¡ Bá»‡nh Ăn AI</h3>
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
                DÆ°á»›i Ä‘Ă¢y lĂ  thĂ´ng tin bá»‡nh Ă¡n Ä‘Æ°á»£c AI tá»± Ä‘á»™ng tá»•ng há»£p tá»« Ä‘oáº¡n chat. Báº¡n cĂ³ thá»ƒ kiá»ƒm tra vĂ  tĂ¹y Ă½ chá»‰nh sá»­a láº¡i trÆ°á»›c khi lÆ°u trá»¯ chĂ­nh thá»©c.
              </p>

              {/* Grid 2 Columns for Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">TĂªn thĂº cÆ°ng</label>
                  <input
                    type="text"
                    value={editRecordDraft.petName || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, petName: e.target.value } : null)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">LoĂ i váº­t</label>
                  <input
                    type="text"
                    value={editRecordDraft.petSpecies || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, petSpecies: e.target.value } : null)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Má»©c cáº£nh bĂ¡o</label>
                  <select
                    value={editRecordDraft.triageLevel || 'GREEN'}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, triageLevel: e.target.value as any } : null)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="GREEN">đŸŸ¢ Xanh (An toĂ n / Nháº¹)</option>
                    <option value="YELLOW">đŸŸ¡ VĂ ng (Theo dĂµi thĂªm)</option>
                    <option value="RED">đŸ”´ Äá» (Kháº©n cáº¥p / Nguy hiá»ƒm)</option>
                  </select>
                </div>
              </div>

              {/* Textareas */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">đŸ©º TĂ³m táº¯t triá»‡u chá»©ng</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.symptomSummary || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, symptomSummary: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">đŸ”¬ Cháº©n Ä‘oĂ¡n ban Ä‘áº§u</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.diagnosis || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, diagnosis: e.target.value } : null)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed bg-blue-50/20 text-blue-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">đŸ’ PhĂ¡c Ä‘á»“ Ä‘iá»u trá»‹ & SÆ¡ cá»©u</label>
                  <textarea
                    rows={3}
                    value={editRecordDraft.treatmentPlan || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, treatmentPlan: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed bg-emerald-50/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-amber-700 uppercase tracking-wider mb-1">đŸ¥— Cháº¿ Ä‘á»™ dinh dÆ°á»¡ng & ChÄƒm sĂ³c</label>
                  <textarea
                    rows={2}
                    value={editRecordDraft.dietaryAdvice || ''}
                    onChange={(e) => setEditRecordDraft(prev => prev ? { ...prev, dietaryAdvice: e.target.value } : null)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed bg-amber-50/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-purple-600 uppercase tracking-wider mb-1">đŸ“Œ LÆ°u Ă½ tĂ¡i khĂ¡m & Theo dĂµi</label>
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
                Há»§y bá»
              </button>
              <button
                onClick={handleSaveMedicalRecord}
                disabled={isSavingRecord}
                className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-2 text-xs"
              >
                {isSavingRecord ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Äang lÆ°u trá»¯...
                  </>
                ) : (
                  'XĂ¡c nháº­n & LÆ°u Há»“ SÆ¡'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
