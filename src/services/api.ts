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
  PaginatedLogsResponse,
  AiEvaluationReport
} from '../types';
import { supabase } from './supabaseClient';
import { parseApiKeys, maskApiKey } from '../utils/apiKeys';
import { decryptPayload } from '../utils/cryptoPayload';

/**
 * Secure Authenticated Fetch Helper
 * Automatically injects the active Supabase JWT Bearer token into internal API requests
 * without leaking it to external services.
 * Automatically decrypts any encrypted payload ({ __enc: true, payload: "..." }).
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
  const res = await fetch(input, { ...init, headers });
  if (isInternal) {
    const originalJson = res.json.bind(res);
    res.json = async () => {
      const body = await originalJson();
      if (body && typeof body === 'object' && (body as any).__enc && (body as any).payload) {
        return decryptPayload((body as any).payload);
      }
      return body;
    };
  }
  return res;
}

// test
export const api = {
  // Stats
  getStats: async (timeRange?: string): Promise<SystemStats> => {
    const url = timeRange ? `/api/stats?timeRange=${timeRange}` : '/api/stats';
    const res = await authFetch(url);
    return res.json();
  },

  // Guest Quota & Machine Rate Limits
  getGuestQuota: async (): Promise<{ messageCount: number; maxLimit: number; remaining: number }> => {
    try {
      const res = await authFetch('/api/guest-quota');
      if (!res.ok) return { messageCount: 0, maxLimit: 8, remaining: 8 };
      return res.json();
    } catch {
      return { messageCount: 0, maxLimit: 8, remaining: 8 };
    }
  },

  resetGuestQuota: async (ip?: string): Promise<void> => {
    const url = ip ? `/api/guest-rate-limits?ip=${encodeURIComponent(ip)}` : '/api/guest-rate-limits';
    await authFetch(url, { method: 'DELETE' });
  },

  // Maintenance Status Check
  getMaintenanceStatus: async (): Promise<{ maintenanceMode: boolean; message: string }> => {
    try {
      const res = await authFetch('/api/maintenance-status');
      if (!res.ok) return { maintenanceMode: false, message: '' };
      return res.json();
    } catch {
      return { maintenanceMode: false, message: '' };
    }
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

  updateUserRole: async (id: string, role: 'user' | 'subadmin'): Promise<UserProfile> => {
    const res = await authFetch(`/api/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
      throw new Error(err.error || 'Cập nhật role thất bại');
    }
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
      if (userId === 'guest') return [];
      // Clean query: Do not leak userId in URL for authenticated user
      const url = (userId && userId !== 'guest' && userId !== 'user_01')
        ? `/api/pets?userId=${encodeURIComponent(userId)}`
        : '/api/pets';
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
      if (userId === 'guest') return [];
      let url = '/api/medical-records';
      const params = new URLSearchParams();
      if (petId) params.append('petId', petId);
      if (userId && userId !== 'guest' && userId !== 'user_01') params.append('userId', userId);
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
    return res.json();
  },

  updateClinic: async (id: string, clinic: Partial<VetClinic>): Promise<VetClinic> => {
    const res = await authFetch(`/api/clinics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinic)
    });
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
    } catch { }

    const merged: SystemConfig = {
      ...(serverConfig || {}),
      enableGeminiFallback: serverConfig?.enableGeminiFallback ?? true,
      fallbackGeminiApiKey: serverConfig?.fallbackGeminiApiKey || '',
      fallbackModel: serverConfig?.fallbackModel || 'gemini-3.6-flash',
      fallbackTimeoutMs: serverConfig?.fallbackTimeoutMs || 20000
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
      if (userId === 'guest') params.append('userId', 'guest');
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

  deleteAllChatSessions: async (userId?: string): Promise<{ success: boolean }> => {
    const url = (userId === 'guest') ? '/api/chat-sessions?userId=guest' : '/api/chat-sessions';
    const res = await authFetch(url, { method: 'DELETE' });
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
      }).catch(() => { });
      throw new Error(`Lỗi kết nối máy chủ AI: ${msg}`);
    }

    if (!res.ok || !res.body) {
      let errMsg = `Lỗi máy chủ (${res.status})`;
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errJson.error || errJson.details || errMsg;
      } catch { }
      api.writeLog({
        log_type: 'render',
        level: 'error',
        message: `HTTP ${res.status} từ /api/chat: ${errMsg}`,
        status_code: res.status,
        latency_ms: Date.now() - t0,
        metadata: { status: res.status, error: errMsg }
      }).catch(() => { });
      throw new Error(errMsg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          try { await reader.cancel(); } catch { }
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
              const raw = JSON.parse(line.slice(6));
              const data = (raw && raw.__enc && raw.payload) ? decryptPayload(raw.payload) : raw;
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
        try { await reader.cancel(); } catch { }
        return;
      }
      throw e;
    }
  },

  // ─────────────────────────────────────────────
  // API LOGS (via Backend API | Client Supabase REST calls suppressed)
  // ─────────────────────────────────────────────

  getLogs: async (filters?: {
    log_type?: ApiLogType;
    level?: ApiLogLevel;
    limit?: number;
    page?: number;
    search?: string;
  }): Promise<PaginatedLogsResponse> => {
    const params = new URLSearchParams();
    if (filters?.log_type) params.set('log_type', filters.log_type);
    if (filters?.level) params.set('level', filters.level);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    const res = await authFetch(`/api/logs${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Không thể tải nhật ký');
    const data = await res.json();
    if (Array.isArray(data)) {
      return {
        logs: data,
        total: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: 1
      };
    }
    return {
      logs: Array.isArray(data?.logs) ? data.logs : [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 30,
      totalPages: data?.totalPages ?? 1
    };
  },

  writeLog: async (_log?: Omit<ApiLog, 'id' | 'created_at'>): Promise<void> => {
    // Client-side direct logging to Supabase REST disabled to avoid exposing Supabase anon key in network requests.
    // Server-side logging is handled automatically by serverLog() in server.ts.
    return;
  },

  clearLogs: async (log_type?: ApiLogType): Promise<void> => {
    const qs = log_type ? `?log_type=${encodeURIComponent(log_type)}` : '';
    const res = await authFetch(`/api/logs${qs}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa nhật ký');
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
    } catch { }

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
      }).catch(() => { });

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
      }).catch(() => { });
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
        }).catch(() => { });

        return;
      } catch (retryErr: any) {
        if (onRetry) onRetry(false);
        if (signal?.aborted) throw retryErr;

        api.writeLog({
          log_type: 'render',
          level: 'error',
          message: `Máy chủ AI chính thất bại lần 2: ${retryErr?.message || 'unknown'}.`,
          latency_ms: Date.now() - startTime,
          metadata: { error: retryErr?.message, attempt: 2 }
        }).catch(() => { });

        throw new Error('Hệ thống AI đang có lượng lớn người truy cập hoặc đang cập nhật. Vui lòng thử lại sau ít phút.');
      }
    }

    throw new Error('Hệ thống AI đang có lượng lớn người truy cập. Vui lòng thử lại sau ít phút.');
  },

  // Test individual Gemini API Key via secure backend proxy
  testGeminiKey: async (apiKey: string, model: string = 'gemini-3.6-flash'): Promise<{ ok: boolean; latencyMs?: number; error?: string; message?: string }> => {
    return api.testApiKey({ apiKey, model, provider: 'gemini' });
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
  },

  runAiBenchmark: async (): Promise<AiEvaluationReport> => {
    const res = await authFetch('/api/admin/ai-evaluation/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Lỗi chạy bộ kiểm định benchmark: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  }
};
