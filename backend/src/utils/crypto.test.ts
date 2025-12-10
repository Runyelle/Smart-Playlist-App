import { describe, it, expect } from 'vitest';
import { createHash, generateCodeVerifier, generateCodeChallenge } from './crypto.js';

describe('crypto utilities', () => {
  describe('createHash', () => {
    it('should create a deterministic hash', () => {
      const input = 'test-input';
      const hash1 = createHash(input);
      const hash2 = createHash(input);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex string
    });

    it('should create different hashes for different inputs', () => {
      const hash1 = createHash('input1');
      const hash2 = createHash('input2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateCodeVerifier', () => {
    it('should generate a code verifier', () => {
      const verifier = generateCodeVerifier();
      
      expect(verifier).toBeTruthy();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate different verifiers each time', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a code challenge from verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      
      expect(challenge).toBeTruthy();
      expect(challenge).not.toBe(verifier);
    });

    it('should generate the same challenge for the same verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);
      
      expect(challenge1).toBe(challenge2);
    });
  });
});


