# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from `http-bulk-runner/` (the project root).

```bash
# Start both client and server in dev mode
npm run dev

# Build everything (server first, then client)
npm run build

# Client only (port 5173)
npm run dev -w client

# Server only (port 3001)
npm run dev -w server
```

No test framework is configured.

## Architecture

TypeScript monorepo (`client/` + `server/`) for running bulk HTTP requests against CSV data rows.

**Request flow:**
1. User uploads a CSV and configures a request template (URL, method, auth, body with `{columnName}` placeholders)
2. Client POSTs to `/api/preview` or `/api/run` on the Express backend (port 3001)
3. Server streams results back as **newline-delimited JSON via Server-Sent Events (SSE)**
4. Client reads the stream incrementally and renders real-time progress + results table

**Backend (`server/src/`):**
- `index.ts` — Express entry point; CORS allows `localhost:5173`
- `routes/runner.ts` — `/run` and `/preview` handlers; both use `multer` (memory storage, 10MB limit); `/run` writes SSE frames
- `services/csvParser.ts` — Parses uploaded CSV buffer via `csv-parse` streams → `Record<string, string>[]`
- `services/httpRunner.ts` — Executes requests via axios; 30s timeout; configurable `delayMs` between rows; returns `RowResult`
- `services/templateEngine.ts` — Interpolates `{columnName}` tokens in URL and body templates

**Frontend (`client/src/`):**
- `App.tsx` — Orchestrates the 4-step UI: configure → upload → map columns → run
- `types.ts` — Shared interfaces (`RunConfig`, `AuthConfig`, `RowResult`, `CsvPreview`)
- `vite.config.ts` — Proxies `/api/*` to `http://localhost:3001`
- Components are single-responsibility: `CsvUploader`, `RequestConfig`, `ColumnMapper`, `RunControls`, `ResultsTable`

**Auth types** (defined in `AuthConfig`): `none`, `bearer`, `apikey-header`, `apikey-query`, `basic`.

**SSE streaming pattern:** The backend sets `Content-Type: text/event-stream` and flushes one JSON object per line. The frontend reads via `fetch` + `ReadableStream`, splitting on `\n` to parse each `RowResult` as it arrives. Abort is supported via `AbortController`.
