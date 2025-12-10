import { TransitionRequest } from '../../models/transition.model.js';

/**
 * Build structured prompts for MusicGen based on transition parameters
 */

export interface PromptParams {
  seconds: number;
  style: 'ambient' | 'lofi' | 'house' | 'cinematic';
  energy?: 'low-to-mid' | 'mid-to-high' | 'low' | 'mid' | 'high';
  tempo?: 'slow' | 'moderate' | 'fast';
}

/**
 * Build a descriptive prompt for MusicGen
 */
export function buildMusicGenPrompt(params: PromptParams): string {
  const { seconds, style, energy, tempo } = params;

  // Determine energy description
  let energyDesc = 'mid';
  if (energy) {
    if (energy === 'low-to-mid' || energy === 'low') energyDesc = 'low to mid';
    else if (energy === 'mid-to-high' || energy === 'high') energyDesc = 'mid to high';
  }

  // Determine tempo description
  let tempoDesc = 'gentle';
  if (tempo) {
    if (tempo === 'slow') tempoDesc = 'slow, gentle';
    else if (tempo === 'moderate') tempoDesc = 'moderate';
    else if (tempo === 'fast') tempoDesc = 'faster, energetic';
  }

  // Build style-specific elements
  const styleElements: Record<string, string> = {
    ambient: 'atmospheric pads, subtle textures, no vocals, minimal percussion',
    lofi: 'warm vinyl crackle, soft piano, gentle drums, nostalgic',
    house: 'pulsing bass, four-on-the-floor rhythm, synth stabs, danceable',
    cinematic: 'orchestral swells, dramatic strings, epic atmosphere, emotional',
  };

  const styleDesc = styleElements[style] || styleElements.ambient;

  // Construct the prompt
  return `${seconds}-second ${style} transition, smooth, ${styleDesc}, energy ${energyDesc}, ${tempoDesc} tempo shift, seamless blend, no abrupt changes`;
}

/**
 * Derive prompt parameters from transition request
 */
export function derivePromptParams(request: TransitionRequest): PromptParams {
  const seconds = request.seconds || 5;
  const style = request.style || 'ambient';

  // Derive energy from overrides
  let energy: PromptParams['energy'] = 'mid-to-high';
  if (request.overrides?.energy !== undefined) {
    const energyValue = request.overrides.energy;
    if (energyValue < 0.3) energy = 'low';
    else if (energyValue < 0.5) energy = 'low-to-mid';
    else if (energyValue < 0.7) energy = 'mid';
    else energy = 'mid-to-high';
  }

  // Derive tempo from overrides
  let tempo: PromptParams['tempo'] = 'moderate';
  if (request.overrides?.tempo !== undefined) {
    const tempoValue = request.overrides.tempo;
    if (tempoValue < 0.4) tempo = 'slow';
    else if (tempoValue < 0.7) tempo = 'moderate';
    else tempo = 'fast';
  }

  return {
    seconds,
    style,
    energy,
    tempo,
  };
}


