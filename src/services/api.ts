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
  ApiLogLevel,
  AiEvaluationReport
} from '../types';
import { supabase } from './supabaseClient';
import { parseApiKeys, maskApiKey } from '../utils/apiKeys';

/**
 * Secure Authenticated Fetch Helper
 * Automatically injects the active Supabase JWT Bearer token into internal API requests
 * without leaking it to external services.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
  const isInternal = url.startsWith('/') || (typeof window !== 'undefined' && url.startsWith(window.location.origin));
  
  const headers = new Headers(init?.headers);
  if (isInternal) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }
    } catch {
      // Session fetch error - proceed without token
    }
  }
  return fetch(input, { ...init, headers });
}

// test
export const api = {
  // Stats
  getStats: async (timeRange?: string): Promise<SystemStats> => {
    const url = timeRange ? `/api/stats?timeRange=${timeRange}` : '/api/stats';
    const res = await authFetch(url);
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
    const res = await authFetch('/api/health-check');
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
    const res = await authFetch(`/api/keep-alive?service=${encodeURIComponent(service)}`);
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
    const res = await authFetch('/api/test-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Users
  syncGoogleUser: async (payload: { id: string; email: string; name: string; avatar: string }): Promise<UserProfile> => {
    const res = await authFetch('/api/auth/sync', {
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
    try {
      const res = await authFetch('/api/users');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getUsers error:', e);
      return [];
    }
  },

  updateUserStatus: async (id: string, status: 'active' | 'suspended'): Promise<UserProfile> => {
    const res = await authFetch(`/api/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  deleteUser: async (id: string): Promise<void> => {
    await authFetch(`/api/users/${id}`, { method: 'DELETE' });
  },

  // Unlock Requests
  getUnlockRequests: async (): Promise<any[]> => {
    try {
      const res = await authFetch('/api/unlock-requests');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getUnlockRequests error:', e);
      return [];
    }
  },

  createUnlockRequest: async (payload: { userId: string; userEmail: string; reason: string }): Promise<any> => {
    const res = await authFetch('/api/unlock-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  deleteUnlockRequest: async (id: string): Promise<void> => {
    await authFetch(`/api/unlock-requests/${id}`, { method: 'DELETE' });
  },

  // Pets
  getPets: async (userId?: string): Promise<PetProfile[]> => {
    try {
      const url = userId ? `/api/pets?userId=${encodeURIComponent(userId)}` : '/api/pets';
      const res = await authFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getPets error:', e);
      return [];
    }
  },

  createPet: async (pet: Partial<PetProfile>): Promise<PetProfile> => {
    const res = await authFetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pet)
    });
    return res.json();
  },

  updatePet: async (id: string, pet: Partial<PetProfile>): Promise<PetProfile> => {
    const res = await authFetch(`/api/pets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pet)
    });
    return res.json();
  },

  deletePet: async (id: string): Promise<void> => {
    await authFetch(`/api/pets/${id}`, { method: 'DELETE' });
  },

  // Medical Records
  getMedicalRecords: async (petId?: string, userId?: string): Promise<MedicalRecord[]> => {
    try {
      let url = '/api/medical-records';
      const params = new URLSearchParams();
      if (petId) params.append('petId', petId);
      if (userId) params.append('userId', userId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await authFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getMedicalRecords error:', e);
      return [];
    }
  },

  createMedicalRecord: async (record: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    const res = await authFetch('/api/medical-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return res.json();
  },

  getMedicalRecordById: async (id: string): Promise<MedicalRecord> => {
    const res = await authFetch(`/api/medical-records/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy bệnh án');
    return res.json();
  },

  deleteMedicalRecord: async (id: string): Promise<void> => {
    await authFetch(`/api/medical-records/${id}`, { method: 'DELETE' });
  },

  summarizeMedicalRecordFromChat: async (
    petInfo: PetProfile | null,
    chatHistory: ChatMessage[],
    userId?: string
  ): Promise<{ success: boolean; record: MedicalRecord }> => {
    const res = await authFetch('/api/summarize-medical-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petInfo, chatHistory, userId })
    });
    return res.json();
  },

  // Articles (RAG Knowledge)
  getArticles: async (search?: string, category?: string): Promise<KnowledgeArticle[]> => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const res = await authFetch(`/api/articles?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getArticles error:', e);
      return [];
    }
  },

  createArticle: async (article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> => {
    const res = await authFetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    return res.json();
  },

  updateArticle: async (id: string, article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> => {
    const res = await authFetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    return res.json();
  },

  deleteArticle: async (id: string): Promise<void> => {
    await authFetch(`/api/articles/${id}`, { method: 'DELETE' });
  },

  // Vet Clinics
  getClinics: async (search?: string): Promise<VetClinic[]> => {
    try {
      const url = search ? `/api/clinics?search=${encodeURIComponent(search)}` : '/api/clinics';
      const res = await authFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getClinics error:', e);
      return [];
    }
  },


  createClinic: async (clinic: Partial<VetClinic>): Promise<VetClinic> => {
    const res = await authFetch('/api/clinics', {
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
    const res = await authFetch(`/api/clinics/${id}`, {
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
    await authFetch(`/api/clinics/${id}`, { method: 'DELETE' });
  },

  // System Config
  getConfig: async (): Promise<SystemConfig> => {
    const res = await authFetch('/api/config');
    return res.json();
  },

  getSystemConfig: async (): Promise<SystemConfig> => {
    let serverConfig: any = null;
    try {
      const res = await authFetch('/api/config');
      if (res.ok) {
        serverConfig = await res.json();
      }
    } catch {}

    const localStr = typeof window !== 'undefined' ? localStorage.getItem('petcare_fallback_config') : null;
    let local: any = {};
    if (localStr) {
      try { local = JSON.parse(localStr); } catch {}
    }

    const merged: SystemConfig = {
      ...(serverConfig || {}),
      enableGeminiFallback: serverConfig?.enableGeminiFallback ?? local.enableGeminiFallback ?? true,
      fallbackGeminiApiKey: serverConfig?.fallbackGeminiApiKey || local.fallbackGeminiApiKey || serverConfig?.backupGeminiApiKey || '',
      fallbackModel: serverConfig?.fallbackModel || local.fallbackModel || 'gemini-3.6-flash',
      fallbackTimeoutMs: serverConfig?.fallbackTimeoutMs || local.fallbackTimeoutMs || 20000
    };

    return merged;
  },

  updateConfig: async (config: Partial<SystemConfig>): Promise<SystemConfig> => {
    const res = await authFetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  updateSystemConfig: async (config: Partial<SystemConfig>): Promise<SystemConfig> => {
    const res = await authFetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  // Chat Sessions (History)
  getChatSessions: async (userId?: string, petId?: string): Promise<ChatSession[]> => {
    try {
      let url = '/api/chat-sessions';
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (petId) params.append('petId', petId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await authFetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('getChatSessions error:', e);
      return [];
    }
  },


  getChatSessionById: async (id: string): Promise<ChatSession> => {
    const res = await authFetch(`/api/chat-sessions/${id}`);
    return res.json();
  },

  createChatSession: async (session: Partial<ChatSession>): Promise<ChatSession> => {
    const res = await authFetch('/api/chat-sessions', {
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
    const res = await authFetch(`/api/chat-sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    return res.json();
  },

  deleteChatSession: async (id: string): Promise<{ success: boolean }> => {
    const res = await authFetch(`/api/chat-sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Lỗi xóa lịch sử');
    return res.json();
  },

  deleteAllChatSessions: async (userId: string): Promise<{ success: boolean }> => {
    const res = await authFetch(`/api/chat-sessions?userId=${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Lỗi xóa tất cả lịch sử');
    return res.json();
  },

  generateTitle: async (message: string): Promise<{ title: string }> => {
    const res = await authFetch('/api/generate-title', {
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
    userId?: string;
  }): Promise<{
    text: string;
    triageLevel: TriageLevel;
    triageDetails: { riskTitle: string; urgency: string; immediateActions: string[] };
    rawText: string;
  }> => {
    const res = await authFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Bạn đã đạt giới hạn tin nhắn. Vui lòng đăng nhập để tiếp tục sử dụng miễn phí!');
      }
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
      userId?: string;
    },
    onChunk: (text: string) => void,
    onTriage: (triageLevel: TriageLevel, triageDetails: any) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const t0 = Date.now();
    let res: Response;
    try {
      res = await authFetch('/api/chat', {
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
      userId?: string;
    },
    onChunk: (text: string) => void,
    onTriage: (triageLevel: TriageLevel, triageDetails: any) => void,
    onFallback?: (used: boolean) => void,
    signal?: AbortSignal,
    customFallbackConfig?: {
      enabled?: boolean;
      apiKey?: string;
      apiKeys?: string[];
      model?: string;
      timeoutMs?: number;
    },
    onRetry?: (isRetrying: boolean) => void
  ): Promise<void> => {
    const startTime = Date.now();

    // 1. Resolve fallback configuration and gather prioritized API Key pool
    let fallbackModel = customFallbackConfig?.model || 'gemini-3.6-flash';
    let fallbackEnabled = customFallbackConfig?.enabled ?? true;
    const timeoutMs = customFallbackConfig?.timeoutMs ?? (payload.imageBase64 ? 35000 : 20000);

    const keyCandidates: (string | string[] | undefined | null)[] = [
      customFallbackConfig?.apiKeys,
      customFallbackConfig?.apiKey,
    ];

    try {
      const cfg = await api.getSystemConfig();
      if (cfg?.enableGeminiFallback !== undefined) {
        fallbackEnabled = cfg.enableGeminiFallback;
      }
      if (cfg?.fallbackModel) {
        fallbackModel = cfg.fallbackModel;
      } else if (cfg?.aiModel) {
        fallbackModel = cfg.aiModel;
      }

      keyCandidates.push(cfg?.geminiApiKeysPool);
      keyCandidates.push(cfg?.fallbackGeminiApiKey);
      keyCandidates.push(cfg?.backupGeminiApiKey);
      keyCandidates.push(cfg?.geminiApiKey);
    } catch {}

    const legacyModels = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    if (legacyModels.includes(fallbackModel)) {
      fallbackModel = 'gemini-3.1-flash-lite';
    }

    keyCandidates.push((process.env as any).GEMINI_API_KEYS);
    keyCandidates.push(process.env.GEMINI_API_KEY);

    const fallbackApiKeys = parseApiKeys(keyCandidates);

    const callPrimary = async (attemptNum: number): Promise<void> => {
      const controller = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      const onAbort = () => controller.abort();
      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      try {
        await api.sendChatStream(payload, onChunk, onTriage, controller.signal);
      } catch (err: any) {
        if (timedOut && !signal?.aborted) {
          throw new Error(`Máy chủ AI phản hồi quá thời gian (${Math.round(timeoutMs / 1000)}s)`);
        }
        throw err;
      } finally {
        clearTimeout(timeout);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
      }
    };

    // ── ATTEMPT 1: Primary Backend ──
    let primaryFailed = false;
    try {
      await callPrimary(1);
      if (onFallback) onFallback(false);

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
      primaryFailed = true;

      api.writeLog({
        log_type: 'render',
        level: 'warn',
        message: `Máy chủ AI chính phản hồi lỗi (Lần 1): ${err?.message || 'unknown'}. Đang tự động thử lại...`,
        latency_ms: Date.now() - startTime,
        metadata: { error: err?.message, attempt: 1 }
      }).catch(() => {});
    }

    // ── ATTEMPT 2: Auto Retry 1 Time ──
    if (primaryFailed) {
      if (onRetry) onRetry(true);

      try {
        // Wait 1.2s before retrying, checking for user cancel
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 1200);
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new DOMException('Aborted', 'AbortError'));
            }, { once: true });
          }
        });

        await callPrimary(2);
        if (onRetry) onRetry(false);
        if (onFallback) onFallback(false);

        api.writeLog({
          log_type: 'render',
          level: 'info',
          message: `Kết nối lại máy chủ AI chính thành công ở lần 2 (${Date.now() - startTime}ms)`,
          latency_ms: Date.now() - startTime,
          status_code: 200,
          metadata: { messagePreview: payload.message.slice(0, 80), attempt: 2 }
        }).catch(() => {});

        return;
      } catch (retryErr: any) {
        if (onRetry) onRetry(false);
        if (signal?.aborted) throw retryErr;

        api.writeLog({
          log_type: 'render',
          level: 'warn',
          message: `Máy chủ AI chính thất bại lần 2: ${retryErr?.message || 'unknown'}. ${fallbackApiKeys.length > 0 ? `Tự động chuyển sang Gemini Direct Backup (Pool: ${fallbackApiKeys.length} keys)...` : 'Không có Gemini Backup key.'}`,
          latency_ms: Date.now() - startTime,
          metadata: { error: retryErr?.message, attempt: 2, totalKeys: fallbackApiKeys.length }
        }).catch(() => {});

        if (!fallbackEnabled || fallbackApiKeys.length === 0) {
          throw new Error('Đang có lượng lớn người truy cập, vui lòng thử lại sau ít phút.');
        }
      }
    }

    // ── GEMINI DIRECT FALLBACK WITH MULTI-KEY ROTATION ──
    if (onFallback) onFallback(true);
    const fallbackStart = Date.now();

    // Prepare history and system prompt
    const geminiHistory = (payload.history ?? [])
      .filter(m => m.id !== 'msg_welcome' && !m.text.startsWith('⚠️'))
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

    const systemPrompt = `Bạn là Bác sĩ Thú y AI Vethic hỗ trợ 24/7. Trả lời súc tích, thân thiện và chuyên nghiệp bằng tiếng Việt.
LƯU Ý QUAN TRỌNG VỀ ĐỊNH DẠNG:
1. BẮT BUỘC chèn khối Triage Alert ngay đầu phản hồi (tuyệt đối không dùng markdown block xung quanh, viết liền trên 1 dòng):
[[TRIAGE_ALERT]]{"level": "RED" | "YELLOW" | "GREEN", "title": "Tên bệnh hoặc triệu chứng tóm tắt", "urgency": "Mức độ khẩn cấp", "actions": ["Hành động 1", "Hành động 2"]}[[/TRIAGE_ALERT]]
Quy tắc phân loại:
- RED: Cấp cứu nguy kịch, khó thở, xuất huyết, co giật, ngộ độc, chấn thương nặng, hôn mê, hoặc SUY KIỆT CƠ THỂ/GẦY TRƠ XƯƠNG (BCS 1/9).
- YELLOW: Bệnh cần khám thú y sớm, viêm da, nấm, ghẻ, tiêu chảy, nôn mửa, sốt, ngứa, bỏ ăn, đau mắt, gầy ốm.
- GREEN: Tư vấn dinh dưỡng, chăm sóc lông móng, sinh hoạt thường ngày, thể trạng hoàn toàn khỏe mạnh.

NGUYÊN TẮC QUAN SÁT HÌNH ẢNH LÂM SÀNG:
- BẮT BUỘC quan sát trực quan thể trạng toàn thân: Body Condition Score (BCS), độ lộ xương sườn/xương chậu, teo cơ.
- TUYỆT ĐỐI KHÔNG a dua hoặc tin theo lời đùa/mỉa mai của người dùng nếu hình ảnh thực tế cho thấy thú cưng đang bị suy kiệt, gầy trơ xương hay bệnh tật!

2. Sau khối trên, câu trả lời cần SÚC TÍCH, CÔ ĐỌNG (tối đa 200 - 250 từ), sử dụng cú pháp Markdown chuẩn (Heading 3 ###, gạch đầu dòng -, in đậm **...**) chia 3 phần rõ ràng:
### 🩺 Chẩn đoán sơ bộ
Tóm tắt trong 1-2 câu ngắn gọn về nguyên nhân và mức độ nguy hiểm.

### 🩹 Xử lý & Sơ cứu tại nhà
- **Việc nên làm ngay**: [2-3 bước hành động sơ cứu cấp tốc, an toàn]
- **Tuyệt đối tránh**: [Không tự ý dùng thuốc người, không ép ăn uống dồn dập tránh hội chứng nuôi ăn lại...]

### 🚨 Dấu hiệu cần đi thú y gấp
- [3-4 triệu chứng cảnh báo đỏ nguy kịch cần cấp cứu ngay]`;

    const currentParts: any[] = [];
    if (payload.imageBase64) {
      let mimeType = 'image/jpeg';
      const matchMime = payload.imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
      if (matchMime) {
        mimeType = matchMime[1];
      }
      currentParts.push({
        inlineData: {
          mimeType,
          data: payload.imageBase64.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }
    currentParts.push({ text: `${systemPrompt}\n\nCâu hỏi của chủ thú cưng: "${payload.message}"` });

    const body = {
      contents: [...geminiHistory, { role: 'user', parts: currentParts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
    };

    let lastFallbackError: any = null;

    const fallbackCandidates = [...new Set([fallbackModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash'])];

    // Try each key sequentially
    for (let keyIdx = 0; keyIdx < fallbackApiKeys.length; keyIdx++) {
      const activeKey = fallbackApiKeys[keyIdx];
      const masked = maskApiKey(activeKey);
      const keyStart = Date.now();

      for (const targetModel of fallbackCandidates) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${activeKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }
          );

          if (!res.ok || !res.body) {
            const errText = await res.text().catch(() => '');
            if (res.status === 503 || res.status === 404) {
              console.warn(`Direct fallback model ${targetModel} hit ${res.status}, trying next model candidate...`);
              continue;
            }
            throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
          }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let triageSent = false;
        let fullFallbackText = '';
        let isInsideTriage = false;
        let triageBuffer = '';

        const handleFallbackChunk = (chunkText: string) => {
          if (!chunkText) return;
          fullFallbackText += chunkText;

          if (!triageSent) {
            if (!isInsideTriage && fullFallbackText.includes('[[TRIAGE_ALERT]]')) {
              isInsideTriage = true;
            }
            if (isInsideTriage) {
              triageBuffer = fullFallbackText;
              if (triageBuffer.includes('[[/TRIAGE_ALERT]]')) {
                isInsideTriage = false;
                triageSent = true;
                const alertMatch = triageBuffer.match(/\[\[TRIAGE_ALERT\]\]([\s\S]*?)\[\[\/TRIAGE_ALERT\]\]/);
                if (alertMatch && alertMatch[1]) {
                  try {
                    const cleanJsonStr = (alertMatch[1] || '').trim();
                    const parsed = JSON.parse(cleanJsonStr);
                    const level: TriageLevel = (parsed.level === 'RED' || parsed.level === 'YELLOW' || parsed.level === 'GREEN')
                      ? parsed.level
                      : 'YELLOW';
                    onTriage(level, {
                      riskTitle: parsed.title || 'Đánh giá sức khỏe',
                      urgency: parsed.urgency || '',
                      immediateActions: Array.isArray(parsed.actions) ? parsed.actions : []
                    });
                  } catch (e) {
                    console.error('Error parsing Triage Alert from Gemini fallback:', e);
                  }
                }
                const afterTriage = triageBuffer.split('[[/TRIAGE_ALERT]]')[1];
                if (afterTriage && afterTriage.length > 0) {
                  const cleanAfterTriage = afterTriage.replace(/^\s+/, '');
                  if (cleanAfterTriage.length > 0) {
                    onChunk(cleanAfterTriage);
                  }
                }
              }
              return;
            }
          }
          onChunk(chunkText);
        };

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
              if (text) handleFallbackChunk(text);
            } catch {}
          }
        }

        if (!triageSent) {
          onTriage('GREEN', {
            riskTitle: 'Tư vấn sức khỏe',
            urgency: 'Theo dõi thường xuyên',
            immediateActions: ['Theo dõi sát các triệu chứng của thú cưng']
          });
        }

        api.writeLog({
          log_type: 'fallback',
          level: 'info',
          message: `Gemini Fallback thành công bằng Key #${keyIdx + 1}/${fallbackApiKeys.length} (${masked}) (${Date.now() - keyStart}ms, model=${fallbackModel})`,
          latency_ms: Date.now() - fallbackStart,
          status_code: 200,
          metadata: { keyIndex: keyIdx + 1, totalKeys: fallbackApiKeys.length, model: fallbackModel }
        }).catch(() => {});

        return; // Success, exit function
      } catch (err: any) {
        if (signal?.aborted) throw err;
        lastFallbackError = err;

        const hasNextKey = keyIdx + 1 < fallbackApiKeys.length;
        console.warn(`[GEMINI FALLBACK] Key #${keyIdx + 1} (${masked}) thất bại:`, err?.message);

        api.writeLog({
          log_type: 'fallback',
          level: 'warn',
          message: `Gemini Fallback Key #${keyIdx + 1}/${fallbackApiKeys.length} (${masked}) lỗi: ${err?.message || 'unknown'}. ${hasNextKey ? `Đang tự động chuyển sang Key #${keyIdx + 2}...` : 'Đã thử hết toàn bộ danh sách Key dự phòng.'}`,
          latency_ms: Date.now() - keyStart,
          metadata: { keyIndex: keyIdx + 1, totalKeys: fallbackApiKeys.length, error: err?.message }
        }).catch(() => {});
      }
    }
  }

    // All fallback keys failed
    api.writeLog({
      log_type: 'fallback',
      level: 'error',
      message: `Tất cả ${fallbackApiKeys.length} Gemini Backup Key đều không phản hồi. Lỗi cuối: ${lastFallbackError?.message}`,
      latency_ms: Date.now() - fallbackStart,
      metadata: { totalKeys: fallbackApiKeys.length, lastError: lastFallbackError?.message }
    }).catch(() => {});

    throw new Error('Đang có lượng lớn người truy cập, vui lòng thử lại sau ít phút.');
  },

  // Test individual Gemini API Key
  testGeminiKey: async (apiKey: string, model: string = 'gemini-3.6-flash'): Promise<{ ok: boolean; latencyMs?: number; error?: string; message?: string }> => {
    const t0 = Date.now();
    try {
      const legacyModels = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
      let targetModel = model || 'gemini-3.6-flash';
      if (legacyModels.includes(targetModel)) {
        targetModel = 'gemini-3.6-flash';
      }

      const candidates = [...new Set([targetModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash'])];
      let lastErrorMsg = '';

      for (const m of candidates) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Trả lời đúng 1 từ: OK' }] }] }),
              signal: AbortSignal.timeout(10000)
            }
          );
          if (res.ok) {
            return { ok: true, latencyMs: Date.now() - t0, message: `Hoạt động tốt (${m})` };
          }
          const errText = await res.text().catch(() => '');
          let errorMsg = `HTTP ${res.status}`;
          try {
            const json = JSON.parse(errText);
            if (json?.error?.message) errorMsg += `: ${json.error.message}`;
          } catch {
            if (errText) errorMsg += `: ${errText.slice(0, 80)}`;
          }
          lastErrorMsg = errorMsg;
        } catch (e: any) {
          lastErrorMsg = e?.message || 'Không thể kết nối tới Google';
        }
      }
      return { ok: false, latencyMs: Date.now() - t0, error: lastErrorMsg };
    } catch (e: any) {
      return { ok: false, latencyMs: Date.now() - t0, error: e?.message || 'Không thể kết nối tới Google' };
    }
  },

  // Test all keys in an API Key pool
  testGeminiKeyPool: async (keys: string[] | string, model: string = 'gemini-3.6-flash'): Promise<Array<{ key: string; maskedKey: string; ok: boolean; latencyMs?: number; error?: string }>> => {
    const uniqueKeys = parseApiKeys(keys);
    const results = [];
    // Test sequentially to avoid triggering Google's rate limits (429) for burst requests
    for (const k of uniqueKeys) {
      const testRes = await api.testGeminiKey(k, model);
      results.push({
        key: k,
        maskedKey: maskApiKey(k),
        ok: testRes.ok,
        latencyMs: testRes.latencyMs,
        error: testRes.error
      });
      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return results;
  },

  // AI Quality Evaluation & Benchmarking
  getAiEvaluationReport: async (): Promise<AiEvaluationReport> => {
    const res = await authFetch('/api/admin/ai-evaluation');
    if (!res.ok) {
      throw new Error(`Lỗi tải báo cáo kiểm định AI: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  runAiEvaluationTest: async (payload: {
    testType: string;
    inputMessage: string;
    imageBase64?: string;
  }): Promise<any> => {
    const res = await authFetch('/api/admin/ai-evaluation/run-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Lỗi thực thi kiểm định: ${res.statusText}`);
    }
    return res.json();
  }
};
