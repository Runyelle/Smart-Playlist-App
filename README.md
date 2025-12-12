# Smart Playlist App

A smart playlist application that generates AI-powered transitions between Spotify tracks, built with Next.js, React, TypeScript, and Express. Features a Spotify-inspired dark theme UI with seamless audio transitions.

## 🎥 Demo Video

Watch the demo: [YouTube Video](https://www.youtube.com/watch?v=We_iN7pAO48)

## 📊 Workflow Diagram

See the application workflow: [`docs/smart_playlist_workflow.mermaid`](./docs/smart_playlist_workflow.mermaid)

## Features

- 🎵 **Spotify Integration**: Connect your Spotify account via OAuth (PKCE flow)
- 🎨 **Spotify-Inspired UI**: Dark theme with green accents matching Spotify's design
- 🤖 **AI-Powered Transitions**: Generate smooth 5-second transitions between tracks using fal.ai's Stable Audio
- 📚 **Library Management**: Browse your playlists in a sidebar library view
- ⚙️ **Track Settings**: Customize tempo, energy, and speed for each track
- 🎛️ **Transition Controls**: Adjust duration and style (ambient, lofi, house, cinematic)
- 💾 **Caching**: Generated transitions are cached to avoid regeneration

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Spotify color scheme
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI Provider**: fal.ai Stable Audio API
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, CORS, rate limiting

## Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account (for OAuth credentials)
- fal.ai Account (for Stable Audio API)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd Smart-Playlist-App
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

Or use the convenience script:

```bash
npm run install:all
```

### 3. Set up environment variables

```bash
cp example.env .env
```

Edit `.env` and configure:

**Required:**
- `SPOTIFY_CLIENT_ID`: Get from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- `SPOTIFY_REDIRECT_URI`: Must match your registered redirect URI (default: `http://127.0.0.1:3000/callback`)
- `FAL_KEY`: Get from [fal.ai Dashboard](https://fal.ai/dashboard)
- `SESSION_SECRET`: Generate with `openssl rand -base64 32`
- `JWT_SECRET`: Generate with `openssl rand -base64 32`

**Optional:**
- `FAL_STABLE_AUDIO_MODEL`: Default is `fal-ai/stable-audio`
- `DEFAULT_TRANSITION_SECONDS`: Default is `5` (3-8 seconds)
- `DEFAULT_TRANSITION_STYLE`: Default is `ambient`

### 4. Start development servers

```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Frontend on http://localhost:3000 (or http://127.0.0.1:3000)
- Backend on http://localhost:4000

Or start them separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Project Structure

```
.
├── frontend/              # Next.js application
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Landing page
│   │   ├── playlists/    # Playlists list page
│   │   └── playlist/     # Playlist detail page
│   ├── components/       # React components
│   │   ├── library-sidebar.tsx    # Left sidebar with playlists
│   │   ├── transitions-panel.tsx  # Right sidebar for transitions
│   │   └── track-settings.tsx     # Track configuration
│   └── lib/              # Utilities and API client
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/       # Configuration (env, CORS)
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   │   └── stableAudio/  # fal.ai Stable Audio integration
│   │   ├── middlewares/  # Express middlewares
│   │   └── utils/        # Utilities
│   └── tmp/              # Generated transitions storage
├── example.env           # Environment variables template
└── package.json          # Root package.json for scripts
```

## Environment Variables

See `example.env` for all available environment variables. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify OAuth Client ID |
| `SPOTIFY_REDIRECT_URI` | Yes | Must match Spotify Dashboard |
| `FAL_KEY` | Yes | fal.ai API key for Stable Audio |
| `SESSION_SECRET` | Yes | At least 32 characters |
| `JWT_SECRET` | Yes | At least 32 characters |
| `AI_PROVIDER` | No | Default: `stable_audio` |
| `FAL_STABLE_AUDIO_MODEL` | No | Default: `fal-ai/stable-audio` |

## Getting API Keys

### Spotify OAuth

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/callback`
4. Copy the Client ID

### fal.ai API Key

1. Go to [fal.ai](https://fal.ai) and create an account
2. Navigate to [Dashboard > Billing](https://fal.ai/dashboard/billing)
3. Add credits to your account
4. Go to [Dashboard > API Keys](https://fal.ai/dashboard/keys)
5. Create a new API key and copy it

## Usage

1. **Connect Spotify**: Click "Connect Spotify" on the landing page
2. **Browse Playlists**: View your playlists in the library sidebar
3. **Select Playlist**: Click on a playlist to view its tracks
4. **Configure Tracks** (optional): Adjust tempo, energy, and speed for each track
5. **Generate Transitions**: Use the right sidebar to generate transitions between consecutive tracks
6. **Play Transitions**: Click the play button on generated transitions to listen

## Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build
```

### API Endpoints

- `GET /health` - Health check
- `GET /auth/spotify/login` - Initiate Spotify OAuth
- `POST /auth/spotify/callback` - Complete OAuth flow
- `GET /spotify/me` - Get current user
- `GET /spotify/playlists` - Get user playlists
- `GET /spotify/playlists/:id/tracks` - Get playlist tracks
- `POST /transitions/generate` - Generate transition audio
- `GET /transitions/:id` - Get transition audio file

See `backend/README.md` for detailed API documentation.

## UI/UX

The application features a Spotify-inspired interface:

- **Dark Theme**: Deep black and dark gray backgrounds
- **Spotify Green**: Primary accent color (#1DB954)
- **Library Sidebar**: Left sidebar with playlist navigation
- **Playlist Header**: Large image and metadata display
- **Transitions Panel**: Right sidebar for transition generation
- **Smooth Animations**: Hover effects and transitions

## License

**IMPORTANT**: This project uses fal.ai's Stable Audio API which requires credits. Ensure you have sufficient balance in your fal.ai account for generating transitions.

## Contributing

This is a portfolio/educational project. Contributions and suggestions are welcome!

## Support

For issues or questions:
- Check the backend logs for detailed error messages
- Ensure all environment variables are set correctly
- Verify your fal.ai account has sufficient credits
- Check that your Spotify redirect URI matches exactly
