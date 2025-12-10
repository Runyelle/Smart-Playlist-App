import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * File system utility functions for managing generated transition audio files
 */

/**
 * Ensure the transitions directory exists
 */
export async function ensureTransitionsDir(): Promise<void> {
  try {
    await fs.mkdir(env.TRANSITIONS_DIR, { recursive: true });
  } catch (error) {
    logger.error({ error }, 'Failed to create transitions directory');
    throw error;
  }
}

/**
 * Save audio buffer to file
 */
export async function saveAudioFile(
  filename: string,
  audioBuffer: Buffer
): Promise<string> {
  await ensureTransitionsDir();
  const filePath = path.join(env.TRANSITIONS_DIR, filename);
  await fs.writeFile(filePath, audioBuffer);
  return filePath;
}

/**
 * Read audio file
 */
export async function readAudioFile(filename: string): Promise<Buffer> {
  const filePath = path.join(env.TRANSITIONS_DIR, filename);
  return fs.readFile(filePath);
}

/**
 * Check if audio file exists
 */
export async function audioFileExists(filename: string): Promise<boolean> {
  try {
    const filePath = path.join(env.TRANSITIONS_DIR, filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete audio file
 */
export async function deleteAudioFile(filename: string): Promise<void> {
  try {
    const filePath = path.join(env.TRANSITIONS_DIR, filename);
    await fs.unlink(filePath);
  } catch (error) {
    logger.warn({ error, filename }, 'Failed to delete audio file');
  }
}


