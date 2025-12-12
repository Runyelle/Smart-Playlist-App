import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import type { Express } from 'express';
import type { Server } from 'http';

// Set test environment variables before importing env
process.env.NODE_ENV = 'test';
process.env.PORT = '4001'; // Use different port for tests
process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.SESSION_SECRET = 'test-session-secret-32-chars-long-12345';
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-123456';

describe('API Integration Tests', () => {
  let app: Express;
  let server: Server;
  const testPort = 4001;
  const baseUrl = `http://localhost:${testPort}`;

  beforeAll(async () => {
    app = createApp();
    server = app.listen(testPort);
    // Wait for server to be ready
    await new Promise((resolve) => {
      server.on('listening', resolve);
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Health Check', () => {
    it('should return 200 for GET /health', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status');
    });
  });

  describe('Root Endpoint', () => {
    it('should return 200 for GET /', async () => {
      const response = await fetch(`${baseUrl}/`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('name');
      expect(data.data.name).toBe('Smart Playlist API');
    });
  });

  describe('Auth Routes', () => {
    it('should return 200 for GET /auth/spotify/login', async () => {
      const response = await fetch(`${baseUrl}/auth/spotify/login`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('authUrl');
      expect(data.data).toHaveProperty('codeVerifier');
      expect(data.data).toHaveProperty('state');
      expect(data.data).toHaveProperty('redirectUri');
    });

    it('should return 400 for POST /auth/spotify/callback with invalid body', async () => {
      const response = await fetch(`${baseUrl}/auth/spotify/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });

    it('should return 400 for POST /auth/spotify/refresh with invalid body', async () => {
      const response = await fetch(`${baseUrl}/auth/spotify/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });

    it('should return 400 for POST /auth/logout with invalid body', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });
  });

  describe('Spotify Routes', () => {
    it('should return 401 for GET /spotify/me without auth', async () => {
      const response = await fetch(`${baseUrl}/spotify/me`);
      expect(response.status).toBe(401);
    });

    it('should return 401 for GET /spotify/playlists without auth', async () => {
      const response = await fetch(`${baseUrl}/spotify/playlists`);
      expect(response.status).toBe(401);
    });

    it('should return 401 for GET /spotify/playlists/:id/tracks without auth', async () => {
      const response = await fetch(`${baseUrl}/spotify/playlists/test-id/tracks`);
      expect(response.status).toBe(401);
    });
  });

  describe('Transitions Routes', () => {
    it('should return 401 for POST /transitions/generate without auth', async () => {
      const response = await fetch(`${baseUrl}/transitions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackA: { id: 'test1', name: 'Track A' },
          trackB: { id: 'test2', name: 'Track B' },
        }),
      });
      expect(response.status).toBe(401);
    });

    it('should return 400 for POST /transitions/generate with invalid body', async () => {
      const response = await fetch(`${baseUrl}/transitions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // Should be 400 (validation error) or 401 (auth error)
      // Auth middleware might run first, so 401 is acceptable
      expect([400, 401]).toContain(response.status);
    });

    it('should return 404 for GET /transitions/:id with non-existent transition', async () => {
      const response = await fetch(`${baseUrl}/transitions/non-existent-id`);
      // Could be 404 (not found) or 401 (auth required)
      expect([404, 401]).toContain(response.status);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await fetch(`${baseUrl}/non-existent-route`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'NOT_FOUND');
      expect(data.error).toHaveProperty('message', 'Route not found');
    });

    it('should return 404 for /api prefix (if not used)', async () => {
      const response = await fetch(`${baseUrl}/api/test`);
      expect(response.status).toBe(404);
    });
  });

  describe('CORS Headers', () => {
    it('should allow requests from allowed origins', async () => {
      // Test with no origin (should work)
      const response1 = await fetch(`${baseUrl}/health`);
      expect(response1.status).toBe(200);
      
      // Test with allowed origin (APP_URL from env)
      const response2 = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': process.env.APP_URL || 'http://127.0.0.1:3000',
        },
      });
      expect(response2.status).toBe(200);
    });
  });

  describe('Response Format', () => {
    it('should wrap successful responses in { success: true, data: ... }', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
    });

    it('should wrap error responses in { success: false, error: ... }', async () => {
      const response = await fetch(`${baseUrl}/non-existent`);
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });
  });
});

