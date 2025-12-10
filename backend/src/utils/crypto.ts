import crypto from 'crypto';

/**
 * Cryptographic utility functions
 */

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a code verifier for PKCE (43-128 characters, URL-safe)
 */
export function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Generate a code challenge from a code verifier (SHA256 hash, base64url encoded)
 */
export function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
}

/**
 * Base64 URL-safe encoding (without padding)
 */
function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Create a deterministic hash for cache keys
 */
export function createHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}


