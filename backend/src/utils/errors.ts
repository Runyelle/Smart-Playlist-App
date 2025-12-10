/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SpotifyError extends AppError {
  constructor(message: string, statusCode = 500, code?: string) {
    super(message, statusCode, code || 'SPOTIFY_ERROR');
  }
}

export class MusicGenError extends AppError {
  constructor(message: string, statusCode = 500, code?: string) {
    super(message, statusCode, code || 'MUSICGEN_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}


