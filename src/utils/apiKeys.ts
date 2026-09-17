/**
 * Utility functions for managing, parsing, and masking API key pools.
 */

/**
 * Extracts and cleans a list of unique API keys from a comma-separated,
 * newline-separated, or array source.
 */
export function parseApiKeys(input?: string | string[] | null): string[] {
  if (!input) return [];

  let rawList: string[] = [];
  if (Array.isArray(input)) {
    rawList = input;
  } else if (typeof input === 'string') {
    // Split by newline, comma, semicolon, or carriage return
    rawList = input.split(/[\r\n,;]+/);
  }

  const cleaned = rawList
    .map(k => k.trim())
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
