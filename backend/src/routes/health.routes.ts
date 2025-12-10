import { Router } from 'express';
import { sendSuccess } from '../utils/http.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;


