import fetch from 'node-fetch';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';

/**
 * Stable Audio MVP client for Hugging Face Inference API
 */

export interface StableAudioOptions {
  prompt: string;
  seconds: number;
}

/**
 * Generate audio clip using Stable Audio MVP via Hugging Face Inference API
 */
export async function generateStableAudioClip(
  options: StableAudioOptions
): Promise<Buffer> {
  const modelId = env.STABLE_AUDIO_MODEL_ID;
  const apiKey = env.HUGGINGFACE_API_KEY;

  if (!modelId) {
    throw new MusicGenError(
      'STABLE_AUDIO_MODEL_ID is required for Stable Audio mode',
      500,
      'MISSING_CONFIG'
    );
  }

  if (!apiKey) {
    throw new MusicGenError(
      'HUGGINGFACE_API_KEY is required for Stable Audio mode',
      500,
      'MISSING_API_KEY'
    );
  }

  // Use direct api-inference endpoint for Stable Audio models
  // Note: Some models may require a dedicated Inference Endpoint if this returns 404/410
  const url = `https://api-inference.huggingface.co/models/${modelId}`;

  logger.info(
    {
      modelId,
      prompt: options.prompt.substring(0, 100) + '...',
      seconds: options.seconds,
    },
    'Generating audio with Stable Audio MVP'
  );

  try {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: options.prompt,
          parameters: {
            audio_end_in_s: options.seconds,
            num_inference_steps: 150,
            guidance_scale: 7,
            num_waveforms_per_prompt: 1,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Hugging Face API error: ${response.status}`;
        let statusCode = response.status;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorText || errorMessage;

          // Handle specific Hugging Face API errors
          if (response.status === 404) {
            errorMessage = `Model not found (404). The model "${modelId}" may not be available on the free Inference API. Please verify the model ID is correct or create a dedicated Inference Endpoint at https://huggingface.co/inference-endpoints.`;
            statusCode = 404;
          } else if (response.status === 410) {
            errorMessage = `The endpoint is no longer available (410 Gone). This model may require a dedicated Inference Endpoint. Please create one at https://huggingface.co/inference-endpoints and set STABLE_AUDIO_ENDPOINT in your .env file.`;
            statusCode = 410;
          } else if (errorMessage.includes('Model') && errorMessage.includes('loading')) {
            errorMessage = 'The AI model is currently loading. Please try again in a few moments.';
            statusCode = 503; // Service Unavailable
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = 'Invalid or expired Hugging Face API key. Please check your HUGGINGFACE_API_KEY.';
          } else if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
            statusCode = 429;
          }
        } catch {
          // If error response isn't JSON, use the text as-is
          errorMessage = errorText || errorMessage;
        }

        logger.error(
          { status: response.status, error: errorText, parsedMessage: errorMessage },
          'Stable Audio API request failed'
        );

        throw new MusicGenError(
          errorMessage,
          statusCode,
          response.status === 404 ? 'MODEL_NOT_FOUND' :
          response.status === 410 ? 'ENDPOINT_DEPRECATED' :
          response.status === 503 ? 'MODEL_LOADING' :
          response.status === 429 ? 'RATE_LIMIT' : 'STABLE_AUDIO_ERROR'
        );
      }

      // Response returns audio bytes
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      logger.info(
        { size: audioBuffer.length, prompt: options.prompt.substring(0, 100) + '...' },
        'Successfully generated audio with Stable Audio MVP'
      );

      return audioBuffer;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof MusicGenError) {
      throw error;
    }

    logger.error({ error, prompt: options.prompt, modelId }, 'Failed to generate audio with Stable Audio');

    // Handle specific error types
    if (error instanceof Error) {
      // Check for abort signal (timeout)
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new MusicGenError(
          'Request to Stable Audio API timed out. The model may be loading or processing. Please try again.',
          504,
          'TIMEOUT'
        );
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new MusicGenError(
          'Request to Stable Audio API timed out. The model may be loading or processing. Please try again.',
          504,
          'TIMEOUT'
        );
      }
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new MusicGenError(
          'Cannot connect to Hugging Face API. Please check your internet connection.',
          503,
          'NETWORK_ERROR'
        );
      }
    }

    throw new MusicGenError(
      `Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'STABLE_AUDIO_ERROR'
    );
  }
}

