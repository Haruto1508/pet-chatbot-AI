-- ================================================================
-- CẬP NHẬT CÁC CỘT HỖ TRỢ MULTI-API VÀ FALLBACK CHO BẢNG system_config
-- Chạy đoạn script này trong: Supabase Dashboard > SQL Editor > Run
-- ================================================================

ALTER TABLE public.system_config 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS backup_gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS fallback_gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS render_service_url TEXT DEFAULT 'https://pet-chatbot-ai.onrender.com',
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS custom_api_base_url TEXT,
ADD COLUMN IF NOT EXISTS custom_model_name TEXT,
ADD COLUMN IF NOT EXISTS api_provider TEXT DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS auto_keep_alive_interval INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS enable_gemini_fallback BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS fallback_model TEXT DEFAULT 'gemini-2.5-flash',
ADD COLUMN IF NOT EXISTS fallback_timeout_ms INTEGER DEFAULT 20000;

-- Đảm bảo có hàng cấu hình id = 1
INSERT INTO public.system_config (id, ai_model, temperature, system_prompt, max_tokens, updated_at)
VALUES (1, 'gemini-2.5-flash', 0.4, 'Bạn là Bác Sĩ Thú Y AI chuyên nghiệp của hệ thống Vethic AI.', 2048, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT * FROM public.system_config WHERE id = 1;
