# Real API setup

This version keeps the existing UI/pipeline but uses real providers when Mock API is OFF.

## Required Railway variables

- `DATABASE_URL` — Railway PostgreSQL connection string
- `OPENAI_API_KEY` — OpenAI API key for scripting/SEO and thumbnail generation
- `ELEVENLABS_API_KEY` — ElevenLabs key for voice and generated background audio
- `ELEVENLABS_VOICE_ID` — voice ID (default is the documented example voice)
- `PEXELS_API_KEY` — Pexels API key for scene video assets
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`
- `YOUTUBE_REFRESH_TOKEN`
- `YOUTUBE_CATEGORY_ID` (optional, defaults to `28`)

The application calls OpenAI's Responses API for structured script/SEO JSON and its image generation endpoint for the thumbnail. ElevenLabs is used for TTS and generated loopable background audio. Pexels supplies scene video clips. FFmpeg composites the assets, voiceover and background audio. YouTube Data API v3 uploads the final MP4 and thumbnail.

## Important YouTube note

YouTube uploads require OAuth 2.0 authorization. An API key alone is not enough for upload. Use a refresh token belonging to the YouTube channel you want to publish to. New/unverified API projects can have uploaded videos restricted to private until Google's API audit requirements are satisfied.

## Railway

1. Push this folder to GitHub.
2. Create a Railway project from the GitHub repository.
3. Add a Railway PostgreSQL service and expose `DATABASE_URL` to the app.
4. Add the variables above.
5. Deploy using the included `Dockerfile` and `railway.toml`.
6. Open `/api/health` after deployment.

Do not commit `.env` or API keys to GitHub.


## Railway database fix

The production build must NOT run `drizzle-kit push`. The build only runs `next build`.
Database schema synchronization runs as Railway's Pre-Deploy Command:

`npm run db:push`

The Drizzle config reads `DATABASE_URL` from the Railway environment. Do not use a localhost
PostgreSQL URL in production.

In Railway Variables, make sure `DATABASE_URL` points to the Railway PostgreSQL service.
