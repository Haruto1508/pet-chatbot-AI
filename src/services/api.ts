import {
  UserProfile,
  PetProfile,
  ChatMessage,
  MedicalRecord,
  KnowledgeArticle,
  VetClinic,
  SystemConfig,
  SystemStats,
  TriageLevel,
  ChatSession
} from '../types';

export const api = {
  // Stats
  getStats: async (timeRange?: string): Promise<SystemStats> => {
    const url = timeRange ? `/api/stats?timeRange=${timeRange}` : '/api/stats';
    const res = await fetch(url);
    return res.json();
  },

  // Health / Connection Check
  checkHealth: async (): Promise<{
    supabase: { status: string; latencyMs: number | null; message: string; url?: string };
    render: { status: string; latencyMs: number | null; message: string; url: string };
    gemini: { status: string; message: string; keyPreview: string | null; source?: string };
    activeConfig: { status: string; aiModel: string; temperature: number; lastUpdated?: string; source: string; apiProvider?: string; autoKeepAliveInterval?: number };
    envVars: { SUPABASE_URL: boolean; SUPABASE_ANON_KEY: boolean; GEMINI_API_KEY: boolean; NODE_ENV: string; VERCEL: boolean };
    totalLatencyMs: number;
    checkedAt: string;
  }> => {
    const res = await fetch('/api/health-check');
    return res.json();
  },

  // Keep-Alive & Wake-Up Ping
  pingKeepAlive: async (service: string = 'all'): Promise<{
    status: string;
    totalLatencyMs: number;
    timestamp: string;
    services: Record<string, {
      name: string;
      target: string;
      status: string;
      latencyMs: number;
      message: string;
      statusCode?: number;
    }>;
  }> => {
    const res = await fetch(`/api/keep-alive?service=${encodeURIComponent(service)}`);
    return res.json();
  },

  // Test API Key validity
  testApiKey: async (data: { apiKey: string; model?: string; provider?: string; customBaseUrl?: string }): Promise<{
    ok: boolean;
    latencyMs?: number;
    model?: string;
    responsePreview?: string;
    message?: string;
    error?: string;
  }> => {
    const res = await fetch('/api/test-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Users
  syncGoogleUser: async (payload: { id: string; email: string; name: string; avatar: string }): Promise<UserProfile> => {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error('Failed to sync user');
    }
    return res.json();
  },

  getUsers: async (): Promise<UserProfile[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },

  updateUserStatus: async (id: string, status: 'active' | 'suspended'): Promise<UserProfile> => {
    const res = await fetch(`/api/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  deleteUser: async (id: string): Promise<void> => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  },

  // Unlock Requests
  getUnlockRequests: async (): Promise<any[]> => {
    const res = await fetch('/api/unlock-requests');
    return res.json();
  },

  createUnlockRequest: async (payload: { userId: string; userEmail: string; reason: string }): Promise<any> => {
    const res = await fetch('/api/unlock-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  deleteUnlockRequest: async (id: string): Promise<void> => {
    await fetch(`/api/unlock-requests/${id}`, { method: 'DELETE' });
  },

  // Pets
  getPets: async (userId?: string): Promise<PetProfile[]> => {
    const url = userId ? `/api/pets?userId=${userId}` : '/api/pets';
    const res = await fetch(url);
    return res.json();
  },

  createPet: async (pet: Partial<PetProfile>): Promise<PetProfile> => {
    const res = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pet)
    });
    return res.json();
  },

  updatePet: async (id: string, pet: Partial<PetProfile>): Promise<PetProfile> => {
    const res = await fetch(`/api/pets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pet)
    });
    return res.json();
  },

  deletePet: async (id: string): Promise<void> => {
    await fetch(`/api/pets/${id}`, { method: 'DELETE' });
  },

  // Medical Records
  getMedicalRecords: async (petId?: string, userId?: string): Promise<MedicalRecord[]> => {
    let url = '/api/medical-records';
    const params = new URLSearchParams();
    if (petId) params.append('petId', petId);
    if (userId) params.append('userId', userId);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    return res.json();
  },

  createMedicalRecord: async (record: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    const res = await fetch('/api/medical-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return res.json();
  },

  getMedicalRecordById: async (id: string): Promise<MedicalRecord> => {
    const res = await fetch(`/api/medical-records/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy bệnh án');
    return res.json();
  },

  deleteMedicalRecord: async (id: string): Promise<void> => {
    await fetch(`/api/medical-records/${id}`, { method: 'DELETE' });
  },

  summarizeMedicalRecordFromChat: async (
    petInfo: PetProfile | null,
    chatHistory: ChatMessage[],
    userId?: string
  ): Promise<{ success: boolean; record: MedicalRecord }> => {
    const res = await fetch('/api/summarize-medical-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petInfo, chatHistory, userId })
    });
    return res.json();
  },

  // Articles (RAG Knowledge)
  getArticles: async (search?: string, category?: string): Promise<KnowledgeArticle[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const res = await fetch(`/api/articles?${params.toString()}`);
    return res.json();
  },

  createArticle: async (article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> => {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    return res.json();
  },

  updateArticle: async (id: string, article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> => {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    return res.json();
  },

  deleteArticle: async (id: string): Promise<void> => {
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
  },

  // Vet Clinics
  getClinics: async (search?: string): Promise<VetClinic[]> => {
    const url = search ? `/api/clinics?search=${encodeURIComponent(search)}` : '/api/clinics';
    const res = await fetch(url);
    if (!res.ok) {
      console.error(await res.text());
      return [];
    }
    return res.json();
  },

  createClinic: async (clinic: Partial<VetClinic>): Promise<VetClinic> => {
    const res = await fetch('/api/clinics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinic)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Lỗi thêm phòng khám');
    }
    return res.json();
  },

  updateClinic: async (id: string, clinic: Partial<VetClinic>): Promise<VetClinic> => {
    const res = await fetch(`/api/clinics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinic)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Lỗi cập nhật phòng khám');
    }
    return res.json();
  },

  deleteClinic: async (id: string): Promise<void> => {
    await fetch(`/api/clinics/${id}`, { method: 'DELETE' });
  },

  // System Config
  getConfig: async (): Promise<SystemConfig> => {
    const res = await fetch('/api/config');
    return res.json();
  },

  getSystemConfig: async (): Promise<SystemConfig> => {
    const res = await fetch('/api/config');
    return res.json();
  },

  updateConfig: async (config: Partial<SystemConfig>): Promise<SystemConfig> => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  updateSystemConfig: async (config: Partial<SystemConfig>): Promise<SystemConfig> => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  // Chat Sessions (History)
  getChatSessions: async (userId?: string, petId?: string): Promise<ChatSession[]> => {
    let url = '/api/chat-sessions';
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (petId) params.append('petId', petId);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    return res.json();
  },

  getChatSessionById: async (id: string): Promise<ChatSession> => {
    const res = await fetch(`/api/chat-sessions/${id}`);
    return res.json();
  },

  createChatSession: async (session: Partial<ChatSession>): Promise<ChatSession> => {
    const res = await fetch('/api/chat-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Lỗi hệ thống');
    }
    return res.json();
  },

  updateChatSession: async (id: string, session: Partial<ChatSession>): Promise<ChatSession> => {
    const res = await fetch(`/api/chat-sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    return res.json();
  },

  deleteChatSession: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/chat-sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Lỗi xóa lịch sử');
    return res.json();
  },

  deleteAllChatSessions: async (userId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/chat-sessions?userId=${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Lỗi xóa tất cả lịch sử');
    return res.json();
  },

  generateTitle: async (message: string): Promise<{ title: string }> => {
    const res = await fetch('/api/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) return { title: 'Phiên khám mới' };
    return res.json();
  },

  // Gemini Chat
  sendChatMessage: async (payload: {
    message: string;
    petId?: string;
    petInfo?: PetProfile | null;
    imageBase64?: string;
    history?: ChatMessage[];
  }): Promise<{
    text: string;
    triageLevel: TriageLevel;
    triageDetails: { riskTitle: string; urgency: string; immediateActions: string[] };
    rawText: string;
  }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error('Lỗi kết nối máy chủ AI');
    }
    return res.json();
  },

  sendChatStream: async (
    payload: {
      message: string;
      petId?: string;
      petInfo?: PetProfile | null;
      imageBase64?: string;
      history?: ChatMessage[];
    },
    onChunk: (text: string) => void,
    onTriage: (triageLevel: TriageLevel, triageDetails: any) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok || !res.body) {
      throw new Error('Lỗi kết nối máy chủ AI');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          try { await reader.cancel(); } catch {}
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'triage') {
                onTriage(data.triageLevel, data.triageDetails);
              } else if (data.type === 'chunk') {
                onChunk(data.text);
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Lỗi server');
              }
            } catch (e: any) {
              if (e.message !== 'Lỗi server' && !line.includes('"type":"error"')) {
                 console.error('Error parsing SSE data:', e, line);
              } else {
                 throw e; // rethrow the actual API error to be caught by the caller
              }
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError' || signal?.aborted) {
        try { await reader.cancel(); } catch {}
        return;
      }
      throw e;
    }
  }
};
