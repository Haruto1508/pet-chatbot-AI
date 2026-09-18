/**
 * Route & Tab mapping configurations
 * Converts internal tab IDs to clean, SEO-friendly human URLs and vice versa.
 */

export const TAB_TO_PATH: Record<string, string> = {
  chat: '/chat',
  records: '/records',
  record_detail: '/record-detail',
  news: '/news',
  emergency: '/emergency',
  clinics: '/clinics',
  pets: '/pets',
  account: '/account',
  // Clean Admin routes (no underscores in URLs)
  admin_dashboard: '/admin/dashboard',
  admin_users: '/admin/users',
  admin_records: '/admin/records',
  admin_clinics: '/admin/clinics',
  admin_rag: '/admin/rag',
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
  '/emergency': 'emergency',
  '/clinics': 'clinics',
  '/pets': 'pets',
  '/account': 'account',
  // Clean Admin Routes
  '/admin': 'admin_dashboard',
  '/admin/': 'admin_dashboard',
  '/admin/dashboard': 'admin_dashboard',
  '/admin/users': 'admin_users',
  '/admin/records': 'admin_records',
  '/admin/clinics': 'admin_clinics',
  '/admin/rag': 'admin_rag',
  '/admin/evaluation': 'admin_eval',
  '/admin/eval': 'admin_eval',
  '/admin/config': 'admin_config',
  '/admin/health': 'admin_health',
  '/admin/logs': 'admin_logs',
  // Legacy paths with underscores (backward compatibility)
  '/admin_dashboard': 'admin_dashboard',
  '/admin_users': 'admin_users',
  '/admin_records': 'admin_records',
  '/admin_clinics': 'admin_clinics',
  '/admin_rag': 'admin_rag',
  '/admin_eval': 'admin_eval',
  '/admin_config': 'admin_config',
  '/admin_health': 'admin_health',
  '/admin_logs': 'admin_logs',
};

export const TAB_TITLES: Record<string, string> = {
  chat: 'Tư Vấn Bệnh Lý AI | Vethic AI',
  records: 'Hồ Sơ Bệnh Án | Vethic AI',
  record_detail: 'Chi Tiết Bệnh Án | Vethic AI',
  news: 'Cẩm Nang & Bệnh Lý Thú Y | Vethic AI',
  emergency: 'Sơ Cứu Khẩn Cấp 24/7 | Vethic AI',
  clinics: 'Tìm Phòng Khám Gần Nhất | Vethic AI',
  pets: 'Quản Lý Thú Cưng | Vethic AI',
  account: 'Cài Đặt Tài Khoản | Vethic AI',
  // Professional Admin Titles (no raw admin_dashboard)
  admin_dashboard: 'Bảng Điều Khiển Quản Trị | Vethic AI Admin',
  admin_users: 'Quản Lý Người Dùng | Vethic AI Admin',
  admin_records: 'Quản Lý Bệnh Án Toàn Hệ Thống | Vethic AI Admin',
  admin_clinics: 'Danh Sách Phòng Khám | Vethic AI Admin',
  admin_rag: 'Cơ Sở Tri Thức RAG & AI | Vethic AI Admin',
  admin_eval: 'Kiểm Định Chất Lượng AI | Vethic AI Admin',
  admin_config: 'Cấu Hình Hệ Thống AI & Model | Vethic AI Admin',
  admin_health: 'Kiểm Tra Kết Nối & Giữ Sống | Vethic AI Admin',
  admin_logs: 'Nhật Ký Hệ Thống (Audit Logs) | Vethic AI Admin',
  not_found: '404 Không Tìm Thấy Trang | Vethic AI',
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
