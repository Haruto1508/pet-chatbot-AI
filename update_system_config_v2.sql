-- ================================================================
-- CẬP NHẬT BẢNG system_config: HỖ TRỢ MULTI-API & KEEP-ALIVE
-- Chạy script này trong Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Thêm các cột cấu hình API mở rộng và Keep-Alive (nếu chưa có)
ALTER TABLE public.system_config 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS backup_gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS render_service_url TEXT DEFAULT 'https://pet-chatbot-ai.onrender.com',
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS custom_api_base_url TEXT,
ADD COLUMN IF NOT EXISTS custom_model_name TEXT,
ADD COLUMN IF NOT EXISTS api_provider TEXT DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS auto_keep_alive_interval INTEGER DEFAULT 10;

-- 2. Đảm bảo có hàng mặc định id = 1
INSERT INTO public.system_config (
  id,
  ai_model,
  temperature,
  system_prompt,
  max_tokens,
  emergency_keywords,
  render_service_url,
  api_provider,
  auto_keep_alive_interval,
  updated_at
)
VALUES (
  1,
  'gemini-2.5-flash',
  0.4,
  'Bạn là Bác Sĩ Thú Y AI chuyên nghiệp của hệ thống PetCare AI. Nhiệm vụ của bạn là tư vấn sức khỏe thú cưng (chó, mèo) dựa trên triệu chứng mô tả từ chủ nuôi. Luôn ưu tiên an toàn của thú cưng, trả lời súc tích, đi thẳng vào hành động. Bắt buộc bắt đầu mỗi câu trả lời bằng khối TRIAGE_ALERT để phân loại mức độ nguy hiểm.',
  2048,
  ARRAY['máu', 'co giật', 'khó thở', 'bất tỉnh', 'không thở', 'liệt', 'sùi bọt mép', 'ngất', 'té ngã', 'ngộ độc'],
  'https://pet-chatbot-ai.onrender.com',
  'gemini',
  10,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  render_service_url = EXCLUDED.render_service_url,
  api_provider = EXCLUDED.api_provider,
  updated_at = NOW();

-- 3. Kiểm tra dữ liệu
SELECT * FROM public.system_config;
