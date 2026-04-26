/**
 * Authentication utilities for Cloudflare Workers using Web Crypto API.
 */

const PBKDF2_ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';
const SALT_SIZE = 16;
const KEY_SIZE = 32;

/**
 * Generates a random salt.
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_SIZE));
}

/**
 * Converts a buffer to a hex string.
 */
function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hex string to a buffer.
 */
function hexToBuf(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
}

/**
 * Hashes a password using PBKDF2.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const passwordBuf = new TextEncoder().encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuf,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    baseKey,
    KEY_SIZE * 8
  );

  return `pbkdf2:${bufToHex(salt)}:${bufToHex(derivedBits)}`;
}

/**
 * Verifies a password against a stored string (supports both PBKDF2 and plaintext).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // If stored value starts with pbkdf2: prefix, it's a hashed password
  if (stored.startsWith('pbkdf2:')) {
    const [, saltHex, hashHex] = stored.split(':');
    const salt = hexToBuf(saltHex);
    const storedHash = hexToBuf(hashHex);
    
    const passwordBuf = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuf,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: PBKDF2_ITERATIONS,
        hash: HASH_ALGO,
      },
      baseKey,
      KEY_SIZE * 8
    );

    const derivedBytes = new Uint8Array(derivedBits);
    if (derivedBytes.length !== storedHash.length) return false;
    
    // Constant-time comparison
    let equal = 0;
    for (let i = 0; i < derivedBytes.length; i++) {
      equal |= derivedBytes[i] ^ storedHash[i];
    }
    return equal === 0;
  }
  
  // Otherwise, fallback to plaintext comparison for legacy users
  return password === stored;
}

/**
 * Generates a UUID v4 with a 'u-' prefix.
 */
export function generateUserId(): string {
  return `u-${crypto.randomUUID()}`;
}

/**
 * Creates a simple base64 session token from user ID.
 */
export function createSessionToken(userId: string): string {
  return btoa(userId);
}

/**
 * Parses a simple base64 session token back to user ID.
 */
export function parseSessionToken(token: string): string | null {
  try {
    return atob(token);
  } catch {
    return null;
  }
}
