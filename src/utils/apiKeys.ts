/**
 * Utility functions for managing, parsing, and masking API key pools.
 */

/**
 * Extracts and cleans a list of unique API keys from a comma-separated,
 * newline-separated, or array source.
 * Accepts both legacy Gemini API keys (AIzaSy...) and modern Auth keys (AQ....).
 */
export function parseApiKeys(input?: any): string[] {
  if (!input) return [];

  // Match legacy Gemini API keys (AIza...) and new Google AI Studio Auth keys (AQ....)
  const GEMINI_KEY_REGEX = /(?:AIza[A-Za-z0-9_\-]{30,}|AQ\.[A-Za-z0-9._\-]{15,})/g;

  const isMaskedOrInvalid = (k?: string): boolean => {
    if (!k || typeof k !== 'string') return true;
    const trimmed = k.trim();
    if (trimmed.length < 20) return true;
    if (trimmed.includes('...') || trimmed.includes('***') || trimmed.includes('…')) return true;
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) return true;
    return false;
  };

  let rawList: any[] = [];
  if (Array.isArray(input)) {
    const flattened = input.flat(Infinity).filter((item) => item != null && item !== '');
    rawList = flattened.flatMap(item => {
      if (typeof item === 'string') {
        const matches = item.match(GEMINI_KEY_REGEX);
        if (matches && matches.length > 0) {
          return matches.filter(m => !isMaskedOrInvalid(m));
        }
        const trimmed = item.trim();
        return (!isMaskedOrInvalid(trimmed) && !trimmed.includes(' '))
          ? [trimmed]
          : [];
      }
      return [item];
    });
  } else if (typeof input === 'string') {
    const matches = input.match(GEMINI_KEY_REGEX);
    if (matches && matches.length > 0) {
      rawList = matches.filter(m => !isMaskedOrInvalid(m));
    } else {
      const trimmed = input.trim();
      if (!isMaskedOrInvalid(trimmed) && !trimmed.includes(' ')) {
        rawList = [trimmed];
      }
    }
  } else {
    return [];
  }

  const cleaned = rawList
    .map(k => (k != null ? String(k).trim() : ''))
    .filter(k => !isMaskedOrInvalid(k));

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
