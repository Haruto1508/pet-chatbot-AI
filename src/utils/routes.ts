/**
 * Route & Tab mapping configurations
 * Converts internal tab IDs to clean, SEO-friendly human URLs and vice versa.
 */

export const TAB_TO_PATH: Record<string, string> = {
  chat: '/chat',
  records: '/records',
  record_detail: '/record-detail',
  news: '/news',
  emergency: '/news',
  clinics: '/clinics',
  pets: '/pets',
  account: '/account',
  // Clean Admin routes (no underscores in URLs)
  admin_dashboard: '/admin/dashboard',
  admin_users: '/admin/users',
  admin_articles: '/admin/articles',
  admin_records: '/admin/records',
  admin_clinics: '/admin/clinics',
  admin_eval: '/admin/evaluation',
  admin_config: '/admin/config',
  admin_health: '/admin/health',
  admin_logs: '/admin/logs',
};

export const PATH_TO_TAB: Record<string, string> = {
  '': 'chat',
  '/': 'chat',
  '/chat': 'chat',
  '/records': 'records',
  '/record-detail': 'record_detail',
  '/record_detail': 'record_detail',
  '/news': 'news',
  '/emergency': 'news',
  '/clinics': 'clinics',
  '/pets': 'pets',
  '/account': 'account',
  // Clean Admin Routes
  '/admin': 'admin_dashboard',
  '/admin/': 'admin_dashboard',
  '/admin/dashboard': 'admin_dashboard',
  '/admin/users': 'admin_users',
  '/admin/articles': 'admin_articles',
  '/admin/records': 'admin_records',
  '/admin/clinics': 'admin_clinics',
  '/admin/rag': 'admin_articles',
  '/admin/evaluation': 'admin_eval',
  '/admin/eval': 'admin_eval',
  '/admin/config': 'admin_config',
  '/admin/health': 'admin_health',
  '/admin/logs': 'admin_logs',
  // Legacy paths with underscores (backward compatibility)
  '/admin_dashboard': 'admin_dashboard',
  '/admin_users': 'admin_users',
  '/admin_articles': 'admin_articles',
  '/admin_records': 'admin_records',
  '/admin_clinics': 'admin_clinics',
  '/admin_rag': 'admin_articles',
  '/admin_eval': 'admin_eval',
  '/admin_config': 'admin_config',
  '/admin_health': 'admin_health',
  '/admin_logs': 'admin_logs',
};

export const TAB_TITLES: Record<string, string> = {
  chat: 'Tư Vấn Bệnh Lý AI | Vethic AI',
  records: 'Hồ Sơ Bệnh Án | Vethic AI',
  record_detail: 'Chi Tiết Bệnh Án | Vethic AI',
  news: 'Tin Tức & Sơ Cứu Khẩn Cấp 24/7 | Vethic AI',
  emergency: 'Tin Tức & Sơ Cứu Khẩn Cấp 24/7 | Vethic AI',
  clinics: 'Tìm Phòng Khám Gần Nhất | Vethic AI',
  pets: 'Quản Lý Thú Cưng | Vethic AI',
  account: 'Cài Đặt Tài Khoản | Vethic AI',
  // Professional Admin Titles (no raw admin_dashboard)
  admin_dashboard: 'Bảng Điều Khiển Quản Trị | Vethic AI Admin',
  admin_users: 'Quản Lý Người Dùng | Vethic AI Admin',
  admin_articles: 'Quản Lý Bài Viết & Sơ Cứu | Vethic AI Admin',
  admin_records: 'Quản Lý Bệnh Án Toàn Hệ Thống | Vethic AI Admin',
  admin_clinics: 'Danh Sách Phòng Khám | Vethic AI Admin',
  admin_eval: 'Kiểm Định Chất Lượng AI | Vethic AI Admin',
  admin_config: 'Cấu Hình Hệ Thống AI & Model | Vethic AI Admin',
  admin_health: 'Kiểm Tra Kết Nối & Giữ Sống | Vethic AI Admin',
  admin_logs: 'Nhật Ký Hệ Thống (Audit Logs) | Vethic AI Admin',
  not_found: '404 Không Tìm Thấy Trang | Vethic AI',
};

export const TAB_DESCRIPTIONS: Record<string, string> = {
  chat: 'Tư vấn sức khỏe, chẩn đoán triệu chứng chó mèo trực tuyến 24/7 với Bác sĩ Thú y AI Vethic.',
  records: 'Theo dõi lịch sử khám bệnh, chẩn đoán, điều trị và phác đồ y tế thú cưng của bạn.',
  record_detail: 'Xem chi tiết bệnh án điện tử, phân loại Triage y tế và hướng dẫn điều trị thú cưng.',
  news: 'Cẩm nang dinh dưỡng, phòng bệnh và hướng dẫn các bước sơ cứu khẩn cấp 24/7 chuẩn y khoa.',
  emergency: 'Hướng dẫn các bước sơ cứu khẩn cấp 24/7 khi thú cưng gặp nguy kịch, ngộ độc, co giật, sốc nhiệt.',
  clinics: 'Tìm kiếm phòng khám thú y, bệnh viện thú y cấp cứu 24/7 gần nhất có chỉ đường trên bản đồ.',
  pets: 'Quản lý hồ sơ sức khỏe, cân nặng, tiền sử tiêm phòng vắc-xin và dị ứng của thú cưng.',
  account: 'Cài đặt thông tin tài khoản, tùy chỉnh cấu hình và đồng bộ dữ liệu Vethic AI.',
  admin_dashboard: 'Trung tâm báo cáo thống kê, số lượng ca cấp cứu và biểu đồ tăng trưởng người dùng.',
  admin_users: 'Quản lý danh sách người dùng, phân quyền Admin và kiểm soát trạng thái tài khoản.',
  admin_articles: 'Quản lý cẩm nang bệnh lý, bài viết sơ cứu khẩn cấp và cơ sở tri thức RAG nội bộ.',
  admin_records: 'Quản lý toàn bộ hồ sơ bệnh án thú cưng và lịch sử phân loại Triage trên hệ thống.',
  admin_clinics: 'Cập nhật danh bạ phòng khám thú y đối tác và tọa độ Google Maps trên toàn quốc.',
  admin_eval: 'Trung tâm kiểm định chất lượng AI toàn diện theo chuẩn TorchMetrics, Cleanlab, Ragas và DeepEval.',
  admin_config: 'Tùy biến tham số mô hình AI, API Key pool, nhiệt độ và cơ chế dự phòng tự động.',
  admin_health: 'Kiểm tra trạng thái kết nối máy chủ Supabase, Render Python AI và Google Gemini Studio.',
  admin_logs: 'Theo dõi nhật ký hệ thống, lỗi mạng, thời gian phản hồi API và audit bảo mật.',
  not_found: 'Trang bạn tìm kiếm không tồn tại trên hệ thống Vethic AI.'
};

/**
 * Converts pathname into matching tab ID
 */
export function getTabFromPath(pathname: string): string {
  const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (PATH_TO_TAB[cleanPath]) {
    return PATH_TO_TAB[cleanPath];
  }
  // Try without leading slash
  const withSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return PATH_TO_TAB[withSlash] || 'not_found';
}

/**
 * Converts tab ID to modern URL path
 */
export function getPathFromTab(tab: string): string {
  return TAB_TO_PATH[tab] || `/${tab}`;
}
