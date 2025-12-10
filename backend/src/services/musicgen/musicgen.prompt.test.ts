import { describe, it, expect } from 'vitest';
import { buildMusicGenPrompt, derivePromptParams } from './musicgen.prompt.js';
import type { TransitionRequest } from '../../models/transition.model.js';

describe('musicgen prompt utilities', () => {
  describe('buildMusicGenPrompt', () => {
    it('should build a valid prompt', () => {
      const prompt = buildMusicGenPrompt({
        seconds: 5,
        style: 'ambient',
        energy: 'mid-to-high',
        tempo: 'moderate',
      });

      expect(prompt).toContain('5-second');
      expect(prompt).toContain('ambient');
      expect(prompt).toContain('transition');
    });

    it('should include style-specific elements', () => {
      const ambientPrompt = buildMusicGenPrompt({
        seconds: 5,
        style: 'ambient',
      });
      const lofiPrompt = buildMusicGenPrompt({
        seconds: 5,
        style: 'lofi',
      });

      expect(ambientPrompt).not.toBe(lofiPrompt);
      expect(lofiPrompt).toContain('lofi');
    });
  });

  describe('derivePromptParams', () => {
    it('should derive params from request', () => {
      const request: TransitionRequest = {
        trackA: { id: '1', name: 'A' },
        trackB: { id: '2', name: 'B' },
        seconds: 6,
        style: 'lofi',
      };

      const params = derivePromptParams(request);

      expect(params.seconds).toBe(6);
      expect(params.style).toBe('lofi');
    });

    it('should use defaults when not specified', () => {
      const request: TransitionRequest = {
        trackA: { id: '1', name: 'A' },
        trackB: { id: '2', name: 'B' },
      };

      const params = derivePromptParams(request);

      expect(params.seconds).toBe(5); // Default
      expect(params.style).toBe('ambient'); // Default
    });

    it('should derive energy from overrides', () => {
      const lowEnergyRequest: TransitionRequest = {
        trackA: { id: '1', name: 'A' },
        trackB: { id: '2', name: 'B' },
        overrides: { energy: 0.2 },
      };

      const highEnergyRequest: TransitionRequest = {
        trackA: { id: '1', name: 'A' },
        trackB: { id: '2', name: 'B' },
        overrides: { energy: 0.8 },
      };

      const lowParams = derivePromptParams(lowEnergyRequest);
      const highParams = derivePromptParams(highEnergyRequest);

      expect(lowParams.energy).toBe('low');
      expect(highParams.energy).toBe('mid-to-high');
    });
  });
});


