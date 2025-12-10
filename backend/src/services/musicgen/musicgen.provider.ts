import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';
import { TransitionRequest } from '../../models/transition.model.js';
import { generateWithHF } from './musicgen.hf.service.js';
import { generateWithLocal } from './musicgen.local.service.js';

/**
 * MusicGen provider abstraction
 * Routes to the appropriate implementation based on configuration
 */

export async function generateTransition(
  request: TransitionRequest
): Promise<Buffer> {
  // Check if AI provider is enabled
  if (env.AI_PROVIDER !== 'musicgen') {
    throw new MusicGenError(
      'AI provider is not enabled. Set AI_PROVIDER=musicgen in environment variables.',
      503,
      'PROVIDER_DISABLED'
    );
  }

  // Route to appropriate implementation
  switch (env.MUSICGEN_MODE) {
    case 'hf_api':
      logger.debug('Using Hugging Face API mode');
      return generateWithHF(request);

    case 'local':
      logger.debug('Using local service mode');
      return generateWithLocal(request);

    default:
      throw new MusicGenError(
        `Unknown MUSICGEN_MODE: ${env.MUSICGEN_MODE}. Use 'hf_api' or 'local'.`,
        500,
        'INVALID_MODE'
      );
  }
}


