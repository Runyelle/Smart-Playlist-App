import { CorsOptions } from 'cors';
import { env } from './env.js';

/**
 * CORS configuration for Express
 * Allows requests from the frontend URL in development/production
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Build list of allowed origins
    const allowedOrigins = [env.APP_URL];
    
    // In development, also allow localhost/127.0.0.1 variants and network IPs
    // This handles the case where Spotify requires 127.0.0.1 but user might access via localhost
    // or when accessing via network IP (e.g., 192.168.x.x:3000)
    if (env.NODE_ENV === 'development') {
      // Add localhost variant if APP_URL uses 127.0.0.1
      if (env.APP_URL.includes('127.0.0.1')) {
        allowedOrigins.push(env.APP_URL.replace('127.0.0.1', 'localhost'));
      }
      // Add 127.0.0.1 variant if APP_URL uses localhost
      if (env.APP_URL.includes('localhost')) {
        allowedOrigins.push(env.APP_URL.replace('localhost', '127.0.0.1'));
      }
      
      // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x) in development
      // This allows accessing frontend via network IP while API uses same IP
      const networkIpPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$/;
      if (networkIpPattern.test(origin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};


