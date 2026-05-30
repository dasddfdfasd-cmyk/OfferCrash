# OfferCrash Realtime Gateway

This folder contains the local WebSocket gateway used for the Doubao end-to-end realtime voice pre-research module.

## Start

```bash
npm run dev:realtime
```

Gateway URL:

```text
ws://localhost:8787/ws/interview
```

## Environment Variables

```env
DOUBAO_REALTIME_API_KEY=
DOUBAO_REALTIME_APP_ID=
DOUBAO_REALTIME_ENDPOINT=
DOUBAO_REALTIME_RESOURCE_ID=
DOUBAO_REALTIME_MODEL=
NEXT_PUBLIC_REALTIME_GATEWAY_URL=ws://localhost:8787/ws/interview
```

## Protocol

Frontend to gateway:

```json
{ "type": "start", "sessionId": "demo", "companyStyle": "bytedance", "candidateProfile": {}, "interviewRecords": [] }
```

```json
{ "type": "audio_chunk", "audio": "base64", "format": "audio/webm", "sampleRate": 48000 }
```

```json
{ "type": "stop_audio" }
```

```json
{ "type": "end" }
```

Gateway to frontend:

```json
{ "type": "session_started" }
```

```json
{ "type": "assistant_text", "content": "", "stage": "", "followUpType": "" }
```

```json
{ "type": "user_transcript", "content": "", "isFinal": true }
```

```json
{ "type": "assistant_audio", "audio": "base64", "format": "mp3", "sampleRate": 24000 }
```

```json
{ "type": "error", "message": "实时语音连接异常，已切换到文字面试模式。" }
```

```json
{ "type": "session_ended" }
```

## Doubao Calibration TODO

The exact Doubao RealtimeAPI endpoint, headers, session event names, audio event names, transcript fields, and assistant audio fields must be calibrated in `server/doubaoRealtimeClient.ts` against the official Doubao RealtimeAPI documentation.
