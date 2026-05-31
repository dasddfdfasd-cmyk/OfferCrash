# OfferCrash

OfferCrash is a Next.js AI interview agent for product manager campus recruiting. It supports DOCX resume upload, candidate profile extraction, interviewer style selection, AI interview room simulation, dynamic follow-up questions, and interview diagnostic reports with mock fallback for stable demos.

## Core Features

- Landing page for the OfferCrash product experience
- DOCX upload and server-side raw text extraction with `mammoth`
- Candidate profile generation from resume text
- ByteDance / Tencent interviewer style configuration
- AI interview meeting room with text and browser speech fallback
- Dynamic follow-up question API
- Interview report generation API
- Mock fallback for profile, follow-up questions, and reports

## Tech Stack

- Next.js App Router
- React
- TypeScript
- `mammoth` for DOCX text extraction
- OpenAI-compatible Chat Completions for text model calls
- Browser `speechSynthesis` and `SpeechRecognition` where available

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Production Build

```bash
npm run build
npm run start
```

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

```env
NEXT_PUBLIC_DEMO_MODE=true

TEXT_MODEL_API_KEY=
TEXT_MODEL_BASE_URL=
TEXT_MODEL_NAME=

NEXT_PUBLIC_REALTIME_GATEWAY_URL=

DOUBAO_REALTIME_API_KEY=
DOUBAO_REALTIME_APP_ID=
DOUBAO_REALTIME_ENDPOINT=
DOUBAO_REALTIME_RESOURCE_ID=
DOUBAO_REALTIME_MODEL=
```

### Notes

- `TEXT_MODEL_API_KEY`, `TEXT_MODEL_BASE_URL`, and `TEXT_MODEL_NAME` are read only in server API routes.
- Do not expose model API keys with a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_DEMO_MODE=true` keeps the demo flow stable with mock fallback.
- Set `NEXT_PUBLIC_DEMO_MODE=false` to test real DOCX profile extraction and real model calls.
- `NEXT_PUBLIC_REALTIME_GATEWAY_URL` is optional and should stay empty on Vercel unless a public realtime gateway is deployed.

## Vercel Deployment

1. Push the repository to GitHub.
2. Open Vercel and choose **Import Project**.
3. Select the GitHub repository.
4. Use the **Next.js** framework preset.
5. Configure environment variables from `.env.example`.
6. Click **Deploy**.

Vercel can use the default Next.js settings. A custom `vercel.json` is not required.

## Online Test Path

Use this flow after deployment:

Home page → Upload DOCX / example resume → Candidate profile → Interviewer configuration → AI interview meeting room → Report page

## API Routes

- `POST /api/upload-docx`
  - Accepts multipart `file` field.
  - Allows only `.docx`.
  - Maximum file size: 5 MB.
  - Parses the file in memory and returns `rawText`.

- `POST /api/extract-profile`
  - Accepts `{ rawText }`.
  - Calls the text model when configured.
  - Falls back to `mockCandidateProfile` on model or JSON failures.

- `POST /api/interview/next-question`
  - Accepts candidate profile, company style, interview records, and round index.
  - Calls the text model when configured.
  - Falls back to mock interview turns on failure.

- `POST /api/report/generate`
  - Accepts candidate profile, company style, interview records, and duration.
  - Calls the text model when configured.
  - Falls back to `mockReport` on failure.

## Deployment Safety

- Frontend API calls use relative paths such as `/api/upload-docx`.
- Uploaded DOCX files are parsed in memory and are not written to local disk.
- `localStorage` reads are guarded and fall back to mock data if unavailable or corrupted.
- Browser speech features degrade to text mode when unsupported or denied.
- The app does not request camera access.
