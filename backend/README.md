# Smart Playlist Backend

Production-quality MVP backend for the Smart Playlist App, built with Node.js, Express, and TypeScript.

## Features

- **Spotify OAuth Integration**: PKCE flow for secure authentication
- **MusicGen Integration**: Generate original transition audio clips using Meta MusicGen via Hugging Face API
- **Caching**: LRU cache for generated transitions to avoid regeneration
- **Security**: Helmet, CORS, rate limiting, request validation
- **Logging**: Structured logging with Pino
- **Type Safety**: Full TypeScript with Zod validation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, express-rate-limit
- **Testing**: Vitest

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/                # Configuration
│   │   ├── env.ts            # Environment variables with Zod validation
│   │   └── cors.ts           # CORS configuration
│   ├── routes/                # API routes
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── spotify.routes.ts
│   │   ├── transitions.routes.ts
│   │   └── index.ts
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── spotify.controller.ts
│   │   └── transitions.controller.ts
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── spotify.service.ts
│   │   ├── transitions.service.ts
│   │   ├── cache.service.ts
│   │   └── musicgen/
│   │       ├── musicgen.provider.ts
│   │       ├── musicgen.hf.service.ts
│   │       ├── musicgen.local.service.ts
│   │       └── musicgen.prompt.ts
│   ├── middlewares/           # Express middlewares
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── requestId.middleware.ts
│   ├── models/                # Data models
│   │   ├── session.model.ts
│   │   └── transition.model.ts
│   ├── types/                 # TypeScript types
│   │   └── spotify.types.ts
│   └── utils/                 # Utility functions
│       ├── logger.ts
│       ├── http.ts
│       ├── crypto.ts
│       ├── file.ts
│       ├── errors.ts
│       └── spotify.ts
└── tests/                     # Unit tests
```

## Setup

### Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account
- Hugging Face Account (for MusicGen API)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp ../example.env .env
   ```

3. **Configure `.env` file:**
   - `SPOTIFY_CLIENT_ID`: Get from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - `SPOTIFY_REDIRECT_URI`: Must match your registered redirect URI in Spotify Dashboard
   - `HUGGINGFACE_API_KEY`: Get from [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`

### Running

**Development:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

**Testing:**
```bash
npm test
```

## API Endpoints

### Health

- `GET /health` - Health check endpoint

### Authentication

- `GET /auth/spotify/login` - Get Spotify authorization URL
- `POST /auth/spotify/callback` - Exchange authorization code for tokens
- `POST /auth/spotify/refresh` - Refresh access token
- `POST /auth/logout` - Logout and clear session

### Spotify Data

- `GET /spotify/me` - Get current user's profile
- `GET /spotify/playlists` - Get user's playlists
- `GET /spotify/playlists/:playlistId/tracks` - Get playlist tracks

### Transitions

- `POST /transitions/generate` - Generate or retrieve cached transition
- `GET /transitions/:transitionId` - Serve generated transition audio file

## OAuth Flow

The backend implements Spotify OAuth 2.0 with PKCE (Proof Key for Code Exchange):

1. Frontend calls `GET /auth/spotify/login` to get authorization URL and code verifier
2. User authorizes on Spotify
3. Spotify redirects to frontend with authorization code
4. Frontend calls `POST /auth/spotify/callback` with code and code verifier
5. Backend exchanges code for access and refresh tokens
6. Backend stores refresh token in session store and returns access token + session token
7. Frontend uses access token for API calls
8. When access token expires, frontend calls `POST /auth/spotify/refresh` with session token

## MusicGen Integration

The backend supports two modes for MusicGen:

### Hugging Face API Mode (Recommended for MVP)

- Uses Hugging Face Inference API
- No local GPU required
- Set `MUSICGEN_MODE=hf_api` and provide `HUGGINGFACE_API_KEY`

### Local Service Mode (Optional)

- Requires a local Python FastAPI service
- See `/ai` directory for service skeleton
- Set `MUSICGEN_MODE=local`

### Prompt Generation

The backend automatically generates structured prompts based on:
- Track metadata (A → B transition)
- Duration (3-8 seconds)
- Style (ambient, lofi, house, cinematic)
- User overrides (tempo, energy, speed)

Example prompt: `"5-second ambient transition, smooth, atmospheric pads, subtle textures, no vocals, minimal percussion, energy mid-to-high, moderate tempo shift, seamless blend, no abrupt changes"`

## Caching

Generated transitions are cached using an LRU cache:
- Cache key includes: trackA ID, trackB ID, seconds, style, and overrides
- Cache size: 100 entries (configurable)
- TTL: 24 hours
- Generated audio files stored in `./tmp/transitions/`

## Security

- **Helmet**: Security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: 
  - General API: 100 requests per 15 minutes
  - Transition generation: 10 requests per hour
- **Input Validation**: Zod schemas for all inputs
- **Session Management**: JWT-based sessions with refresh tokens stored server-side

## Logging

Structured logging with Pino:
- Request/response logging with request IDs
- Error logging with stack traces
- Configurable log levels via `LOG_LEVEL` env var

## Environment Variables

See `example.env` for all available environment variables.

### Required

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_REDIRECT_URI`
- `SESSION_SECRET` (min 32 characters)
- `JWT_SECRET` (min 32 characters)

### Optional

- `HUGGINGFACE_API_KEY` (required if `MUSICGEN_MODE=hf_api`)
- `MUSICGEN_MODE` (default: `hf_api`)
- `DEFAULT_TRANSITION_SECONDS` (default: `5`)
- `DEFAULT_TRANSITION_STYLE` (default: `ambient`)

## License Note

**IMPORTANT**: MusicGen is licensed for non-commercial use only. This MVP is intended for portfolio/class project purposes. For commercial use, you must obtain appropriate licensing or use alternative audio generation solutions.

## Development Notes

### Session Store

The MVP uses an in-memory session store. For production, upgrade to:
- Redis (recommended)
- Database (PostgreSQL, MongoDB, etc.)

### File Storage

Generated transitions are stored locally in `./tmp/transitions/`. For production, consider:
- Cloud storage (S3, GCS, etc.)
- CDN for serving audio files

### Error Handling

All errors are caught by the error middleware and returned in a consistent format:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  },
  "requestId": "request-id"
}
```

## Testing

Run tests with:
```bash
npm test
```

Current test coverage:
- Crypto utilities (hash, PKCE)
- Cache key generation
- Prompt building

## Future Enhancements

- [ ] Database integration for sessions and transitions
- [ ] Redis caching
- [ ] Cloud storage for audio files
- [ ] WebSocket support for real-time updates
- [ ] Transition preview/editing
- [ ] Batch transition generation
- [ ] Analytics and monitoring


