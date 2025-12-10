import { describe, it, expect } from 'vitest';
import { createCacheKey } from './transitions.service.js';
import type { TransitionRequest } from '../models/transition.model.js';

describe('transitions service', () => {
  describe('createCacheKey', () => {
    it('should create deterministic cache keys', () => {
      const request: TransitionRequest = {
        trackA: { id: 'track1', name: 'Track A' },
        trackB: { id: 'track2', name: 'Track B' },
        seconds: 5,
        style: 'ambient',
      };

      const key1 = createCacheKey(request);
      const key2 = createCacheKey(request);

      expect(key1).toBe(key2);
    });

    it('should create different keys for different requests', () => {
      const request1: TransitionRequest = {
        trackA: { id: 'track1', name: 'Track A' },
        trackB: { id: 'track2', name: 'Track B' },
        seconds: 5,
        style: 'ambient',
      };

      const request2: TransitionRequest = {
        trackA: { id: 'track1', name: 'Track A' },
        trackB: { id: 'track2', name: 'Track B' },
        seconds: 6, // Different seconds
        style: 'ambient',
      };

      const key1 = createCacheKey(request1);
      const key2 = createCacheKey(request2);

      expect(key1).not.toBe(key2);
    });

    it('should include overrides in cache key', () => {
      const request1: TransitionRequest = {
        trackA: { id: 'track1', name: 'Track A' },
        trackB: { id: 'track2', name: 'Track B' },
        overrides: { tempo: 0.5 },
      };

      const request2: TransitionRequest = {
        trackA: { id: 'track1', name: 'Track A' },
        trackB: { id: 'track2', name: 'Track B' },
        overrides: { tempo: 0.7 }, // Different tempo
      };

      const key1 = createCacheKey(request1);
      const key2 = createCacheKey(request2);

      expect(key1).not.toBe(key2);
    });
  });
});


