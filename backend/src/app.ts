import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { corsOptions } from './config/cors.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

/**
 * Create and configure Express application
 */
export function createApp(): express.Application {
  const app = express();

  // Security middleware
  // Configure Helmet to allow cross-origin requests for audio files
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow audio files to be loaded cross-origin
      crossOriginEmbedderPolicy: false, // Disable COEP to allow audio playback
    })
  );

  // CORS
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request ID middleware (must be before logging)
  app.use(requestIdMiddleware);

  // HTTP request logging
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        } else if (res.statusCode >= 500 || err) {
          return 'error';
        }
        return 'info';
      },
    })
  );

  // API routes
  app.use('/', routes);

  // Debug middleware to log 404s
  app.use((req, res) => {
    console.log('🔴 404 Handler - Route not found:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      baseUrl: req.baseUrl,
    });
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
      },
      requestId: res.locals.requestId,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
}


