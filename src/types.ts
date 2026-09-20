export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN';

export type UserRole = 'user' | 'admin' | 'subadmin';


export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface PetProfile {
  id: string;
  userId: string;
  name: string;
  species: 'Chó' | 'Mèo' | 'Chim' | 'Thú nhỏ khác';
  breed: string;
  age: number; // in months or years
  weight: number; // in kg
  gender: 'Đực' | 'Cái';
  vaccineStatus: string[];
  allergies: string[];
  avatarUrl: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  triageLevel?: TriageLevel;
  petId?: string;
  timestamp: string;
  imageUrl?: string;
  triageDetails?: {
    riskTitle: string;
    urgency: string;
    immediateActions: string[];
  };
  status?: 'success' | 'error' | 'fallback';
  errorMessage?: string;
  latencyMs?: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  petId: string | null;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: string;
  } | null;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  userId: string;
  date: string;
  symptomSummary: string;
  diagnosis: string;
  triageLevel: TriageLevel;
  treatmentPlan: string;
  dietaryAdvice: string;
  followUpNotes: string;
  chatSnippet?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  species: 'Chó' | 'Mèo' | 'Cả hai';
  category: 'symptom' | 'first_aid' | 'prevention' | 'nutrition';
  summary: string;
  symptoms: string[];
  firstAidSteps: string[];
  doctorAdvice: string;
  urgencyLevel: TriageLevel;
  imageUrl: string;
  content: string;
  updatedAt: string;
}

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  isEmergency247: boolean;
  openingHours: string;
  services: string[];
  imageUrl: string;
  distanceKm?: number;
}

export interface SystemConfig {
  aiModel: string;
  temperature: number;
  systemPrompt: string;
  maxTokens: number;
  emergencyKeywords: string[];
  geminiApiKey?: string;
  backupGeminiApiKey?: string;
  renderServiceUrl?: string;
  openaiApiKey?: string;
  customApiBaseUrl?: string;
  customModelName?: string;
  apiProvider?: 'gemini' | 'openai' | 'custom';
  autoKeepAliveIntervalMinutes?: number;
  // Maintenance mode
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  // Fallback config
  enableGeminiFallback?: boolean;
  fallbackGeminiApiKey?: string;
  geminiApiKeysPool?: string[];
  fallbackModel?: string;
  fallbackTimeoutMs?: number;
}

export type ApiLogLevel = 'info' | 'warn' | 'error';
export type ApiLogType = 'chat' | 'supabase' | 'render' | 'gemini' | 'fallback' | 'error' | 'system';

export interface ApiLog {
  id: string;
  created_at: string;
  log_type: ApiLogType;
  level: ApiLogLevel;
  user_id?: string | null;
  session_id?: string | null;
  message: string;
  metadata?: Record<string, any> | null;
  latency_ms?: number | null;
  status_code?: number | null;
}

export interface PaginatedLogsResponse {
  logs: ApiLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'CHAT_OPEN'
  | 'CHAT_MESSAGE_SENT'
  | 'CHAT_SESSION_STARTED'
  | 'LOGIN'
  | 'REGISTER';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  visitorId: string;
  userId?: string | null;
  path?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SystemStats {
  // 10 Core Metrics requested by user
  websiteVisitors: number;
  uniqueVisitors: number;
  registeredUsers: number;
  activeUsers: number;
  chatUsers: number;
  guestChatUsers: number;
  loggedInChatUsers: number;
  chatSessions: number;
  guestSessions: number;
  registeredSessions: number;
  totalMessages: number;
  pageViews: number;

  // Conversion & Engagement Rates
  visitorToChatRate: number; // (chatUsers / uniqueVisitors) * 100
  guestToRegisteredRate: number; // (registeredUsers / uniqueVisitors) * 100
  avgMessagesPerSession: number; // totalMessages / chatSessions
  userGrowth: number;

  // Domain & Veterinary Metrics
  totalPets: number;
  totalMedicalRecords: number;
  triageRedCount: number;
  triageYellowCount: number;
  triageGreenCount: number;

  // Historical trend data for graphs
  history?: Array<{
    date: string;
    visitors: number;
    chatUsers: number;
    chats: number;
    messages: number;
    users?: number;
  }>;

  // Real-time recent event stream
  recentEvents?: AnalyticsEvent[];

  // Legacy backwards compatibility aliases
  totalUsers?: number;
  activeChats?: number;
}

export interface UnlockRequest {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface GoldenTestCase {
  id: string;
  type: 'in_distribution' | 'out_of_distribution' | 'out_of_rag' | 'emergency_red';
  title: string;
  input: string;
  expectedTriage: string;
  expectedClass: string;
  resultStatus: 'PASSED' | 'FAILED';
  ragasScore: number;
  oodTriggered: boolean;
  notes: string;
}

export interface AiEvaluationReport {
  timestamp: string;
  overallHealth: string;
  totalTestsPassed: string;
  passRate: number;
  benchmarks: {
    vision: {
      title: string;
      frameworks: string[];
      architecture: string;
      metrics: {
        accuracy: number;
        macroF1: number;
        precision: number;
        recall: number;
        oodAuroc: number;
        cleanlabHealthScore: number;
        noisySamplesDetected: number;
        cleanDatasetRate: number;
      };
      classes: Array<{ key: string; label: string; samples: number; f1: number }>;
      confusionMatrix: number[][];
    };
    rag: {
      title: string;
      frameworks: string[];
      totalKnowledgeArticles: number;
      metrics: {
        faithfulness: number;
        answerRelevance: number;
        contextPrecision: number;
        contextRecall: number;
        semanticSimilarity: number;
      };
      ragTriad: {
        contextRelevance: number;
        groundedness: number;
        answerRelevance: number;
        triadScore: number;
      };
    };
    output: {
      title: string;
      frameworks: string[];
      metrics: {
        triageAccuracyGEval: number;
        hallucinationRate: number;
        toxicityRate: number;
        promptInjectionDefense: number;
        medicalOverconfidencePrevention: number;
        totalRecordsAudited: number;
      };
    };
    unknownDiseaseProtocol: {
      title: string;
      methodology: string;
      metrics: {
        oodRejectionRate: number;
        safeRefusalCompliance: number;
        clinicalReferralAdherence: number;
        corticoidWarningGiven: number;
        zeroHarmGuarantee: string;
      };
      fourStepProtocol: string[];
    };
  };
  goldenTestCases: GoldenTestCase[];
}

