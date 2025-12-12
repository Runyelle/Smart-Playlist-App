import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ensureTransitionsDir } from './utils/file.js';

/**
 * Start the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Ensure transitions directory exists
    await ensureTransitionsDir();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          nodeEnv: env.NODE_ENV,
          apiUrl: env.API_URL,
        },
        'Server started successfully'
      );
    });

    // Set server timeout to 6 minutes (360000ms) to handle AI audio generation
    // Audio generation can take 2-5+ minutes, so we need a longer timeout
    server.timeout = 360000; // 6 minutes
    server.keepAliveTimeout = 360000; // 6 minutes
    server.headersTimeout = 360000; // 6 minutes
    
    logger.info({ timeout: '6 minutes' }, 'Server timeout configured for async operations');

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer();


