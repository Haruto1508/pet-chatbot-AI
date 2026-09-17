export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN';

export type UserRole = 'user' | 'admin';

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

export interface SystemStats {
  totalUsers: number;
  activeChats: number;
  totalPets: number;
  totalMedicalRecords: number;
  triageRedCount: number;
  triageYellowCount: number;
  triageGreenCount: number;
  history?: any[];
  userGrowth?: number;
}

export interface UnlockRequest {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}
