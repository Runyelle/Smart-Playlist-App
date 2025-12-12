# Smart Playlist Backend

Production-quality MVP backend for the Smart Playlist App, built with Node.js, Express, and TypeScript.

## Features

- **Spotify OAuth Integration**: PKCE flow for secure authentication
- **AI-Powered Transitions**: Generate original transition audio clips using fal.ai's Stable Audio API
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
- fal.ai Account (for Stable Audio API)

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
   - `FAL_KEY`: Get from [fal.ai Dashboard](https://fal.ai/dashboard/keys)
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
- `GET /transitions/status/:transitionId` - Get status of transition generation (PENDING, READY, FAILED)

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

## AI Audio Generation Integration

The backend uses **fal.ai's Stable Audio API** for generating transition audio.

### Stable Audio (Default)

- Uses fal.ai's Stable Audio API (`fal-ai/stable-audio` model)
- No AWS infrastructure required
- Simple API integration with `@fal-ai/client`
- Set `AI_PROVIDER=stable_audio` (default) and configure:
  - `FAL_KEY`: Your fal.ai API key
  - `FAL_STABLE_AUDIO_MODEL`: Model ID (default: `fal-ai/stable-audio`)

**Required Environment Variables:**
- `FAL_KEY` - Your fal.ai API key (get from [fal.ai Dashboard](https://fal.ai/dashboard/keys))
- `FAL_STABLE_AUDIO_MODEL` - Model ID (defaults to `fal-ai/stable-audio`)

**Note**: Make sure you have credits in your fal.ai account. Add credits at [fal.ai Dashboard > Billing](https://fal.ai/dashboard/billing).

### Legacy Support (Deprecated)

The backend still supports legacy MusicGen modes for backward compatibility, but they are deprecated:

- **MusicGen Mode**: Set `AI_PROVIDER=musicgen` and `MUSICGEN_MODE=hf_api` (requires `HUGGINGFACE_API_KEY`)
- **Local Service Mode**: Set `AI_PROVIDER=musicgen` and `MUSICGEN_MODE=local` (requires local Python FastAPI service)

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

- `AI_PROVIDER` (default: `stable_audio`, options: `stable_audio`, `musicgen`, `none`)
- `DEFAULT_TRANSITION_SECONDS` (default: `5`)
- `DEFAULT_TRANSITION_STYLE` (default: `ambient`)

### Required for Stable Audio Mode (`AI_PROVIDER=stable_audio`)

- `FAL_KEY` - Your fal.ai API key (get from [fal.ai Dashboard](https://fal.ai/dashboard/keys))
- `FAL_STABLE_AUDIO_MODEL` - Model ID (defaults to `fal-ai/stable-audio`)

**Important**: Ensure you have credits in your fal.ai account. Add credits at [fal.ai Dashboard > Billing](https://fal.ai/dashboard/billing).

### Required for Legacy MusicGen Mode (`AI_PROVIDER=musicgen` and `MUSICGEN_MODE=hf_api`)

- `HUGGINGFACE_API_KEY` - Hugging Face API token (deprecated)

## License Note

**IMPORTANT**: This MVP uses fal.ai's Stable Audio API which requires credits. Ensure you have sufficient balance in your fal.ai account for generating transitions.

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


