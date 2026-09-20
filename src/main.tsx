import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// 🛡️ VETHIC AI CONSOLE SECURITY SYSTEM & CLEANUP
if (typeof window !== 'undefined') {
  try {
    console.clear();
  } catch { }

  console.log(
    '%c🛡️ VETHIC AI | HỆ THỐNG AN NINH & BẢO MẬT%c\n\n' +
    '%c⚠️ CẢNH BÁO: KHÔNG ĐƯỢC CHỈNH SỬA HOẶC CAN THIỆP MÃ NGUỒN TẠI ĐÂY!\n\n' +
    '%cKhu vực Console này được thiết kế dành riêng cho đội ngũ kỹ thuật Vethic AI.\n' +
    'Nghiêm cấm dán các đoạn mã script lạ (Self-XSS / Console Code Injection) hoặc can thiệp dữ liệu.\n' +
    'Mọi hành vi can thiệp trái phép đều được ghi nhận tự động bởi hệ thống bảo mật WAF & Anti-DDoS.',
    'color: #10b981; font-size: 22px; font-weight: 900; text-shadow: 0 2px 10px rgba(16,185,129,0.3);',
    '',
    'color: #ef4444; font-size: 15px; font-weight: 800; line-height: 1.5;',
    'color: #64748b; font-size: 13px; font-weight: 500; line-height: 1.6;'
  );

  // Silence noisy logs in production
  if (import.meta.env.PROD) {
    const noop = () => { };
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    const originalWarn = console.warn.bind(console);
    console.warn = (...args: any[]) => {
      const str = args.join(' ');
      if (str.includes('beforeinstallpromptevent') || str.includes('Banner not shown') || str.includes('vite:preloadError')) {
        return;
      }
      originalWarn(...args);
    };
  }
}

// Handle Vite dynamic chunk import preload errors globally (e.g. after a new Vercel deployment)
window.addEventListener('vite:preloadError', (event) => {
  const reloaded = sessionStorage.getItem('vite_preload_reloaded');
  if (!reloaded) {
    sessionStorage.setItem('vite_preload_reloaded', 'true');
    window.location.reload();
  }
});

// Clear preload flag on successful entry load
sessionStorage.removeItem('vite_preload_reloaded');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
