import fetch from 'node-fetch';
import { TransitionRequest } from '../../models/transition.model.js';
import { generateFalStableAudioClip } from './falStableAudio.client.js';
import { buildStableAudioPrompt } from './stableAudio.prompt.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MusicGenError } from '../../utils/errors.js';

/**
 * Stable Audio service
 * Generates transition audio using fal.ai Stable Audio
 */
export async function generateWithStableAudio(
  request: TransitionRequest
): Promise<Buffer> {
  const seconds = request.seconds || env.DEFAULT_TRANSITION_SECONDS;
  const prompt = buildStableAudioPrompt(request);

  // Generate audio using fal.ai
  const { url: audioUrl } = await generateFalStableAudioClip({
    prompt,
    seconds,
    steps: 100, // Default steps for stable audio
  });

  // Download the audio file from fal.ai URL
  logger.info({ audioUrl }, 'Downloading audio from fal.ai');

  try {
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new MusicGenError(
        `Failed to download audio from fal.ai: ${response.status} ${response.statusText}`,
        response.status,
        'DOWNLOAD_ERROR'
      );
    }

    // Log response headers for debugging
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    logger.debug(
      { contentType, contentLength, audioUrl },
      'Audio download response headers'
    );

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Validate audio buffer - check if it's a valid WAV file (starts with RIFF)
    if (audioBuffer.length < 12) {
      logger.error({ size: audioBuffer.length }, 'Downloaded file is too small to be valid audio');
      throw new MusicGenError(
        'Downloaded audio file is too small or invalid',
        500,
        'INVALID_AUDIO'
      );
    }

    // Check WAV file signature (RIFF...WAVE)
    const header = audioBuffer.toString('ascii', 0, 4);
    const format = audioBuffer.toString('ascii', 8, 12);
    
    // Check WAV file duration from header (bytes 4-7 contain file size, bytes 40-43 contain data chunk size)
    // For a proper WAV file, we can estimate duration from data chunk size
    let estimatedDuration = 0;
    if (header === 'RIFF' && format === 'WAVE' && audioBuffer.length >= 44) {
      // Read data chunk size (usually at offset 40-43, but we need to find the 'data' chunk)
      // Simple check: look for 'data' chunk and read its size
      for (let i = 12; i < audioBuffer.length - 8; i++) {
        const chunkId = audioBuffer.toString('ascii', i, i + 4);
        if (chunkId === 'data') {
          const dataSize = audioBuffer.readUInt32LE(i + 4);
          // Assuming 16-bit stereo at 44100 Hz: duration = dataSize / (2 channels * 2 bytes * 44100 Hz)
          estimatedDuration = dataSize / (2 * 2 * 44100);
          break;
        }
      }
    }
    
    logger.info(
      { 
        header, 
        format, 
        size: audioBuffer.length,
        estimatedDurationSeconds: estimatedDuration.toFixed(2)
      },
      'Audio file validation'
    );

    if (header !== 'RIFF' || format !== 'WAVE') {
      logger.warn(
        { header, format, size: audioBuffer.length },
        'Downloaded file may not be a valid WAV file'
      );
      // Don't throw - some audio formats might work, but log a warning
    }

    // Warn if estimated duration is 0 or very short
    if (estimatedDuration < 0.1) {
      logger.warn(
        { estimatedDuration, size: audioBuffer.length },
        'Audio file appears to have very short or zero duration - may be silent or corrupted'
      );
    }

    logger.info(
      { size: audioBuffer.length, contentType, audioUrl },
      'Successfully downloaded audio from fal.ai'
    );

    return audioBuffer;
  } catch (error) {
    if (error instanceof MusicGenError) {
      throw error;
    }

    logger.error({ error, audioUrl }, 'Failed to download audio from fal.ai');

    throw new MusicGenError(
      `Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'DOWNLOAD_ERROR'
    );
  }
}

