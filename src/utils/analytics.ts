import { AnalyticsEventType, AnalyticsEvent } from '../types';

const VISITOR_ID_KEY = 'vethic_visitor_id';

/**
 * Get or generate a persistent anonymous visitor ID for unique visitor counting.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return 'temp_' + Math.random().toString(36).substring(2, 10);
  }
}

// Dwell time & path cooldown tracker for accurate User Page Views
let pendingPageViewTimer: any = null;
const lastTrackedPaths: Record<string, number> = {};
const MIN_DWELL_MS = 3000;       // User must stay on page for at least 3s (prevents click spam / rapid tab switching)
const PATH_COOLDOWN_MS = 60000;  // 60s cooldown per path to prevent duplicate counts on roundtrips

/**
 * Schedule a user page view with dwell time and cooldown.
 * Strictly excludes Admin routes, Admin tabs, and Admin/Subadmin roles.
 * Returns a cancel callback for React useEffect cleanup.
 */
export function schedulePageView(
  tab: string,
  path: string,
  user?: { id?: string; role?: string }
): () => void {
  // Cancel previous pending timer if user navigated away quickly
  if (pendingPageViewTimer) {
    clearTimeout(pendingPageViewTimer);
    pendingPageViewTimer = null;
  }

  // 1. STRICTLY EXCLUDE ADMIN: Never record page views for admin areas or admin users
  const isAdminArea = 
    tab.startsWith('admin_') || 
    path.startsWith('/admin') ||
    user?.role === 'admin' ||
    user?.role === 'subadmin';

  if (isAdminArea) {
    return () => {};
  }

  // 2. CHECK COOLDOWN PER ROUTE (prevents counting when user clicks back and forth)
  const now = Date.now();
  const lastTracked = lastTrackedPaths[path] || 0;
  if (now - lastTracked < PATH_COOLDOWN_MS) {
    return () => {};
  }

  // 3. DWELL TIME: User must remain on the tab/page for at least MIN_DWELL_MS (3s)
  pendingPageViewTimer = setTimeout(() => {
    lastTrackedPaths[path] = Date.now();
    trackEvent('PAGE_VIEW', {
      tab,
      path,
      userId: user?.id && user.id !== 'guest' ? user.id : undefined,
      role: user?.role
    });
    pendingPageViewTimer = null;
  }, MIN_DWELL_MS);

  // Return cancel function for useEffect cleanup
  return () => {
    if (pendingPageViewTimer) {
      clearTimeout(pendingPageViewTimer);
      pendingPageViewTimer = null;
    }
  };
}

/**
 * Non-blocking event tracking helper for Vethic AI Analytics & Funnel Monitoring.
 * Tracks events: PAGE_VIEW, CHAT_OPEN, CHAT_MESSAGE_SENT, CHAT_SESSION_STARTED, LOGIN, REGISTER.
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  metadata?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const evPath = metadata?.path || (typeof window !== 'undefined' ? window.location.pathname : '') || '/';
  const tab = metadata?.tab || '';
  const role = metadata?.role || '';

  // Double-check: Never record PAGE_VIEW for admin paths or roles
  if (eventType === 'PAGE_VIEW') {
    if (evPath.startsWith('/admin') || tab.startsWith('admin_') || role === 'admin' || role === 'subadmin') {
      return;
    }
  }

  try {
    const visitorId = getVisitorId();
    const payload = {
      eventType,
      visitorId,
      path: evPath,
      metadata: {
        ...metadata,
        url: window.location.href,
        referrer: document.referrer || '',
        screen: `${window.innerWidth}x${window.innerHeight}`
      },
      createdAt: new Date().toISOString()
    };

    const jsonStr = JSON.stringify(payload);
    const endpoint = '/api/app-activity';

    // Prefer sendBeacon for non-blocking telemetry, fallback to keepalive fetch
    let sent = false;
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        sent = navigator.sendBeacon(endpoint, blob);
      } catch {
        sent = false;
      }
    }

    if (!sent && typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Activity tracking failures must never interrupt user experience
  }
}
