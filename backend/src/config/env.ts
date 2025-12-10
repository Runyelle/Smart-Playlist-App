import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment configuration schema with zod validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('4000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),

  // Spotify OAuth
  SPOTIFY_CLIENT_ID: z.string().min(1, 'SPOTIFY_CLIENT_ID is required'),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().url(),
  SPOTIFY_SCOPES: z.string().default('playlist-read-private playlist-read-collaborative'),

  // Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // AI Provider
  AI_PROVIDER: z.enum(['musicgen', 'none']).default('musicgen'),
  MUSICGEN_MODE: z.enum(['hf_api', 'local']).default('hf_api'),

  // Hugging Face API
  HUGGINGFACE_API_KEY: z.string().optional(),
  MUSICGEN_MODEL_ID: z.string().default('facebook/musicgen-small'),
  MUSICGEN_ENDPOINT: z.string().url().optional(),

  // Default generation controls
  DEFAULT_TRANSITION_SECONDS: z.string().transform(Number).pipe(z.number().int().min(3).max(8)).default('5'),
  DEFAULT_TRANSITION_STYLE: z.enum(['ambient', 'lofi', 'house', 'cinematic']).default('ambient'),

  // File storage
  TRANSITIONS_DIR: z.string().default('./tmp/transitions'),
});

/**
 * Validated environment configuration
 * Throws error if required variables are missing or invalid
 */
export const env = envSchema.parse(process.env);

/**
 * Type-safe environment configuration
 */
export type Env = z.infer<typeof envSchema>;


