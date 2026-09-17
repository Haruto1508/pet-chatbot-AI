# 🐾 Vethic AI — Hệ Thống Y Tế & Chẩn Đoán Sơ Cứu Thú Cưng 24/7

> **Vethic AI** là nền tảng y tế thú y số toàn diện (Full-stack Web App) tích hợp trí tuệ nhân tạo đa phương thức **Google Gemini 2.5 Flash**, dịch vụ thị giác máy tính **PyTorch ResNet**, và cơ sở tri thức chuyên sâu **RAG (pgvector 768 dimensions)**. Ứng dụng cung cấp khả năng phân loại khẩn cấp (Triage 3 cấp độ), tư vấn điều trị sơ cứu thời gian thực, quản lý bệnh án điện tử, bản đồ phòng khám 24/7 và giao diện quản trị phân quyền nâng cao.

---

## 💻 1. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

### 🎨 Frontend (Giao diện người dùng)
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) chạy trên nền [Vite 6](https://vitejs.dev/).
- **CSS & Styling**: [Tailwind CSS v4](https://tailwindcss.com/) với thiết kế chuẩn SPA (Single Page App), hỗ trợ đầy đủ Desktop & Mobile.
- **Biểu tượng (Icons)**: [Lucide React](https://lucide.dev/).
- **Bản đồ trực quan**: `@vis.gl/react-google-maps` tích hợp định vị, tìm kiếm và tính khoảng cách đến phòng khám thú y gần nhất.
- **Trình đọc Markdown**: `react-markdown` kết hợp hệ thống CSS Markdown Body chuẩn y khoa, bảng biểu, danh sách hành động và nút xuất file `.md`.
- **Tự động phục hồi phiên bản (Stale Chunk Handler)**: Tự động phát hiện phiên bản mới và reload thông minh (`lazyWithRetry` & `vite:preloadError`) tránh lỗi 404 sau khi deploy lên Vercel.

### ⚙️ Backend & Trí Tuệ Nhân Tạo (AI & Server)
- **Runtime**: Node.js v22 (kết hợp `tsx` cho môi trường Dev và `esbuild` biên dịch bundle server production).
- **Web Framework**: Express.js RESTful API Server (`server.ts`).
- **Mô hình ngôn ngữ lớn (LLM)**: `@google/genai` với **Gemini 2.5 Flash / Pro** (hỗ trợ phân tích văn bản + hình ảnh lâm sàng Multimodal).
- **Mô hình Vector Embedding**: `gemini-embedding-001` xuất ra vector 768 chiều cho hệ thống truy xuất thông tin ngữ cảnh RAG.
- **Dịch vụ thị giác máy tính (Image AI)**: FastAPI + PyTorch ResNet18 (được container hóa và triển khai độc lập trên Render Cloud).

### 🗄️ Cơ sở dữ liệu & Lưu trữ (Database & Security)
- **Cơ sở dữ liệu chính**: [Supabase](https://supabase.com/) (PostgreSQL 15+ tích hợp extension `pgvector`).
- **Bảo mật**: Hỗ trợ đầy đủ **Row Level Security (RLS)** với bộ chính sách truy cập chi tiết (`setup_rls_policies.sql`) cùng cơ chế bypass an toàn qua `SUPABASE_SERVICE_ROLE_KEY` ở backend.
- **Bộ nhớ đệm kép**: Lưu trữ đồng thời cấu hình trên Supabase, file cục bộ `system_config.json` và `localStorage` phía client để hệ thống luôn sẵn sàng 100%.

---

## ✨ 2. TÍNH NĂNG NỔI BẬT

### 🐶 Cổng Người Dùng (User Portal)
1. **Chat AI Tư Vấn Bệnh Lý & Phân Loại Cấp Cứu (Clinical Triage System)**:
   - Tự động nhận diện và gắn nhãn phân loại ngay đầu phản hồi:
     - 🔴 **RED**: Cấp cứu khẩn cấp (khó thở, ngộ độc, co giật, xuất huyết nặng).
     - 🟡 **YELLOW**: Cần khám sớm (nấm ngứa, tiêu chảy, viêm da, bỏ ăn).
     - 🟢 **GREEN**: Tư vấn chăm sóc, dinh dưỡng, sinh hoạt thường ngày.
   - Gửi kèm hình ảnh vết thương hoặc biểu hiện của thú cưng để AI chẩn đoán đa phương thức.
   - Hỗ trợ nút **Sao chép (Copy)** cho cả câu hỏi của người dùng và câu trả lời của AI với phản hồi xanh tức thì.
   - Nút **Tải về file `.md`** giúp lưu lại phác đồ điều trị và hướng dẫn sơ cứu nhanh chóng.

2. **Tự Động Tạo Hồ Sơ Bệnh Án Chuẩn Y Khoa**:
   - AI tự động trích xuất toàn bộ đoạn chat thành hồ sơ bệnh án JSON gồm: Tóm tắt triệu chứng, Chẩn đoán, Mức độ Triage, Phác đồ xử lý, Chế độ ăn uống và Lịch tái khám.

3. **Quản Lý Hồ Sơ Thú Cưng Cá Nhân Hóa**:
   - Lưu trữ chi tiết tên, giống loài, độ tuổi, cân nặng, lịch tiêm phòng vắc-xin và tiền sử dị ứng để AI tự động cá nhân hóa phác đồ.

4. **Bản Đồ Phòng Khám Thú Y 24/7**:
   - Tích hợp Google Maps hiển thị phòng khám xung quanh, hotline liên hệ khẩn cấp, giờ mở cửa và dẫn đường tức thì.

5. **Cẩm Nang Sơ Cứu & Tri Thức Thú Y**:
   - Thư viện bài viết chuyên sâu về các tai nạn thường gặp (sốc nhiệt, hóc dị vật, ngộ độc thức ăn...) được chuẩn hóa từ bác sĩ thú y.

---

### 🛡️ Cổng Quản Trị Hệ Thống (Admin Console)
1. **Quản Lý Multi-Key Fallback Pool (Xoay vòng API Key)**:
   - Cho phép nhập danh sách **nhiều Gemini API Key** qua giao diện trực quan với nút **[+ Thêm Key]**.
   - Cơ chế tự động chuyển đổi key (Sequential Failover): Khi Key #1 chạm hạn mức Quota (HTTP 429), hệ thống tự động đổi sang Key #2 $\rightarrow$ Key #3 mà không làm gián đoạn người dùng.
   - Nút **"Kiểm tra Pool"** đo trực tiếp độ trễ (latency) và kiểm tra sức khỏe từng key theo thời gian thực.

2. **Cơ Chế Dự Phòng 3 Tầng Siêu Bền (3-Tier High Availability)**:
   - **Tầng 1**: Máy chủ AI Backend xử lý chính.
   - **Tầng 2**: Tự động kết nối lại lần 2 nếu phát sinh lỗi mạng hoặc timeout.
   - **Tầng 3**: Gọi trực tiếp **Gemini Direct Client API** từ trình duyệt bằng Key Pool dự phòng.

3. **Bảng Điều Khiển Thống Kê (Dashboard)**:
   - Thống kê thời gian thực tổng số người dùng, số ca bệnh theo cấp độ màu, tỷ lệ cấp cứu và xu hướng chat.

4. **Quản Trị Cơ Sở Tri Thức RAG (Knowledge Management)**:
   - Thêm, sửa, xóa các bài viết y khoa; tự động tạo vector embedding 768 chiều lưu vào Supabase pgvector.

5. **Nhật Ký Hệ Thống (System & API Logs)**:
   - Ghi lại chi tiết mọi yêu cầu chat, độ trễ xử lý, chuyển đổi key fallback và trạng thái Supabase.

---

## 🗄️ 3. CẤU TRÚC CƠ SỞ DỮ LIỆU (SUPABASE SCHEMA)

Hệ thống sử dụng các bảng PostgreSQL chính sau:

| Tên Bảng | Mục Đích Lưu Trữ |
|---|---|
| `users` | Tài khoản, email Google, vai trò (`admin`/`user`), trạng thái (`active`/`suspended`) |
| `pets` | Hồ sơ thú cưng (tên, giống, tuổi, cân nặng, vắc-xin, dị ứng) |
| `medical_records` | Lịch sử bệnh án, mức độ Triage, phác đồ điều trị, lời khuyên dinh dưỡng |
| `articles` | Bài viết chuyên môn thú y RAG kèm trường `embedding vector(768)` |
| `clinics` | Danh sách phòng khám thú y, tọa độ `lat`/`lng`, số hotline, dịch vụ 24/7 |
| `chat_sessions` | Lịch sử các phiên hội thoại tư vấn theo từng người dùng |
| `system_config` | Cấu hình AI Model, Key Pool, Temperature, System Prompt, Service URL |
| `api_logs` | Nhật ký hệ thống, mã lỗi HTTP, thời gian phản hồi (latency ms) |
| `unlock_requests` | Yêu cầu xem xét mở khóa của các tài khoản bị tạm ngưng |

---

## 🛠️ 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN (GETTING STARTED)

### 📥 Bước 1: Clone kho mã nguồn và cài đặt thư viện
```bash
# Clone repository
git clone https://github.com/Haruto1508/pet-chatbot-AI.git

# Di chuyển vào thư mục dự án
cd pet-chatbot-AI

# Cài đặt các gói phụ thuộc
npm install
```

### 🔑 Bước 2: Thiết lập file môi trường (`.env`)
Tạo file `.env` tại thư mục gốc với các thông số sau:

```env
# Google Gemini AI Key (Tạo miễn phí tại https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Danh sách nhiều key dự phòng phân cách bằng dấu phẩy (tùy chọn)
GEMINI_API_KEYS="AIzaSyKey1...,AIzaSyKey2..."

# Google Maps API Key (Dùng cho bản đồ tìm kiếm phòng khám)
GOOGLE_MAPS_PLATFORM_KEY="AIzaSyYourGoogleMapsKeyHere"

# Cấu hình Supabase (Lấy từ Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Secret Key Backend (Tùy chọn - Dùng để bypass RLS ở phía server)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Cổng khởi chạy máy chủ (Mặc định 3000)
PORT=3000
```

### 🗄️ Bước 3: Thiết lập CSDL Supabase & Phân Quyền RLS
1. Mở **Supabase Dashboard** $\rightarrow$ **SQL Editor**.
2. Chạy nội dung trong file [`scripts/schema.sql`](file:///c:/Projects/pet-chatbot-AI/scripts/schema.sql) để tạo toàn bộ bảng và kích hoạt extension vector.
3. Chạy nội dung trong file [`scripts/setup_rls_policies.sql`](file:///c:/Projects/pet-chatbot-AI/scripts/setup_rls_policies.sql) để thiết lập chính sách Row Level Security an toàn.
4. Nạp dữ liệu mẫu ban đầu:
   ```bash
   npx tsx scripts/seedSupabase.ts
   ```

### 🚀 Bước 4: Khởi chạy ứng dụng
```bash
# Khởi động môi trường phát triển (Full-stack dev server)
npm run dev
```
Ứng dụng sẽ hoạt động tại địa chỉ: **`http://localhost:3000`**

### 📦 Bước 5: Biên dịch cho môi trường Production (Build)
```bash
npm run build
```
Lệnh này sẽ biên dịch đồng thời cả mã nguồn Vite Frontend (tối ưu hóa chunking) và Express Server qua `esbuild`.

---

## 🔒 5. PHÂN QUYỀN TỰ ĐỘNG BẰNG GOOGLE AUTH

- **Quyền Admin**: Đăng nhập bằng tài khoản email chứa từ khóa `admin` (hoặc email cấu hình trong cơ sở dữ liệu) $\rightarrow$ Hệ thống tự động mở khóa toàn bộ thanh công cụ Quản trị viên (`/admin_dashboard`, `/admin_users`, `/admin_config`, `/admin_rag`, `/admin_logs`, `/admin_health`).
- **Quyền User**: Đăng nhập bằng tài khoản Google bất kỳ hoặc trải nghiệm nhanh dưới vai trò Khách (`Guest`).

---

## 📄 6. GIẤY PHÉP & BẢN QUYỀN
Dự án được xây dựng và phát triển cho mục đích giáo dục, chăm sóc y tế cộng đồng và nghiên cứu ứng dụng AI.  
© 2026 **Vethic AI Team**. All Rights Reserved.
