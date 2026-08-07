-- Bật extension pgvector để hỗ trợ lưu trữ và tìm kiếm vector
CREATE EXTENSION IF NOT EXISTS vector;

-- Thêm cột 'embedding' vào bảng 'articles' hiện có.
-- 768 là số chiều vector được tạo bởi mô hình text-embedding-004 của Google GenAI.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Hàm thực hiện Semantic Search (Tìm kiếm ngữ nghĩa) bằng Cosine Similarity
-- Đầu vào: query_embedding (vector của câu hỏi), match_threshold (độ tương đồng tối thiểu), match_count (số lượng kết quả tối đa)
-- Trả về: id, title, content, similarity
CREATE OR REPLACE FUNCTION match_articles (
  query_embedding vector(768),
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  symptoms text[],
  first_aid_steps text[],
  doctor_advice text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    id, 
    title,
    summary,
    symptoms,
    first_aid_steps,
    doctor_advice,
    content, 
    1 - (articles.embedding <=> query_embedding) AS similarity
  FROM articles
  WHERE 1 - (articles.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
