import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';
import { TransitionRequest } from '../../models/transition.model.js';
import { generateWithStableAudio } from '../stableAudio/stableAudio.service.js';
import { generateWithHF } from './musicgen.hf.service.js';
import { generateWithLocal } from './musicgen.local.service.js';

/**
 * AI provider abstraction
 * Routes to the appropriate implementation based on configuration
 */

export async function generateTransition(
  request: TransitionRequest
): Promise<Buffer> {
  // Route based on AI_PROVIDER
  switch (env.AI_PROVIDER) {
    case 'stable_audio':
      logger.debug('Using Stable Audio MVP via Hugging Face API');
      return generateWithStableAudio(request);

    case 'musicgen':
      // Legacy MusicGen support
      // If MUSICGEN_MODE is not set or invalid, fall back to stable_audio
      if (!env.MUSICGEN_MODE) {
        logger.warn(
          'MUSICGEN_MODE is not set but AI_PROVIDER=musicgen. Falling back to Stable Audio MVP. Set AI_PROVIDER=stable_audio in your .env file to use Stable Audio MVP directly.'
        );
        return generateWithStableAudio(request);
      }

      switch (env.MUSICGEN_MODE) {
        case 'hf_api':
          logger.debug('Using Hugging Face API mode (MusicGen)');
          // Check if API key is available, if not fall back to stable_audio
          if (!env.HUGGINGFACE_API_KEY) {
            logger.warn(
              'HUGGINGFACE_API_KEY is not set but MUSICGEN_MODE=hf_api. Falling back to Stable Audio MVP. Please set HUGGINGFACE_API_KEY in your .env file.'
            );
            return generateWithStableAudio(request);
          }
          return generateWithHF(request);

        case 'local':
          logger.debug('Using local service mode (MusicGen)');
          return generateWithLocal(request);

        case 'none':
          throw new MusicGenError(
            'MusicGen is disabled. Set MUSICGEN_MODE to a valid provider or set AI_PROVIDER=stable_audio to use Stable Audio MVP.',
            503,
            'PROVIDER_DISABLED'
          );

        default:
          logger.warn(
            `Unknown MUSICGEN_MODE: ${env.MUSICGEN_MODE}. Falling back to Stable Audio MVP.`
          );
          return generateWithStableAudio(request);
      }

    case 'none':
      throw new MusicGenError(
        'AI provider is disabled. Set AI_PROVIDER to a valid provider (stable_audio, musicgen, or none).',
        503,
        'PROVIDER_DISABLED'
      );

    default:
      throw new MusicGenError(
        `Unknown AI_PROVIDER: ${env.AI_PROVIDER}. Use 'stable_audio', 'musicgen', or 'none'.`,
        500,
        'INVALID_PROVIDER'
      );
  }
}


