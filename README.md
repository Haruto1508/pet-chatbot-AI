# 🐾 PetCare AI — Hệ Thống Y Tế & Chẩn Đoán Sơ Cứu Thú Cưng 24/7

> **PetCare AI** là ứng dụng full-stack hiện đại hỗ trợ tư vấn sức khỏe, phân loại mức độ nguy cấp (Triage) và sơ cứu khẩn cấp cho thú cưng bằng trí tuệ nhân tạo **Google Gemini 3.6 Flash**. Hệ thống tích hợp cơ sở tri thức **RAG (Retrieval-Augmented Generation)**, quản lý hồ sơ bệnh án, tìm kiếm phòng khám thú y qua **Google Maps**, cùng giao diện quản trị **Admin Console** phân quyền theo tài khoản Google.

---

## 💻 1. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

### 🎨 Frontend (Giao diện người dùng)
- **Framework**: React 19 + TypeScript (sử dụng Vite 6 làm công cụ build siêu nhanh).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) thiết kế chuẩn UI/UX, hỗ trợ Responsive Desktop & Mobile.
- **Biểu tượng (Icons)**: Lucide React (`lucide-react`).
- **Hiệu ứng (Animations)**: Motion (`motion`).
- **Bản đồ Google Maps**: `@vis.gl/react-google-maps` tích hợp định vị phòng khám thú y gần nhất.
- **Trình đọc Markdown**: `react-markdown` hiển thị phản hồi tư vấn y tế chuẩn format.

### ⚙️ Backend (Máy chủ xử lý & AI)
- **Runtime**: Node.js v22 (kết hợp `tsx` cho môi trường Dev và `esbuild` cho Production CommonJS bundle).
- **Framework Web**: Express.js RESTful Server (`server.ts`).
- **Trí tuệ nhân tạo AI**: `@google/genai` SDK tích hợp mô hình **Gemini 3.6 Flash**.
- **Chế độ Đa phương thức (Multimodal)**: Phân tích đồng thời câu hỏi văn bản + hình ảnh vết thương / triệu chứng lâm sàng của thú cưng.
- **Chế độ Đầu ra Cấu trúc (JSON Mode)**: Tự động tổng hợp đoạn hội thoại tư vấn thành Hồ sơ Bệnh án chuẩn y khoa thú y.

---

## 🗄️ 2. CƠ SỞ DỮ LIỆU & LƯU TRỮ (DATABASE ARCHITECTURE)

### 📊 Mô hình dữ liệu hiện tại
Hệ thống sử dụng **Server-Side In-Memory State Engine** được thiết lập trong `server.ts` và khởi tạo dữ liệu mẫu phong phú bằng Tiếng Việt tại `/src/data/initialData.ts`:

1. **Users (`users`)**: Lưu trữ tài khoản người dùng, email Google, avatar, trạng thái tài khoản và phân quyền (`admin` / `user`).
2. **Pets (`pets`)**: Danh sách hồ sơ thú cưng (tên, loài, giống, tuổi tháng, cân nặng, lịch sử tiêm vắc-xin, tiền sử dị ứng).
3. **Medical Records (`medicalRecords`)**: Lưu trữ lịch sử khám bệnh, mức độ phân loại nguy cấp (`RED` - Cấp cứu, `YELLOW` - Cần theo dõi, `GREEN` - An toàn), phác đồ điều trị và chế độ dinh dưỡng.
4. **Knowledge Base RAG Articles (`articles`)**: Dữ liệu tri thức chuyên môn thú y (triệu chứng, quy trình sơ cứu từng bước, lời khuyên bác sĩ) dùng để bơm ngữ cảnh (Context Injection) cho Gemini AI.
5. **Vet Clinics (`clinics`)**: Cơ sở dữ liệu danh sách trạm/bệnh viện thú y 24/7 với tọa độ `lat/lng` hiển thị trên bản đồ.
6. **System Config (`systemConfig`)**: Cấu hình tham số AI (Model, Temperature, System Prompt, Từ khóa cấp cứu).

### 🔄 Khả năng mở rộng Database Cloud
Tất cả thao tác trên ứng dụng đều thông qua REST API (`/api/pets`, `/api/medical-records`, `/api/articles`, `/api/clinics`, `/api/users`). Nhờ kiến trúc chuẩn RESTful này, bạn có thể dễ dàng chuyển đổi bộ lưu trữ Memory sang **Firebase Firestore** hoặc **Cloud SQL (PostgreSQL / Drizzle ORM)** chỉ bằng cách cập nhật các hàm xử lý dữ liệu trong `server.ts`.

---

## ✨ 3. TÍNH NĂNG NỔI BẬT

### 🐶 Dành cho Khách Hàng (User Portal)
1. **Chat AI Tư Vấn Bệnh Lý & Phân Loại Cấp Cứu (Triage Alert)**:
   - Tự động nhận diện mức độ nguy cấp (`RED`, `YELLOW`, `GREEN`) và hiển thị bảng cảnh báo màu nổi bật đầu tin nhắn.
   - Hỗ trợ tải ảnh vết thương/triệu chứng để AI chẩn đoán đa phương thức.
2. **Tự Động Tạo Hồ Sơ Bệnh Án Từ Đoạn Chat**:
   - Nhấn **"Lưu Hồ Sơ Bệnh Án"**, Gemini sẽ quét toàn bộ đoạn chat và trích xuất thành hồ sơ chuẩn JSON.
3. **Quản Lý Danh Sách Thú Cưng**:
   - Cập nhật thông tin chi tiết (tuổi, cân nặng, dị ứng, vắc-xin) để AI tư vấn cá nhân hóa theo từng bé.
4. **Cẩm Nang Bệnh Lý & Sơ Cứu Khẩn Cấp 24/7**:
   - Quy trình xử lý nhanh khi thú cưng bị hóc xương, sốc nhiệt, ngộ độc, tai nạn.
5. **Tìm Bệnh Viện Thú Y Gần Nhất**:
   - Tích hợp Google Maps hiển thị phòng khám 24/7, hotline cấp cứu và chỉ đường.

### 🛡️ Dành cho Quản Trị Viên (Admin Console)
1. **Sidebar Tách Biệt Hoàn Toàn**:
   - Chế độ xem Admin sở hữu thanh Sidebar giao diện tối (Dark Mode High-Contrast) riêng biệt với 6 công cụ quản trị.
2. **Bảng Điều Khiển Thống Kê (Admin Dashboard)**:
   - Theo dõi tổng số người dùng, số ca cấp cứu `RED`/`YELLOW`/`GREEN` theo thời gian thực.
3. **Quản Lý Cơ Sở Tri Thức RAG (RAG Knowledge Engine)**:
   - Thêm, sửa, xóa các bài viết chuyên môn thú y để làm nguồn dữ liệu củng cố câu trả lời cho Gemini.
4. **Cấu Hình AI & Hệ Thống**:
   - Tùy chỉnh trực tiếp Prompt hệ thống, chỉ số Temperature, mô hình AI (`gemini-3.6-flash`) và bổ sung các Từ khóa Cấp cứu.

---

## 🔐 4. PHÂN QUYỀN TỰ ĐỘNG BẰNG TÀI KHOẢN GOOGLE

Hệ thống phân định quyền truy cập tự động dựa trên Email Google:
- **Tài khoản Google Admin** (Ví dụ: `admin@petcare.ai` hoặc email có chứa chữ `admin`): Tự động cấp quyền **Admin Quản Trị**, mở khóa toàn bộ thanh Menu Admin.
- **Tài khoản Google Thường** (Ví dụ: `thaivinh2344@gmail.com`): Cấp quyền **User**, chuyển tới trang Chat AI & Quản lý thú cưng.

---

## 📱 5. THIẾT KẾ GIAO DIỆN KHÔNG TRỐI CUỘN TRANG (FIXED APP SHELL)

- Giao diện được thiết kế theo dạng **Single-Page Fixed App Shell** (`h-screen overflow-hidden`).
- Thanh Header và Sidebar luôn cố định trên màn hình.
- Trong giao diện Chat AI, duy nhất vùng danh sách tin nhắn có thanh cuộn riêng (`overflow-y-auto`), giúp trải nghiệm tư vấn mượt mà chuẩn ứng dụng Web hiện đại.

---

## 🛠️ 6. HƯỚNG DẪN CHẠY DỰ ÁN (LOCAL DEVELOPMENT)

1. **Cài đặt phụ thuộc**:
   ```bash
   npm install
   ```
2. **Cấu hình biến môi trường**:
   Tạo file `.env` (dựa theo `.env.example`):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
3. **Khởi chạy ứng dụng**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`.

---

© 2026 PetCare AI System. Được phát triển dựa trên **Google Gemini AI** & **React 19**.
