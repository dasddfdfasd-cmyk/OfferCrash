# OfferCrash Realtime Gateway

This folder contains an optional local WebSocket gateway used only for realtime voice pre-research.
The production Vercel deployment does not require this gateway.

## Start Locally

```bash
npm run dev:realtime
```

The gateway listens on:

```text
ws://<your-host>:8787/ws/interview
```

## Environment Variables

```env
REALTIME_GATEWAY_PORT=8787
DOUBAO_REALTIME_API_KEY=
DOUBAO_REALTIME_APP_ID=
DOUBAO_REALTIME_ENDPOINT=
DOUBAO_REALTIME_RESOURCE_ID=
DOUBAO_REALTIME_MODEL=
NEXT_PUBLIC_REALTIME_GATEWAY_URL=
```

Leave `NEXT_PUBLIC_REALTIME_GATEWAY_URL` empty on Vercel unless you deploy a public gateway.

## Doubao Calibration TODO

The exact Doubao RealtimeAPI endpoint, headers, session event names, audio event names, transcript fields, and assistant audio fields must be calibrated in `server/doubaoRealtimeClient.ts` against the official Doubao RealtimeAPI documentation.
