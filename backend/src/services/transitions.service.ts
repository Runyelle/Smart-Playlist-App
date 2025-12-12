import { createHash } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { cacheService } from './cache.service.js';
import { generateTransition } from './musicgen/musicgen.provider.js';
import { saveAudioFile, audioFileExists } from '../utils/file.js';
import { generateRandomString } from '../utils/crypto.js';
import {
  setTransitionStatus,
  markTransitionReady,
  markTransitionFailed,
} from './transition-status.service.js';
import type { TransitionRequest, TransitionResponse } from '../models/transition.model.js';

/**
 * Transitions service
 * Handles generation and caching of transition audio
 */

/**
 * Create a deterministic cache key from transition request
 * Includes all parameters that affect the output: tracks, duration, style, and all overrides
 */
export function createCacheKey(request: TransitionRequest): string {
  const keyParts = [
    request.trackA.id,
    request.trackB.id,
    request.seconds || 5,
    request.style || 'ambient',
    // Include all override values (even if undefined, to ensure consistent hashing)
    request.overrides?.tempo?.toString() || '',
    request.overrides?.energy?.toString() || '',
    request.overrides?.speed?.toString() || '',
  ];

  const keyString = keyParts.join('|');
  return createHash(keyString);
}

/**
 * Generate transition ID
 */
function generateTransitionId(): string {
  return `trans_${generateRandomString(16)}`;
}

/**
 * Generate or retrieve cached transition
 */
export async function generateOrGetTransition(
  request: TransitionRequest
): Promise<TransitionResponse> {
  const cacheKey = createCacheKey(request);
  
  // Check cache first
  const cached = cacheService.get(cacheKey);
  if (cached) {
    // Verify file still exists
    const filename = `${cached.transitionId}.wav`;
    if (await audioFileExists(filename)) {
      logger.info({ cacheKey, transitionId: cached.transitionId }, 'Returning cached transition');
      return {
        transitionId: cached.transitionId,
        url: `/transitions/${cached.transitionId}`,
        cached: true,
      };
    } else {
      // File missing, remove from cache
      cacheService.delete(cacheKey);
      logger.warn({ cacheKey }, 'Cached file missing, regenerating');
    }
  }

  // Generate new transition
  logger.info({ cacheKey, request }, 'Generating new transition');

  // Generate transition ID early to track status
  const transitionId = generateTransitionId();
  setTransitionStatus(transitionId, 'PENDING');

  try {
    const audioBuffer = await generateTransition(request);

    // Save to file
  const filename = `${transitionId}.wav`;
  await saveAudioFile(filename, audioBuffer);

  // Store in cache
  cacheService.set(cacheKey, {
    transitionId,
    filePath: filename,
    createdAt: Date.now(),
  });

    // Mark as ready
    markTransitionReady(transitionId);

  logger.info({ transitionId, cacheKey }, 'Transition generated and cached');

  return {
    transitionId,
    url: `/transitions/${transitionId}`,
    cached: false,
  };
  } catch (error) {
    // Mark as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    markTransitionFailed(transitionId, errorMessage);
    throw error;
  }
}


