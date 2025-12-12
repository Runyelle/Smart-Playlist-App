import fetch from 'node-fetch';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';
import { buildMusicGenPrompt, derivePromptParams } from './musicgen.prompt.js';
import { TransitionRequest } from '../../models/transition.model.js';

/**
 * Hugging Face Inference API service for MusicGen
 * This is the recommended mode for MVP as it doesn't require local GPU setup
 */

export interface MusicGenResponse {
  audio: string; // Base64 encoded audio
}

/**
 * Generate transition audio using Hugging Face Inference API
 */
export async function generateWithHF(
  request: TransitionRequest
): Promise<Buffer> {
  if (!env.HUGGINGFACE_API_KEY) {
    throw new MusicGenError(
      'HUGGINGFACE_API_KEY is required for HF API mode',
      500,
      'MISSING_API_KEY'
    );
  }

  const promptParams = derivePromptParams(request);
  const prompt = buildMusicGenPrompt(promptParams);

  // Build endpoint URL
  // Hugging Face has migrated to router-based Inference Providers API
  // Old endpoint (api-inference.huggingface.co) returns 410 Gone
  // New format: https://router.huggingface.co/<provider>/models/<model-id>
  // For Hugging Face's own inference service, use 'hf-inference' as provider
  const endpoint =
    env.MUSICGEN_ENDPOINT ||
    `https://router.huggingface.co/hf-inference/models/${env.MUSICGEN_MODEL_ID}`;

  logger.info(
    {
      endpoint,
      prompt,
      seconds: promptParams.seconds,
      style: promptParams.style,
    },
    'Generating transition with Hugging Face API'
  );

  try {
    console.log('Making Hugging Face API request to:', endpoint);
    console.log('Request payload:', {
      inputs: prompt.substring(0, 100) + '...',
      parameters: {
        duration: promptParams.seconds,
      },
    });
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            duration: promptParams.seconds,
          },
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HF API error: ${response.status}`;
        let statusCode = response.status;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorText || errorMessage;
          
          // Handle specific Hugging Face API errors
          if (response.status === 410) {
            errorMessage = `The endpoint is no longer available (410 Gone). This model may require a dedicated Inference Endpoint. Please create one at https://huggingface.co/inference-endpoints and set MUSICGEN_ENDPOINT in your .env file.`;
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
        
        console.error('HF API request failed:', {
          status: response.status,
          errorText,
          parsedMessage: errorMessage,
        });
        
        logger.error(
          { status: response.status, error: errorText, parsedMessage: errorMessage },
          'HF API request failed'
        );
        throw new MusicGenError(
          errorMessage,
          statusCode,
          response.status === 410 ? 'MODEL_DEPRECATED' : 
          response.status === 503 ? 'MODEL_LOADING' : 
          response.status === 429 ? 'RATE_LIMIT' : 'HF_API_ERROR'
        );
      }

      // HF API returns audio as binary (WAV format)
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      logger.info(
        { size: audioBuffer.length, prompt },
        'Successfully generated transition audio'
      );

      return audioBuffer;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof MusicGenError) {
      throw error;
    }

    // Log detailed error information
    console.error('Hugging Face API call failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      endpoint,
      prompt: prompt.substring(0, 100) + '...', // Log first 100 chars of prompt
    });
    
    logger.error({ error, prompt, endpoint }, 'Failed to generate transition with HF API');
    
    // Handle specific error types
    if (error instanceof Error) {
      // Check for abort signal (timeout)
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        throw new MusicGenError(
          'Request to Hugging Face API timed out. The model may be loading or processing. Please try again.',
          504,
          'TIMEOUT'
        );
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new MusicGenError(
          'Request to Hugging Face API timed out. The model may be loading or processing. Please try again.',
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
      `Failed to generate transition: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

