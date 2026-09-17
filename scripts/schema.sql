-- Bật tiện ích mã hóa Vector cho RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Xóa các bảng cũ nếu có (cẩn thận khi chạy trên môi trường thực tế)
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS clinics;

-- 1. Bảng Users (Người dùng)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Bảng Medical Records (Hồ sơ bệnh án)
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id TEXT, -- Không dùng REFERENCES pets(id) ON DELETE CASCADE nếu user chưa đồng bộ
  pet_name TEXT,
  pet_species TEXT,
  user_id TEXT,
  date TEXT,
  symptom_summary TEXT,
  diagnosis TEXT,
  triage_level TEXT,
  treatment_plan TEXT,
  dietary_advice TEXT,
  follow_up_notes TEXT,
  chat_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Pets (Thú cưng)
CREATE TABLE pets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  weight NUMERIC,
  gender TEXT,
  vaccine_status TEXT[],
  allergies TEXT[],
  avatarUrl TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Articles (Kiến thức RAG)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  species TEXT DEFAULT 'Cả hai',
  summary TEXT,
  symptoms TEXT[],
  first_aid_steps TEXT[],
  doctor_advice TEXT,
  urgency_level TEXT DEFAULT 'GREEN',
  content TEXT,
  image_url TEXT,
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Hàm Tìm kiếm Vector RAG (Match Articles)
CREATE OR REPLACE FUNCTION match_articles (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  symptoms text[],
  first_aid_steps text[],
  doctor_advice text,
  urgency_level text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    articles.id,
    articles.title,
    articles.summary,
    articles.symptoms,
    articles.first_aid_steps,
    articles.doctor_advice,
    articles.urgency_level,
    articles.content,
    1 - (articles.embedding <=> query_embedding) AS similarity
  FROM articles
  WHERE 1 - (articles.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 5. Bảng Clinics (Phòng khám thú y)
CREATE TABLE clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  lat NUMERIC,
  lng NUMERIC,
  rating NUMERIC,
  reviews_count INTEGER,
  is_emergency_247 BOOLEAN,
  opening_hours TEXT,
  services TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Bảng Chat Sessions (Lịch sử hội thoại AI)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  pet_id TEXT,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Bảng Guest Rate Limits (Giới hạn chat cho khách)
CREATE TABLE guest_rate_limits (
  ip_address TEXT PRIMARY KEY,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tắt Row Level Security (RLS) cho tất cả các bảng để backend (dùng anon key) có thể truy cập được
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE guest_rate_limits DISABLE ROW LEVEL SECURITY;
