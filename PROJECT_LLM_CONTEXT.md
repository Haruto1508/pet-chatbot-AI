# 🤖 PETCARE AI - PROJECT LLM CONTEXT & COMPREHENSIVE ARCHITECTURE

> **NOTE FOR AI / CHAT ASSISTANTS**:
> Read this file to immediately understand the entire **PetCare AI System** codebase without needing to scan individual source files. It outlines the architecture, data schemas, backend endpoints, RAG workflow, Google Auth role evaluation, state management, and component breakdown.

---

## 🚀 1. SYSTEM OVERVIEW & ARCHITECTURE

- **Application Name**: PetCare AI — Veterinary Triage & Medical Management System
- **Core Purpose**: AI-powered pet medical triage, RAG knowledge consultation, medical record generation, pet management, emergency first aid, clinic map locator, and an admin management dashboard.
- **Tech Stack**:
  - **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React icons, Motion animations, React Markdown, `@vis.gl/react-google-maps`.
  - **Backend**: Node.js, Express.js REST server (`server.ts`), `@google/genai` SDK (`gemini-3.6-flash`).
  - **Database**: Server-side in-memory store initialized with rich Vietnamese medical mock data (`/src/data/initialData.ts`). Extensible to Firebase Firestore or PostgreSQL.
  - **AI Model**: Google Gemini API (`gemini-3.6-flash`) with multimodal capabilities (Text + Symptoms Image analysis) and JSON Structured Output (`responseMimeType: "application/json"`).

---

## 🛠️ 2. DATA MODELS & TYPINGS (`/src/types.ts`)

```typescript
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended';
export type Species = 'Chó' | 'Mèo' | 'Cả hai' | 'Khác';
export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN'; // RED: Emergency, YELLOW: Urgent, GREEN: Safe/Routine

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface PetProfile {
  id: string;
  userId: string;
  name: string;
  species: Species;
  breed: string;
  age: number; // in months
  weight: number; // in kg
  gender: 'Đực' | 'Cái';
  vaccineStatus: string[];
  allergies: string[];
  avatarUrl: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  petName: string;
  petSpecies: Species;
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
  species: Species;
  category: 'symptom' | 'emergency' | 'nutrition' | 'disease';
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
}

export interface SystemConfig {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  emergencyKeywords: string[];
}
```

---

## 📡 3. REST API ENDPOINTS (`server.ts` & `src/services/api.ts`)

| HTTP Method | Endpoint | Description |
|---|---|---|
| **GET** | `/api/health` | Server health check |
| **GET** | `/api/stats` | Aggregated dashboard metrics (Total users, pets, medical records, triage counts) |
| **GET / PUT / DELETE** | `/api/users`, `/api/users/:id/status`, `/api/users/:id` | Manage Google user accounts & status |
| **GET / POST / PUT / DELETE** | `/api/pets` | CRUD operations for pet profiles |
| **GET / POST / DELETE** | `/api/medical-records` | Fetch & save veterinary medical records |
| **GET / POST / PUT / DELETE** | `/api/articles` | RAG Knowledge Base articles (Searchable by keywords/category) |
| **GET / POST / PUT / DELETE** | `/api/clinics` | Vet clinic locator database |
| **GET / POST** | `/api/config` | Read/Update AI System Config & Prompts |
| **POST** | `/api/chat` | Main AI Triage Chat endpoint (Gemini + RAG + Image Analysis) |
| **POST** | `/api/summarize-medical-record` | Auto-generate medical record from chat history using Gemini JSON Mode |

---

## 🧠 4. AI TRIAGE & RAG WORKFLOW

1. **User Consultation**: User inputs pet symptoms (with optional image attachment) in `PetChatView`.
2. **Context Assembly**:
   - Injects selected pet details (`name`, `species`, `age`, `weight`, `vaccineStatus`, `allergies`).
   - Runs `searchRAGKnowledge(queryText)` against `articles` DB to retrieve verified clinical first-aid steps and veterinary advice.
   - Appends conversation history.
3. **Gemini Execution**:
   - Invokes `gemini-3.6-flash` via `@google/genai`.
   - Forces structured `[[TRIAGE_ALERT]]` tag insertion:
     ```json
     [[TRIAGE_ALERT]]
     {
       "level": "RED" | "YELLOW" | "GREEN",
       "title": "CẤP BÁCH / NGUY HIỂM CAO",
       "urgency": "Đưa đến trạm thú y ngay lập tức!",
       "actions": ["Giữ ấm", "Mở thoáng đường thở"]
     }
     [[/TRIAGE_ALERT]]
     ```
4. **Parsing & Rendering**:
   - `server.ts` parses the JSON alert block, sets `triageLevel`, strips the raw tag, and returns clean Markdown.
   - `PetChatView` renders a high-visibility color-coded Triage Alert Banner (`RED` = Red pulsing box, `YELLOW` = Amber box, `GREEN` = Emerald box) above the clinical response.
5. **Medical Record Generation**:
   - User clicks "Lưu Hồ Sơ Bệnh Án".
   - Calls `/api/summarize-medical-record`, Gemini parses full conversation into structured JSON (`symptomSummary`, `diagnosis`, `treatmentPlan`, `dietaryAdvice`, `followUpNotes`), and saves a new `MedicalRecord`.

---

## 🔑 5. AUTHENTICATION & SEPARATE SIDEBAR NAVIGATION

- **Role Evaluation**: `LoginModal.tsx` evaluates the user's Google Account email:
  - Emails with `@petcare.ai`, containing `admin`, or matching registered admin emails (`admin@petcare.ai`) are assigned **`admin`** role.
  - All other Google accounts (e.g. `thaivinh2344@gmail.com`) receive **`user`** role.
- **Strict Sidebar Separation**:
  - `Sidebar.tsx` dynamically switches between two completely distinct sidebar layouts:
    - **User Sidebar**: 7 User navigation tabs (`chat`, `records`, `news`, `emergency`, `clinics`, `pets`, `account`).
    - **Admin Sidebar**: Dark high-contrast styling with 6 Admin navigation tabs (`admin_dashboard`, `admin_users`, `admin_records`, `admin_clinics`, `admin_rag`, `admin_config`).
- **Single-Screen Fixed Layout**:
  - Entire app shell (`App.tsx`) is bound to `h-screen overflow-hidden`.
  - Sidebar and Header remain fixed in viewport.
  - `PetChatView` stays strictly within viewport height with only the chat messages list scrolling (`flex-1 min-h-0 overflow-y-auto`).

---

## 📂 6. DIRECTORY STRUCTURE

```
/
├── server.ts                       # Express backend server with Gemini SDK & REST endpoints
├── metadata.json                   # App capabilities & permissions
├── package.json                    # Dependencies & scripts
├── README.md                       # Human-readable Vietnamese documentation
├── PROJECT_LLM_CONTEXT.md          # Machine/LLM architectural context
└── src/
    ├── App.tsx                     # Main layout shell (Fixed single screen layout)
    ├── main.tsx                    # React entrypoint
    ├── index.css                   # Global Tailwind CSS import
    ├── types.ts                    # Global TypeScript interfaces
    ├── data/
    │   └── initialData.ts          # Vietnamese initial mock dataset (Users, Pets, Articles, Clinics, Records)
    ├── services/
    │   └── api.ts                  # Axios/Fetch API client wrapping backend REST endpoints
    └── components/
        ├── common/
        │   ├── Header.tsx          # Top navigation header with active tab indicator & Google profile
        │   ├── Sidebar.tsx         # Dual-mode separated Sidebar (User vs. Admin Workspace)
        │   └── LoginModal.tsx      # Google Account Auth modal with role auto-detection
        ├── user/
        │   ├── PetChatView.tsx     # Gemini Triage Chat with image upload & record generation
        │   ├── MedicalHistoryView.tsx # Patient medical records history list
        │   ├── ArticlesNewsView.tsx # Disease dictionary & knowledge base
        │   ├── EmergencyFirstAidView.tsx # 24/7 First aid guides for emergency situations
        │   ├── NearestClinicsView.tsx # Google Maps vet clinic locator
        │   ├── PetManagementView.tsx  # CRUD Pet management dashboard
        │   └── AccountSettingsView.tsx # User settings & Google account info
        └── admin/
            ├── AdminDashboardView.tsx   # System statistics, triage charts & key metrics
            ├── AdminUsersView.tsx       # User account status management
            ├── AdminPetsRecordsView.tsx # System-wide medical records & diagnostics
            ├── AdminClinicsView.tsx     # Clinic location manager
            ├── AdminKnowledgeRAGView.tsx # RAG Knowledge article editor
            └── AdminSystemConfigView.tsx # Gemini AI prompts, model selection & parameters
```
