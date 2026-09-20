/**
 * Utility functions for managing, parsing, and masking API key pools.
 */

/**
 * Extracts and cleans a list of unique API keys from a comma-separated,
 * newline-separated, or array source.
 * Only accepts real Gemini API keys (AIzaSy...) | NOT OAuth tokens (AQ....).
 */
export function parseApiKeys(input?: any): string[] {
  if (!input) return [];

  // Only match real Gemini API keys starting with AIzaSy
  // AQ. keys are short-lived OAuth tokens that are NOT valid for API calls
  const GEMINI_KEY_REGEX = /AIzaSy[A-Za-z0-9_\-]{30,}/g;

  let rawList: any[] = [];
  if (Array.isArray(input)) {
    const flattened = input.flat(Infinity).filter((item) => item != null && item !== '');
    rawList = flattened.flatMap(item => {
      if (typeof item === 'string') {
        const matches = item.match(GEMINI_KEY_REGEX);
        return matches || [];
      }
      return [item];
    });
  } else if (typeof input === 'string') {
    const matches = input.match(GEMINI_KEY_REGEX);
    rawList = matches || [];
  } else {
    return [];
  }

  const cleaned = rawList
    .map(k => (k != null ? String(k).trim() : ''))
    .filter(k => k.length > 5 && !k.startsWith('#') && !k.startsWith('//'));

  // Deduplicate while preserving original order
  return Array.from(new Set(cleaned));
}

/**
 * Masks an API key for safe display in UI or logs.
 * e.g. "AIzaSyDNq...99Z1"
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Normalizes multiple keys into a clean, newline-separated string for textarea editing.
 */
export function formatKeysForDisplay(keys: string[] | string | undefined | null): string {
  const list = parseApiKeys(keys);
  return list.join('\n');
}
