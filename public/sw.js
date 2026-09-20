// Vethic AI Lightweight Service Worker - Silent & Zero-Log Offline Fallback
self.addEventListener('install', (event) => {
  // Activate immediately without noisy pre-fetch network requests
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const CLEAN_OFFLINE_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Vethic AI | Hệ Thống Đang Bảo Trì Nâng Cấp</title>
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 28px;
      padding: 3rem 2rem;
      box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.06);
      text-align: center;
    }
    .logo-box {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.12);
    }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand { font-size: 1.25rem; font-weight: 900; color: #0f172a; margin-bottom: 0.85rem; }
    .brand span { color: #059669; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 1.25rem;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }
    h1 { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    p { color: #64748b; font-size: 0.925rem; font-weight: 500; margin-bottom: 1.75rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.8rem 1.5rem;
      border-radius: 14px;
      background: #059669;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-box">
      <img src="/logo.png" alt="Vethic AI" onerror="this.src='logo.png'" />
    </div>
    <div class="brand">Vethic <span>AI</span></div>
    <div class="badge"><span class="dot"></span>Bảo trì định kỳ</div>
    <h1>Hệ thống đang bảo trì nâng cấp</h1>
    <p>Vui lòng quay lại sau</p>
    <button class="btn" onclick="window.location.reload()">Tải lại trang</button>
  </div>
</body>
</html>`;

