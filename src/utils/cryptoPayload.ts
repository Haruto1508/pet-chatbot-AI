/**
 * Robust Client-Server Payload Encryption Layer (ChaCha20 Stream Cipher)
 * Used to protect sensitive API responses from inspection in browser DevTools Network tab.
 * Zero external dependencies, deterministic cross-runtime compatibility (Node.js & Modern Browsers).
 */

function QR(x: Uint32Array, a: number, b: number, c: number, d: number) {
  x[a] = (x[a] + x[b]) >>> 0; x[d] ^= x[a]; x[d] = ((x[d] << 16) | (x[d] >>> 16)) >>> 0;
  x[c] = (x[c] + x[d]) >>> 0; x[b] ^= x[c]; x[b] = ((x[b] << 12) | (x[b] >>> 20)) >>> 0;
  x[a] = (x[a] + x[b]) >>> 0; x[d] ^= x[a]; x[d] = ((x[d] << 8) | (x[d] >>> 24)) >>> 0;
  x[c] = (x[c] + x[d]) >>> 0; x[b] ^= x[c]; x[b] = ((x[b] << 7) | (x[b] >>> 25)) >>> 0;
}

function chacha20Block(key: Uint32Array, counter: number, nonce: Uint32Array): Uint8Array {
  const state = new Uint32Array(16);
  // Constants: "expand 32-byte k"
  state[0] = 0x61707865;
  state[1] = 0x3320646e;
  state[2] = 0x79622d32;
  state[3] = 0x6b206574;
  for (let i = 0; i < 8; i++) state[4 + i] = key[i];
  state[12] = counter >>> 0;
  state[13] = nonce[0];
  state[14] = nonce[1];
  state[15] = nonce[2];

  const working = new Uint32Array(state);
  for (let i = 0; i < 10; i++) {
    // Column rounds
    QR(working, 0, 4, 8, 12);
    QR(working, 1, 5, 9, 13);
    QR(working, 2, 6, 10, 14);
    QR(working, 3, 7, 11, 15);
    // Diagonal rounds
    QR(working, 0, 5, 10, 15);
    QR(working, 1, 6, 11, 12);
    QR(working, 2, 7, 8, 13);
    QR(working, 3, 4, 9, 14);
  }

  const out = new Uint8Array(64);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 16; i++) {
    outView.setUint32(i * 4, (working[i] + state[i]) >>> 0, true);
  }
  return out;
}

const SHARED_SECRET_KEY = 'vethic-security-2026-protect-ai-payload-key!';

function deriveKeyWords(): Uint32Array {
  const enc = new TextEncoder().encode(SHARED_SECRET_KEY);
  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = enc[i % enc.length] ^ (i * 19);
  }
  const view = new DataView(keyBytes.buffer);
  const keyWords = new Uint32Array(8);
  for (let i = 0; i < 8; i++) {
    keyWords[i] = view.getUint32(i * 4, true);
  }
  return keyWords;
}

const KEY_WORDS = deriveKeyWords();

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function chachaCrypt(input: Uint8Array, nonceBytes: Uint8Array): Uint8Array {
  const nonceView = new DataView(nonceBytes.buffer, nonceBytes.byteOffset, 12);
  const nonce = new Uint32Array([
    nonceView.getUint32(0, true),
    nonceView.getUint32(4, true),
    nonceView.getUint32(8, true)
  ]);

  const output = new Uint8Array(input.length);
  let counter = 1;
  for (let offset = 0; offset < input.length; offset += 64) {
    const keyStream = chacha20Block(KEY_WORDS, counter++, nonce);
    const chunkLen = Math.min(64, input.length - offset);
    for (let i = 0; i < chunkLen; i++) {
      output[offset + i] = input[offset + i] ^ keyStream[i];
    }
  }
  return output;
}

/**
 * Encrypt any JS object, array or string into a randomized Base64 ciphertext.
 */
export function encryptPayload(data: any): string {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const plaintext = new TextEncoder().encode(jsonStr);

  // 12-byte random nonce for semantic security (identical plaintexts generate different ciphertexts)
  const nonce = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(nonce);
  } else {
    for (let i = 0; i < 12; i++) nonce[i] = Math.floor(Math.random() * 256);
  }

  const ciphertext = chachaCrypt(plaintext, nonce);
  const combined = new Uint8Array(12 + ciphertext.length);
  combined.set(nonce, 0);
  combined.set(ciphertext, 12);

  return bytesToBase64(combined);
}

/**
 * Decrypt a Base64 ciphertext back to the original JS object or string.
 */
export function decryptPayload(cipherBase64: string): any {
  if (!cipherBase64 || typeof cipherBase64 !== 'string') return cipherBase64;
  try {
    const combined = base64ToBytes(cipherBase64);
    if (combined.length < 12) return cipherBase64;

    const nonce = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = chachaCrypt(ciphertext, nonce);
    const jsonStr = new TextDecoder().decode(plaintext);

    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  } catch (err) {
    console.warn('decryptPayload failure:', err);
    return cipherBase64;
  }
}

/**
 * Convenience helper to format an encrypted response envelope.
 */
export function secureResponse(data: any): { __enc: true; payload: string } {
  return {
    __enc: true,
    payload: encryptPayload(data)
  };
}
