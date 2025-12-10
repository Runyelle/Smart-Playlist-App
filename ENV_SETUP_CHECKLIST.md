# Environment Variables Setup Checklist

This document lists all APIs, URLs, tokens, and tools you need to configure in your `.env` file to test the backend with Postman.

## 🔴 REQUIRED (Backend won't start without these)

### 1. Spotify OAuth Credentials

**What you need:**
- `SPOTIFY_CLIENT_ID` - Your Spotify App Client ID
- `SPOTIFY_REDIRECT_URI` - Must match exactly what you register in Spotify Dashboard

**How to get:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in:
   - App name: "Smart Playlist App" (or any name)
   - App description: "Smart playlist with transitions"
   - Redirect URI: `http://127.0.0.1:3000/callback`
   - Check "I understand and agree..."
5. Click "Save"
6. Copy the **Client ID** (visible on the app page)
7. **Important**: Make sure the Redirect URI in your `.env` matches EXACTLY what you entered in Spotify Dashboard

**Note:** `SPOTIFY_CLIENT_SECRET` is optional for PKCE flow (which we're using), but you can leave it empty.

---

### 2. Security Secrets

**What you need:**
- `SESSION_SECRET` - At least 32 characters, random string
- `JWT_SECRET` - At least 32 characters, different random string

**How to generate:**
```bash
# Option 1: Using OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
```

**Generate TWO different secrets** - one for `SESSION_SECRET`, one for `JWT_SECRET`.

---

## 🟡 REQUIRED FOR TRANSITION GENERATION (If testing MusicGen features)

### 3. Hugging Face API Key

**What you need:**
- `HUGGINGFACE_API_KEY` - Your Hugging Face API token

**How to get:**
1. Go to [Hugging Face](https://huggingface.co/) and create an account (free)
2. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Click "New token"
4. Name it: "Smart Playlist MusicGen"
5. Select "Read" permission (sufficient for inference API)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again)

**Note:** If you don't have this, you can still test other endpoints, but transition generation will fail. You can set `AI_PROVIDER=none` to disable MusicGen features temporarily.

---

## 🟢 OPTIONAL (Has defaults, but you may want to customize)

### 4. App Configuration

**Defaults are fine for testing, but you can customize:**
- `NODE_ENV=development` (default)
- `PORT=4000` (default)
- `APP_URL=http://localhost:3000` (default - frontend URL)
- `API_URL=http://localhost:4000` (default - backend URL)
- `LOG_LEVEL=debug` (default - good for testing)

---

### 5. MusicGen Configuration

**Defaults are fine, but you can customize:**
- `MUSICGEN_MODE=hf_api` (default - uses Hugging Face API)
  - Alternative: `local` (requires Python service running)
- `MUSICGEN_MODEL_ID=facebook/musicgen-small` (default)
  - Other options: `facebook/musicgen-medium`, `facebook/musicgen-large`
- `DEFAULT_TRANSITION_SECONDS=5` (default - 3-8 seconds)
- `DEFAULT_TRANSITION_STYLE=ambient` (default)
  - Options: `ambient`, `lofi`, `house`, `cinematic`

---

## 📋 Quick Setup Summary

### Minimum Required for Basic Testing (without MusicGen):

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
SPOTIFY_SCOPES=playlist-read-private playlist-read-collaborative
SESSION_SECRET=your_32_character_random_string_here
JWT_SECRET=your_32_character_different_random_string_here
AI_PROVIDER=none
```

### Full Setup (with MusicGen):

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
SPOTIFY_SCOPES=playlist-read-private playlist-read-collaborative
SESSION_SECRET=your_32_character_random_string_here
JWT_SECRET=your_32_character_different_random_string_here
HUGGINGFACE_API_KEY=your_hf_api_key_here
AI_PROVIDER=musicgen
MUSICGEN_MODE=hf_api
```

---

## 🧪 Testing with Postman

### Endpoints you can test:

1. **Health Check** (no auth needed):
   - `GET http://localhost:4000/health`

2. **Spotify Login** (no auth needed):
   - `GET http://localhost:4000/auth/spotify/login`
   - Returns: `authUrl`, `state`, `codeVerifier`

3. **Spotify Callback** (requires auth code from Spotify):
   - `POST http://localhost:4000/auth/spotify/callback`
   - Body: `{ "code": "...", "codeVerifier": "...", "redirectUri": "..." }`

4. **Spotify Data** (requires access token):
   - `GET http://localhost:4000/spotify/me`
   - Header: `Authorization: Bearer <access_token>`

5. **Transition Generation** (requires MusicGen API key):
   - `POST http://localhost:4000/transitions/generate`
   - Body: See backend README for schema

---

## 🔗 Useful Links

- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Hugging Face Settings](https://huggingface.co/settings/tokens)
- [Hugging Face MusicGen Model](https://huggingface.co/facebook/musicgen-small)

---

## ⚠️ Common Issues

1. **"SPOTIFY_CLIENT_ID is required"**
   - Make sure you copied the Client ID correctly (no extra spaces)

2. **"SESSION_SECRET must be at least 32 characters"**
   - Generate a longer secret using the methods above

3. **"Invalid redirect URI" (from Spotify)**
   - The redirect URI in `.env` must match EXACTLY what you registered in Spotify Dashboard
   - Check for trailing slashes, http vs https, etc.

4. **"HUGGINGFACE_API_KEY is required"**
   - Either provide the API key, or set `AI_PROVIDER=none` to disable MusicGen features

5. **CORS errors in Postman**
   - Postman should work fine, but if testing from browser, make sure `APP_URL` matches your frontend URL

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] Spotify Client ID is set
- [ ] Spotify Redirect URI matches Dashboard exactly
- [ ] SESSION_SECRET is at least 32 characters
- [ ] JWT_SECRET is at least 32 characters (different from SESSION_SECRET)
- [ ] If testing MusicGen: HUGGINGFACE_API_KEY is set
- [ ] Backend starts without errors: `npm run dev` in backend directory
- [ ] Health endpoint works: `GET http://localhost:4000/health`

