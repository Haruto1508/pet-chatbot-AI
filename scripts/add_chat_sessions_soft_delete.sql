-- ================================================================
-- CẬP NHẬT CÁC CỘT SOFT DELETE CHO BẢNG chat_sessions
-- Chạy đoạn script này trong: Supabase Dashboard > SQL Editor > Run
-- ================================================================

-- 1. Thêm cột is_deleted và deleted_at vào bảng chat_sessions nếu chưa có
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Tạo index tối ưu tốc độ truy vấn lọc danh sách phiên chat
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_deleted 
ON public.chat_sessions (user_id, is_deleted);

-- 3. Chuẩn hóa các bản ghi hiện có
UPDATE public.chat_sessions 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

-- 4. Chuyển đổi các bản ghi từng được đánh dấu [HIDDEN_USER] sang is_deleted = TRUE
UPDATE public.chat_sessions 
SET is_deleted = TRUE, 
    deleted_at = updated_at 
WHERE title LIKE '[HIDDEN_USER]%';

-- 5. Kiểm tra lại cấu trúc các cột sau khi thêm
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' AND column_name IN ('is_deleted', 'deleted_at');
