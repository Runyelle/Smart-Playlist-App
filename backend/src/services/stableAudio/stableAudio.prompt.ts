import { TransitionRequest } from '../../models/transition.model.js';
import { env } from '../../config/env.js';

/**
 * Build prompts for Stable Audio MVP based on transition parameters
 */

/**
 * Convert numeric override value to descriptive text
 */
function describeEnergy(value: number): string {
  if (value < 0.3) return 'low';
  if (value < 0.5) return 'low-mid';
  if (value < 0.7) return 'mid';
  return 'high';
}

/**
 * Convert numeric tempo value to BPM-like description
 */
function describeTempo(value: number): string {
  // Map 0-1 range to approximate BPM range 60-180
  const bpm = Math.round(60 + value * 120);
  if (bpm < 80) return 'slow';
  if (bpm < 120) return 'moderate';
  if (bpm < 150) return 'upbeat';
  return 'fast';
}

/**
 * Build a descriptive prompt for Stable Audio MVP
 * Includes track names, artists, and transition characteristics
 */
export function buildStableAudioPrompt(request: TransitionRequest): string {
  const seconds = request.seconds || env.DEFAULT_TRANSITION_SECONDS;
  const style = request.style || env.DEFAULT_TRANSITION_STYLE;

  // Get track information
  const trackAName = request.trackA.name || 'Track A';
  const trackAArtist = request.trackA.artist || 'Unknown Artist';
  const trackBName = request.trackB.name || 'Track B';
  const trackBArtist = request.trackB.artist || 'Unknown Artist';

  // Derive energy and tempo descriptions from overrides
  // If overrides are provided, use them; otherwise use defaults
  const energyA = request.overrides?.energy !== undefined
    ? describeEnergy(request.overrides.energy)
    : 'mid';
  
  // For energyB, we can either use the same value (smooth transition) or derive a complementary value
  // For simplicity, we'll use a slightly higher energy for track B if not specified
  const energyB = request.overrides?.energy !== undefined
    ? describeEnergy(Math.min(1.0, request.overrides.energy + 0.2))
    : 'mid-high';

  const tempoA = request.overrides?.tempo !== undefined
    ? describeTempo(request.overrides.tempo)
    : 'moderate';
  
  const tempoB = request.overrides?.tempo !== undefined
    ? describeTempo(Math.min(1.0, request.overrides.tempo + 0.1))
    : 'moderate';

  // Build style-specific elements
  const styleElements: Record<string, string> = {
    ambient: 'atmospheric pads, subtle textures, no vocals, minimal percussion, ethereal',
    lofi: 'warm vinyl crackle, soft piano, gentle drums, nostalgic, cozy',
    house: 'pulsing bass, four-on-the-floor rhythm, synth stabs, danceable, energetic',
    cinematic: 'orchestral swells, dramatic strings, epic atmosphere, emotional, grand',
  };

  const styleDesc = styleElements[style] || styleElements.ambient;

  // Construct the prompt following the user's pattern
  return `${seconds}-second ${style} transition between the songs '${trackAName}' by ${trackAArtist} and '${trackBName}' by ${trackBArtist}. Smooth, no vocals, gentle energy change from ${energyA} to ${energyB}, tempo moving from ${tempoA} to ${tempoB}. ${styleDesc}, seamless blend, no abrupt changes.`;
}

