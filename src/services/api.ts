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
  ChatSession,
  ApiLog,
  ApiLogType,
  ApiLogLevel
} from '../types';
import { supabase } from './supabaseClient';

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
    const t0 = Date.now();
    let res: Response;
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });
    } catch (fetchErr: any) {
      const msg = fetchErr?.message || 'Không thể kết nối tới máy chủ AI';
      api.writeLog({
        log_type: 'render',
        level: 'error',
        message: `Lỗi fetch /api/chat: ${msg}`,
        status_code: 0,
        latency_ms: Date.now() - t0,
        metadata: { error: msg }
      }).catch(() => {});
      throw new Error(`Lỗi kết nối máy chủ AI: ${msg}`);
    }

    if (!res.ok || !res.body) {
      let errMsg = `Lỗi máy chủ (${res.status})`;
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errJson.error || errJson.details || errMsg;
      } catch {}
      api.writeLog({
        log_type: 'render',
        level: 'error',
        message: `HTTP ${res.status} từ /api/chat: ${errMsg}`,
        status_code: res.status,
        latency_ms: Date.now() - t0,
        metadata: { status: res.status, error: errMsg }
      }).catch(() => {});
      throw new Error(errMsg);
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
  },

  // ─────────────────────────────────────────────
  // API LOGS (via Supabase)
  // ─────────────────────────────────────────────

  getLogs: async (filters?: {
    log_type?: ApiLogType;
    level?: ApiLogLevel;
    limit?: number;
  }): Promise<ApiLog[]> => {
    let query = supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters?.limit ?? 200);

    if (filters?.log_type) query = query.eq('log_type', filters.log_type);
    if (filters?.level) query = query.eq('level', filters.level);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as ApiLog[];
  },

  writeLog: async (log: Omit<ApiLog, 'id' | 'created_at'>): Promise<void> => {
    await supabase.from('api_logs').insert([log]);
  },

  clearLogs: async (log_type?: ApiLogType): Promise<void> => {
    let query = supabase.from('api_logs').delete();
    if (log_type) {
      query = query.eq('log_type', log_type) as any;
    } else {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000') as any;
    }
    await query;
  },

  // ─────────────────────────────────────────────
  // GEMINI DIRECT FALLBACK STREAM
  // ─────────────────────────────────────────────

  sendChatStreamWithFallback: async (
    payload: {
      message: string;
      petId?: string;
      petInfo?: PetProfile | null;
      imageBase64?: string;
      history?: ChatMessage[];
    },
    onChunk: (text: string) => void,
    onTriage: (triageLevel: TriageLevel, triageDetails: any) => void,
    onFallback?: (used: boolean) => void,
    signal?: AbortSignal,
    customFallbackConfig?: {
      enabled: boolean;
      apiKey?: string;
      model?: string;
      timeoutMs?: number;
    }
  ): Promise<void> => {
    const startTime = Date.now();

    // 1. Resolve fallback API key and configuration
    let fallbackApiKey = customFallbackConfig?.apiKey || process.env.GEMINI_API_KEY || '';
    let fallbackModel = customFallbackConfig?.model || 'gemini-2.5-flash';
    let fallbackEnabled = customFallbackConfig?.enabled ?? true;
    const timeoutMs = customFallbackConfig?.timeoutMs ?? (payload.imageBase64 ? 35000 : 20000);

    if (!fallbackApiKey) {
      try {
        const cfg = await api.getSystemConfig();
        if (cfg?.fallbackGeminiApiKey) {
          fallbackApiKey = cfg.fallbackGeminiApiKey;
        } else if (cfg?.backupGeminiApiKey) {
          fallbackApiKey = cfg.backupGeminiApiKey;
        } else if (cfg?.geminiApiKey) {
          fallbackApiKey = cfg.geminiApiKey;
        }
        if (cfg?.fallbackModel) {
          fallbackModel = cfg.fallbackModel;
        } else if (cfg?.aiModel) {
          fallbackModel = cfg.aiModel;
        }
        if (cfg?.enableGeminiFallback !== undefined) {
          fallbackEnabled = cfg.enableGeminiFallback;
        }
      } catch {}
    }

    // Try primary backend first
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      await api.sendChatStream(payload, onChunk, onTriage, controller.signal);
      clearTimeout(timeout);
      if (onFallback) onFallback(false);

      // Log successful chat
      api.writeLog({
        log_type: 'chat',
        level: 'info',
        message: `Chat OK qua Máy Chủ AI chính (${Date.now() - startTime}ms)`,
        latency_ms: Date.now() - startTime,
        status_code: 200,
        metadata: { messagePreview: payload.message.slice(0, 80) }
      }).catch(() => {});

      return;
    } catch (err: any) {
      if (signal?.aborted) throw err;

      // Log primary failure to api_logs
      api.writeLog({
        log_type: 'render',
        level: 'warn',
        message: `Máy chủ AI chính phản hồi lỗi: ${err?.message || 'unknown'}. ${fallbackApiKey ? 'Tự động chuyển sang Gemini Direct Backup...' : 'Chưa cấu hình Gemini Backup key.'}`,
        latency_ms: Date.now() - startTime,
        metadata: { error: err?.message, hasFallbackKey: !!fallbackApiKey }
      }).catch(() => {});

      if (!fallbackEnabled || !fallbackApiKey) {
        throw err;
      }
    }

    // ── GEMINI DIRECT FALLBACK ──
    if (onFallback) onFallback(true);
    const fallbackStart = Date.now();

    try {
      // Build history for Gemini
      const geminiHistory = (payload.history ?? [])
        .filter(m => m.id !== 'msg_welcome' && !m.text.startsWith('⚠️'))
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const systemPrompt = `Bạn là Bác sĩ Thú y AI PetCare hỗ trợ 24/7. Trả lời súc tích, thân thiện và chuyên nghiệp bằng tiếng Việt.
Khi người dùng mô tả triệu chứng bệnh của thú cưng, hãy trình bày rõ ràng:
- **Chẩn đoán sơ bộ**: Nguyên nhân và mức độ nguy hiểm
- **Xử lý & Sơ cứu tại nhà**: Việc nên làm ngay và việc tuyệt đối tránh
- **Dấu hiệu nguy hiểm**: Khi nào cần đưa đi bệnh viện thú y cấp cứu ngay`;

      const currentParts: any[] = [];
      if (payload.imageBase64) {
        currentParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: payload.imageBase64.replace(/^data:image\/\w+;base64,/, '')
          }
        });
      }
      currentParts.push({ text: `${systemPrompt}\n\nCâu hỏi của chủ thú cưng: "${payload.message}"` });

      const body = {
        contents: [...geminiHistory, { role: 'user', parts: currentParts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:streamGenerateContent?alt=sse&key=${fallbackApiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }
      );

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini direct backup HTTP ${res.status}: ${errText.slice(0, 100)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        if (signal?.aborted) { try { await reader.cancel(); } catch {} break; }
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onChunk(text);
          } catch {}
        }
      }

      onTriage('GREEN', { riskTitle: 'Tư vấn AI Backup', urgency: 'Theo dõi thường xuyên', immediateActions: ['Theo dõi sát các triệu chứng của thú cưng'] });

      api.writeLog({
        log_type: 'fallback',
        level: 'info',
        message: `Gemini direct backup thành công (${Date.now() - fallbackStart}ms, model=${fallbackModel})`,
        latency_ms: Date.now() - fallbackStart,
        status_code: 200,
        metadata: { model: fallbackModel }
      }).catch(() => {});

    } catch (err: any) {
      if (signal?.aborted) throw err;
      api.writeLog({
        log_type: 'fallback',
        level: 'error',
        message: `Gemini direct backup thất bại: ${err?.message}`,
        latency_ms: Date.now() - fallbackStart,
        metadata: { error: err?.message }
      }).catch(() => {});
      throw err;
    }
  }
};
