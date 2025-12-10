# MusicGen Local Service (Optional)

This directory contains an optional Python FastAPI service for running MusicGen locally.

## When to Use

- You have a GPU available
- You want to avoid Hugging Face API rate limits
- You want full control over the generation process

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install MusicGen:**
   ```bash
   pip install audiocraft
   ```

3. **Start the service:**
   ```bash
   python app.py
   ```

The service will run on `http://localhost:5000` by default.

## Configuration

Set `MUSICGEN_MODE=local` in your backend `.env` file.

## API

The service exposes a single endpoint:

- `POST /generate`
  - Body: `{ "prompt": "...", "duration": 5, "style": "ambient" }`
  - Returns: Audio file (WAV format)

## Note

This is a skeleton implementation. You'll need to:
1. Load the MusicGen model
2. Implement the generation logic
3. Handle audio encoding/decoding
4. Add error handling and logging

See [Audiocraft documentation](https://github.com/facebookresearch/audiocraft) for details.


