import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file only
// backend/src/config/env.ts -> backend/ -> root/
const rootEnvPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: rootEnvPath });

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
  AI_PROVIDER: z.enum(['stable_audio', 'musicgen', 'none']).default('stable_audio'),

  // Stable Audio (required when AI_PROVIDER=stable_audio)
  // fal.ai configuration
  FAL_KEY: z.string().optional(),
  FAL_STABLE_AUDIO_MODEL: z.string().default('fal-ai/stable-audio'),
  // Legacy metadata (kept for documentation)
  STABLE_AUDIO_MODEL_ID: z.string().default('stabilityai/stable-audio-open-1.0'),
  HUGGINGFACE_API_KEY: z.string().optional(),

  // Legacy MusicGen support (deprecated - only used when AI_PROVIDER=musicgen)
  // Ignore invalid values since we're using stable_audio now
  MUSICGEN_MODE: z
    .string()
    .optional()
    .transform((val) => {
      // Only accept valid values, ignore invalid/legacy ones
      if (!val) return undefined;
      if (['hf_api', 'local', 'none'].includes(val)) {
        return val as 'hf_api' | 'local' | 'none';
      }
      // Invalid value - return undefined to ignore it
      return undefined;
    }),
  MUSICGEN_MODEL_ID: z.string().default('facebook/musicgen-small'),
  MUSICGEN_ENDPOINT: z.string().url().optional(),

  // Default generation controls
  DEFAULT_TRANSITION_SECONDS: z.string().transform(Number).pipe(z.number().int().min(3).max(8)).default('5'),
  DEFAULT_TRANSITION_STYLE: z.enum(['ambient', 'lofi', 'house', 'cinematic']).default('ambient'),

  // File storage
  TRANSITIONS_DIR: z.string().default('./tmp/transitions'),
}).superRefine((data, ctx) => {
  // Validate Stable Audio config when provider is stable_audio
  if (data.AI_PROVIDER === 'stable_audio') {
    if (!data.FAL_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FAL_KEY is required when AI_PROVIDER=stable_audio. Please set it in your .env file.',
        path: ['FAL_KEY'],
      });
    }
    if (!data.FAL_STABLE_AUDIO_MODEL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FAL_STABLE_AUDIO_MODEL is required when AI_PROVIDER=stable_audio',
        path: ['FAL_STABLE_AUDIO_MODEL'],
      });
    }
  }
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

