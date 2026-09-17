-- ==============================================================================
-- 🛡️ CHÍNH SÁCH ROW LEVEL SECURITY (RLS) CHO VETHIC AI TRÊN SUPABASE
-- Chạy script này trong: Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. BẢNG ARTICLES (Kiến thức y khoa thú y RAG)
-- Cho phép mọi người (kể cả khách) đọc bài viết, cho phép thêm/sửa khi quản trị
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read articles" ON articles;
CREATE POLICY "Public read articles" ON articles
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin modify articles" ON articles;
CREATE POLICY "Admin modify articles" ON articles
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 2. BẢNG CLINICS (Danh sách phòng khám thú y)
-- Cho phép mọi người tra cứu phòng khám và tính khoảng cách
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read clinics" ON clinics;
CREATE POLICY "Public read clinics" ON clinics
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin modify clinics" ON clinics;
CREATE POLICY "Admin modify clinics" ON clinics
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 3. BẢNG SYSTEM_CONFIG (Cấu hình hệ thống, AI model, Key pool)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read system_config" ON system_config;
CREATE POLICY "Allow read system_config" ON system_config
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow modify system_config" ON system_config;
CREATE POLICY "Allow modify system_config" ON system_config
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 4. BẢNG API_LOGS (Ghi nhật ký hệ thống)
-- Mọi request đều có thể insert log; chỉ đọc khi được cấp quyền
ALTER TABLE IF EXISTS api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert logs" ON api_logs;
CREATE POLICY "Allow insert logs" ON api_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read logs" ON api_logs;
CREATE POLICY "Allow read logs" ON api_logs
  FOR SELECT TO anon, authenticated
  USING (true);


-- 5. BẢNG UNLOCK_REQUESTS (Yêu cầu mở khóa tài khoản)
ALTER TABLE IF EXISTS unlock_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow create unlock request" ON unlock_requests;
CREATE POLICY "Allow create unlock request" ON unlock_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage unlock requests" ON unlock_requests;
CREATE POLICY "Allow manage unlock requests" ON unlock_requests
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 6. BẢNG USERS (Thông tin người dùng)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read users" ON users;
CREATE POLICY "Allow read users" ON users
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manage users" ON users;
CREATE POLICY "Allow manage users" ON users
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 7. BẢNG PETS (Hồ sơ thú cưng)
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow manage pets" ON pets;
CREATE POLICY "Allow manage pets" ON pets
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 8. BẢNG MEDICAL_RECORDS (Bệnh án thú cưng)
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow manage medical records" ON medical_records;
CREATE POLICY "Allow manage medical records" ON medical_records
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 9. BẢNG CHAT_SESSIONS (Lịch sử phiên chat)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow manage chat sessions" ON chat_sessions;
CREATE POLICY "Allow manage chat sessions" ON chat_sessions
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
