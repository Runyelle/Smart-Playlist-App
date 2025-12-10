# Smart Playlist App

A smart playlist application with smooth transitions between songs, built with Next.js, React, TypeScript, and Express.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **AI**: Meta MusicGen (via Hugging Face API)
- **Storage**: Local Storage (MVP) + In-memory session store

## Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account (for OAuth credentials)
- Hugging Face Account (for MusicGen API - optional, can use local service)

## Setup Instructions

1. **Install dependencies for all projects:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp example.env .env
   ```
   
   Then edit `.env` and fill in:
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - `SPOTIFY_REDIRECT_URI`: Should match your registered redirect URI in Spotify Dashboard
   - `HUGGINGFACE_API_KEY`: Your Hugging Face API key (for MusicGen - get from [HF Settings](https://huggingface.co/settings/tokens))
   - `SESSION_SECRET`: Generate a long random string (e.g., `openssl rand -base64 32`)
   - `JWT_SECRET`: Generate another long random string

3. **Start development servers:**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:4000

## Project Structure

```
.
├── frontend/          # Next.js application
│   ├── app/          # Next.js app directory
│   ├── package.json
│   └── tsconfig.json
├── backend/          # Express API server (TypeScript)
│   ├── src/          # Source code
│   │   ├── config/   # Configuration
│   │   ├── routes/   # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/ # Business logic
│   │   ├── middlewares/  # Express middlewares
│   │   └── utils/    # Utilities
│   ├── package.json
│   └── README.md     # Backend documentation
├── ai/               # Optional local MusicGen service (Python)
├── example.env       # Environment variables template
└── package.json      # Root package.json for running both servers
├── example.env       # Environment variables template
└── package.json      # Root package.json for running both servers
```

## Development

- **Frontend only**: `npm run dev:frontend`
- **Backend only**: `npm run dev:backend`
- **Both**: `npm run dev`

## Environment Variables

See `example.env` for all available environment variables. For the MVP, the following are required:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_REDIRECT_URI`
- `SPOTIFY_SCOPES`
- `HUGGINGFACE_API_KEY` (if using HF API mode)
- `SESSION_SECRET`
- `JWT_SECRET`

## Backend Documentation

For detailed backend documentation, including API endpoints, OAuth flow, and MusicGen integration, see [backend/README.md](./backend/README.md).

## License Note

**IMPORTANT**: MusicGen is licensed for non-commercial use only. This MVP is intended for portfolio/class project purposes. For commercial use, you must obtain appropriate licensing or use alternative audio generation solutions.

