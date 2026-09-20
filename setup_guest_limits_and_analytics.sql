-- ================================================================
-- VETHIC AI: THIẾT LẬP BẢNG guest_rate_limits & analytics_events
-- Hướng dẫn: Copy toàn bộ nội dung script này và chạy tại:
-- Supabase Dashboard -> Project -> SQL Editor -> Run (F5)
-- ================================================================

-- 1. Tạo bảng guest_rate_limits để kiểm soát số lượt chat của khách (Guest) theo máy / IP
CREATE TABLE IF NOT EXISTS public.guest_rate_limits (
    ip_address TEXT PRIMARY KEY,
    message_count INTEGER DEFAULT 0 NOT NULL,
    max_limit INTEGER DEFAULT 8 NOT NULL,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    device_id TEXT
);

-- 2. Tắt Row-Level Security (RLS) để API Server (Anon Key) có quyền Đọc / Ghi / Cập nhật
-- (Tránh lỗi RLS 42501 "new row violates row-level security policy for table guest_rate_limits")
ALTER TABLE public.guest_rate_limits DISABLE ROW LEVEL SECURITY;

-- 3. Cấp toàn quyền cho các role anon, authenticated và service_role
GRANT ALL ON TABLE public.guest_rate_limits TO anon, authenticated, service_role;

-- 4. Tạo bảng analytics_events để lưu vết nhật ký tương tác (Telemetry Events)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    visitor_id TEXT,
    ip_address TEXT,
    user_id TEXT,
    path TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tắt RLS và cấp quyền cho bảng analytics_events
ALTER TABLE public.analytics_events DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.analytics_events TO anon, authenticated, service_role;

-- 6. Tạo index hỗ trợ tìm kiếm nhanh theo IP và thời gian
CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_last_msg ON public.guest_rate_limits (last_message_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON public.analytics_events (event_type, created_at DESC);

-- 7. Thêm chế độ bảo trì (Maintenance Mode) vào bảng system_config
ALTER TABLE public.system_config 
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'Hệ thống đang bảo trì nâng cấp, vui lòng quay lại sau';

-- 8. Thông báo hoàn tất
SELECT 'Thiết lập bảng guest_rate_limits, analytics_events và chế độ bảo trì thành công!' AS status;
