import fetch from 'node-fetch';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';
import { buildMusicGenPrompt, derivePromptParams } from './musicgen.prompt.js';
import { TransitionRequest } from '../../models/transition.model.js';

/**
 * Local Python microservice mode for MusicGen
 * Calls a FastAPI service running locally
 * 
 * See /ai/ directory for the Python service implementation
 */

const LOCAL_SERVICE_URL = 'http://localhost:5000/generate';

/**
 * Generate transition audio using local Python service
 */
export async function generateWithLocal(
  request: TransitionRequest
): Promise<Buffer> {
  const promptParams = derivePromptParams(request);
  const prompt = buildMusicGenPrompt(promptParams);

  logger.info(
    {
      url: LOCAL_SERVICE_URL,
      prompt,
      seconds: promptParams.seconds,
      style: promptParams.style,
    },
    'Generating transition with local MusicGen service'
  );

  try {
    const response = await fetch(LOCAL_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration: promptParams.seconds,
        style: promptParams.style,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { status: response.status, error: errorText },
        'Local service request failed'
      );
      throw new MusicGenError(
        `Local service error: ${response.status} - ${errorText}`,
        response.status
      );
    }

    // Local service returns audio as binary (WAV format)
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    logger.info(
      { size: audioBuffer.length, prompt },
      'Successfully generated transition audio from local service'
    );

    return audioBuffer;
  } catch (error) {
    if (error instanceof MusicGenError) {
      throw error;
    }

    // Check if it's a connection error (service not running)
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      throw new MusicGenError(
        'Local MusicGen service is not running. Please start the Python service.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    logger.error({ error, prompt }, 'Failed to generate transition with local service');
    throw new MusicGenError(
      `Failed to generate transition: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

