/**
 * Utility functions for managing, parsing, and masking API key pools.
 */

/**
 * Extracts and cleans a list of unique API keys from a comma-separated,
 * newline-separated, or array source.
 */
export function parseApiKeys(input?: any): string[] {
  if (!input) return [];

  let rawList: any[] = [];
  if (Array.isArray(input)) {
    // Flatten nested arrays and extract keys from each string
    const flattened = input.flat(Infinity).filter((item) => item != null && item !== '');
    rawList = flattened.flatMap(item => {
      if (typeof item === 'string') {
        // Extract Gemini keys (AIza... or AQ....) even if they are glued together without spaces
        const matches = item.match(/(?:AIza|AQ\.)[A-Za-z0-9_\-]{30,}/g);
        return matches || [];
      }
      return [item];
    });
  } else if (typeof input === 'string') {
    // Extract Gemini keys even if they are glued together
    const matches = input.match(/(?:AIza|AQ\.)[A-Za-z0-9_\-]{30,}/g);
    rawList = matches || [];
  } else {
    return [];
  }

  const cleaned = rawList
    .map(k => (k != null ? String(k).trim() : ''))
    // Ignore comments or empty tokens
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
