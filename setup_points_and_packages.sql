-- ================================================================
-- VETHIC AI: THIẾT LẬP HỆ THỐNG POINT & GÓI CHAT (THỬ NGHIỆM)
-- Hướng dẫn: Copy toàn bộ nội dung script này và chạy tại:
-- Supabase Dashboard -> Project -> SQL Editor -> Run (F5)
-- ================================================================

-- 1. Thêm cột points vào bảng users (mặc định tặng 10 point khi đăng ký)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;

-- 2. Cập nhật các user cũ hiện có chưa có point hoặc point IS NULL về 10 point mặc định
UPDATE public.users 
SET points = 10 
WHERE points IS NULL;

-- 3. Tạo bảng point_transactions để lưu vết lịch sử nạp / trừ điểm minh bạch
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount_vnd NUMERIC DEFAULT 0 NOT NULL,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'topup', 'chat_usage', 'bonus', 'refund'
    package_id TEXT,               -- 'month', 'year', 'custom', 'welcome_bonus'
    description TEXT,
    status TEXT DEFAULT 'success', -- 'success', 'pending', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tắt Row-Level Security (RLS) để API Server (Anon Key) có toàn quyền Đọc/Ghi
ALTER TABLE public.point_transactions DISABLE ROW LEVEL SECURITY;

-- 5. Cấp quyền truy cập bảng point_transactions cho các role
GRANT ALL ON TABLE public.point_transactions TO anon, authenticated, service_role;

-- 6. Tạo index tìm kiếm nhanh theo user_id và thời gian
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_created 
ON public.point_transactions (user_id, created_at DESC);

-- 7. Thông báo hoàn tất
SELECT 'Thiết lập hệ thống Points & Gói dịch vụ Chat thành công!' AS status;
