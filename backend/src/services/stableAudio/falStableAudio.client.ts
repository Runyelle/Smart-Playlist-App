import { fal } from '@fal-ai/client';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';

/**
 * fal.ai Stable Audio client
 */

export interface FalStableAudioOptions {
  prompt: string;
  seconds: number;
  steps?: number;
}

export interface FalStableAudioResult {
  url: string;
}

/**
 * Generate audio clip using fal.ai Stable Audio API
 */
export async function generateFalStableAudioClip(
  options: FalStableAudioOptions
): Promise<FalStableAudioResult> {
  const falKey = env.FAL_KEY;
  const modelId = env.FAL_STABLE_AUDIO_MODEL;

  if (!falKey) {
    throw new MusicGenError(
      'FAL_KEY is required for Stable Audio mode',
      500,
      'MISSING_CONFIG'
    );
  }

  if (!modelId) {
    throw new MusicGenError(
      'FAL_STABLE_AUDIO_MODEL is required for Stable Audio mode',
      500,
      'MISSING_CONFIG'
    );
  }

  // Configure fal.ai client
  fal.config({
    credentials: falKey,
  });

  logger.info(
    {
      modelId,
      prompt: options.prompt.substring(0, 100) + '...',
      seconds: options.seconds,
      steps: options.steps ?? 100,
    },
    'Generating audio with fal.ai Stable Audio'
  );

  try {
    // fal.ai stable-audio API parameters
    // Note: Parameter names may vary - checking documentation
    const inputParams: Record<string, any> = {
      prompt: options.prompt,
      seconds_total: options.seconds,
      steps: options.steps ?? 100,
    };

    logger.info({ modelId, inputParams }, 'Calling fal.ai API with parameters');

    const result = await fal.subscribe(modelId, {
      input: inputParams,
      logs: true, // Enable logs to see what's happening
    });

    // Log full response for debugging
    logger.debug({ result: JSON.stringify(result, null, 2) }, 'fal.ai API response');

    // Extract audio URL from response - check multiple possible response structures
    let audioUrl: string | undefined;
    
    if (result.data?.audio_file?.url) {
      audioUrl = result.data.audio_file.url;
    } else if (result.data?.audio?.url) {
      audioUrl = result.data.audio.url;
    } else if (result.data?.url) {
      audioUrl = result.data.url;
    } else if (typeof result.data === 'string') {
      // Sometimes the response is just a URL string
      audioUrl = result.data;
    }

    if (!audioUrl) {
      logger.error({ result: JSON.stringify(result, null, 2) }, 'fal.ai response missing audio URL');
      throw new MusicGenError(
        'fal.ai response did not contain audio URL. Check response structure.',
        500,
        'INVALID_RESPONSE'
      );
    }

    logger.info(
      {
        audioUrl,
        prompt: options.prompt.substring(0, 100) + '...',
      },
      'Successfully generated audio with fal.ai Stable Audio'
    );

    return { url: audioUrl };
  } catch (error: any) {
    if (error instanceof MusicGenError) {
      throw error;
    }

    logger.error(
      { error, prompt: options.prompt, modelId },
      'Failed to generate audio with fal.ai Stable Audio'
    );

    // Handle fal.ai ApiError specifically
    if (error?.name === 'ApiError' || error?.status) {
      const status = error.status || 500;
      let errorMessage = error.message || 'Unknown error';
      let statusCode = status;

      // Extract detail from error body if available
      if (error.body?.detail) {
        errorMessage = error.body.detail;
      } else if (error.body?.error) {
        errorMessage = error.body.error;
      } else if (error.body?.message) {
        errorMessage = error.body.message;
      }

      // Handle specific status codes
      if (status === 403) {
        // Check if it's a balance/quota issue
        if (errorMessage.includes('balance') || errorMessage.includes('locked') || errorMessage.includes('Exhausted')) {
          throw new MusicGenError(
            `fal.ai account balance exhausted. ${errorMessage}. Please top up your balance at https://fal.ai/dashboard/billing.`,
            403,
            'BALANCE_EXHAUSTED'
          );
        }
        throw new MusicGenError(
          `Access denied: ${errorMessage}`,
          403,
          'ACCESS_DENIED'
        );
      } else if (status === 401) {
        throw new MusicGenError(
          'Invalid or expired fal.ai API key. Please check your FAL_KEY.',
          401,
          'AUTHENTICATION_ERROR'
        );
      } else if (status === 429) {
        throw new MusicGenError(
          'Rate limit exceeded. Please wait a moment before trying again.',
          429,
          'RATE_LIMIT'
        );
      } else {
        throw new MusicGenError(
          `fal.ai API error (${status}): ${errorMessage}`,
          statusCode,
          'FAL_AI_ERROR'
        );
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        throw new MusicGenError(
          'Invalid or expired fal.ai API key. Please check your FAL_KEY.',
          401,
          'AUTHENTICATION_ERROR'
        );
      }
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        throw new MusicGenError(
          'Rate limit exceeded. Please wait a moment before trying again.',
          429,
          'RATE_LIMIT'
        );
      }
    }

    throw new MusicGenError(
      `Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'FAL_AI_ERROR'
    );
  }
}

