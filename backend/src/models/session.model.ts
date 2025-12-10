/**
 * File-based session store using local JSON file
 * Stores refresh tokens keyed by session ID
 * 
 * TODO: Upgrade to Redis or database for production
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';

export interface SessionData {
  refreshToken: string;
  userId?: string;
  expiresAt?: number;
}

const SESSIONS_FILE = join(process.cwd(), 'tmp', 'sessions.json');

class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private initialized = false;

  /**
   * Initialize session store - load from file
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure directory exists
      const dir = join(process.cwd(), 'tmp');
      await fs.mkdir(dir, { recursive: true });

      // Try to load existing sessions
      try {
        const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
        const sessions = JSON.parse(data) as Record<string, SessionData>;
        
        // Filter out expired sessions
        const now = Date.now();
        for (const [sessionId, sessionData] of Object.entries(sessions)) {
          if (!sessionData.expiresAt || sessionData.expiresAt > now) {
            this.sessions.set(sessionId, sessionData);
          }
        }

        // Save cleaned sessions back
        if (Object.keys(sessions).length !== this.sessions.size) {
          await this.persist();
        }
      } catch (error) {
        // File doesn't exist yet, that's okay
        logger.debug('No existing sessions file found, starting fresh');
      }

      this.initialized = true;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize session store');
      throw error;
    }
  }

  /**
   * Persist sessions to file
   */
  private async persist(): Promise<void> {
    try {
      const sessionsObj: Record<string, SessionData> = {};
      for (const [sessionId, data] of this.sessions.entries()) {
        sessionsObj[sessionId] = data;
      }
      await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessionsObj, null, 2), 'utf-8');
    } catch (error) {
      logger.error({ error }, 'Failed to persist sessions to file');
      // Don't throw - allow in-memory operation to continue
    }
  }

  /**
   * Store session data
   */
  async set(sessionId: string, data: SessionData): Promise<void> {
    await this.initialize();
    this.sessions.set(sessionId, data);
    await this.persist();
  }

  /**
   * Get session data
   */
  async get(sessionId: string): Promise<SessionData | undefined> {
    await this.initialize();
    const data = this.sessions.get(sessionId);
    
    // Check expiration
    if (data?.expiresAt && data.expiresAt < Date.now()) {
      await this.delete(sessionId);
      return undefined;
    }
    
    return data;
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<void> {
    await this.initialize();
    this.sessions.delete(sessionId);
    await this.persist();
  }

  /**
   * Check if session exists
   */
  async has(sessionId: string): Promise<boolean> {
    await this.initialize();
    return this.sessions.has(sessionId);
  }

  /**
   * Clear all sessions (useful for testing)
   */
  async clear(): Promise<void> {
    await this.initialize();
    this.sessions.clear();
    await this.persist();
  }

  /**
   * Get session count (for monitoring)
   */
  async size(): Promise<number> {
    await this.initialize();
    return this.sessions.size;
  }

  // Synchronous versions for backward compatibility (will initialize on first use)
  setSync(sessionId: string, data: SessionData): void {
    this.set(sessionId, data).catch((error) => {
      logger.error({ error }, 'Failed to set session synchronously');
    });
  }

  getSync(sessionId: string): SessionData | undefined {
    // For sync version, we'll use in-memory only
    // This is a fallback for code that hasn't been updated yet
    const data = this.sessions.get(sessionId);
    if (data?.expiresAt && data.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return data;
  }

  deleteSync(sessionId: string): void {
    this.delete(sessionId).catch((error) => {
      logger.error({ error }, 'Failed to delete session synchronously');
    });
  }
}

// Singleton instance
export const sessionStore = new SessionStore();


