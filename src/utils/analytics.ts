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

/**
 * Non-blocking event tracking helper for Vethic AI Analytics & Funnel Monitoring.
 * Tracks events: PAGE_VIEW, CHAT_OPEN, CHAT_MESSAGE_SENT, CHAT_SESSION_STARTED, LOGIN, REGISTER.
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  metadata?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getVisitorId();
    const payload = {
      eventType,
      visitorId,
      path: metadata?.path || window.location.pathname || '/',
      metadata: {
        ...metadata,
        url: window.location.href,
        referrer: document.referrer || '',
        screen: `${window.innerWidth}x${window.innerHeight}`
      },
      createdAt: new Date().toISOString()
    };

    const jsonStr = JSON.stringify(payload);

    // Prefer sendBeacon for unblocked telemetry, fallback to keepalive fetch
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      navigator.sendBeacon('/api/events', blob);
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Analytics failures must never interrupt user experience
  }
}
