# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from `http-bulk-runner/`.

```bash
# Start both client and server in dev mode
npm run dev

# Build everything
npm run build

# Client only (port 5173)
npm run dev -w client

# Server only (port 3001)
npm run dev -w server
```

No test framework is configured.

## Architecture

This is a TypeScript monorepo (`client/` + `server/`) for running bulk HTTP requests against CSV data rows.

**Request flow:**
1. User uploads a CSV and configures a request template (URL, method, auth, body with `{columnName}` placeholders)
2. Client POSTs to `/api/preview` or `/api/run` on the Express backend (port 3001)
3. Server streams results back as newline-delimited JSON via Server-Sent Events
4. Client renders real-time progress and a results table

**Backend (`server/src/`):**
- `index.ts` — Express entry point, CORS allows `localhost:5173`
- `routes/runner.ts` — `/run` and `/preview` route handlers; streams SSE output
- `services/csvParser.ts` — Parses uploaded CSV via `csv-parse`, returns `Record<string, string>[]`
- `services/httpRunner.ts` — Executes HTTP requests via axios; handles Bearer/API Key/Basic auth, 30s timeout, configurable delay between rows
- `services/templateEngine.ts` — Interpolates `{columnName}` tokens in URL and body templates

**Frontend (`client/src/`):**
- `App.tsx` — Orchestrates the 4-step UI: upload → configure → map → run
- `types.ts` — Shared interfaces (`RunConfig`, `RowResult`, `CsvPreview`)
- `vite.config.ts` — Proxies `/api/*` to `http://localhost:3001`
- Components are single-responsibility: `CsvUploader`, `RequestConfig`, `ColumnMapper`, `RunControls`, `ResultsTable`
