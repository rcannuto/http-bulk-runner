# HTTP Bulk Runner

A Postman Collection Runner-inspired tool for executing bulk HTTP requests against CSV data, with real-time streaming results, test assertions, environment variables, and iteration support.

## Features

- **CSV-driven requests** — upload a CSV and run one HTTP request per row, with column values interpolated into the URL, headers, and body
- **Environment variables** — define key-value pairs and reference them as `{{varName}}` anywhere in the request template
- **Test assertions** — define pass/fail rules per request: status code, response time threshold, body contains, or JSONPath equals
- **Iterations** — run the entire CSV N times (useful for load/soak tests)
- **Stop on first failure** — automatically abort the run when any assertion fails
- **Postman-style results UI** — summary bar, filter tabs (All / Passed / Failed), per-request PASS/FAIL badge, per-assertion breakdown, iteration grouping
- **Real-time streaming** — results appear as each request completes via Server-Sent Events
- **Multiple auth types** — None, Bearer Token, API Key (header or query), Basic Auth
- **Export** — download all results (including assertion outcomes) as CSV

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
cd http-bulk-runner
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

### 1. Configure the Request

Set the HTTP method, URL template, and authentication. Use `{columnName}` placeholders to interpolate CSV column values:

```
https://api.example.com/users/{id}
```

Use `{{varName}}` for environment variables:

```
https://{{baseUrl}}/users/{id}
```

### 2. Add Tests (optional)

Define assertion rules that determine whether each request passes or fails:

| Type | Example |
|---|---|
| Status code equals | `200` |
| Status code is not | `500` |
| Response time < | `1000` ms |
| Body contains | `"success"` |
| JSONPath equals | `$.data.status` = `"active"` |

### 3. Add Environment Variables (optional)

Define reusable values (base URLs, API versions, etc.) as key-value pairs. Reference them as `{{varName}}` in URL, headers, or body.

### 4. Upload CSV

Upload a CSV file. The column headers become available as `{columnName}` placeholders in the request template.

Example CSV:
```csv
id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
```

### 5. Runner Settings

| Setting | Description |
|---|---|
| Iterations | How many times to run the full CSV (default: 1) |
| Delay (ms) | Wait between each request |
| Stop on first failure | Abort the run when any request fails an assertion |

### 6. Run

Click **Run**. A two-panel view opens: configuration on the left, live results on the right.

The results panel shows:
- **Summary bar**: total requests, passed, failed, total duration
- **Filter tabs**: All / Passed / Failed
- **Per-request rows**: method badge, URL, status code, response time, PASS/FAIL badge
- **Expandable details**: per-assertion results with actual vs expected values, response body
- **Iteration groups**: when running more than 1 iteration

## Template Syntax

| Syntax | Source | Resolved order |
|---|---|---|
| `{columnName}` | CSV row value | Second |
| `{{varName}}` | Environment variable | First |

Environment variables are resolved before CSV columns, so you can use `{{varName}}` inside a value that also contains `{column}`.

## API

### `POST /api/preview`

Upload a CSV to get column names and a data preview.

**Request:** `multipart/form-data` with field `csv` (file)

**Response:**
```json
{
  "columns": ["id", "name"],
  "preview": [{ "id": "1", "name": "Alice" }],
  "total": 50
}
```

### `POST /api/run`

Execute the bulk run. Streams results as Server-Sent Events.

**Request:** `multipart/form-data` with fields:
- `csv` — CSV file
- `config` — JSON string of `RunConfig`

**Streamed events (newline-delimited JSON):**
```json
{ "row": 1, "iteration": 1, "total": 50, "url": "...", "statusCode": 200, "duration": 123, "ok": true, "httpOk": true, "assertionResults": [...], "responseBody": "..." }
```

**Final event:**
```json
{ "done": true, "totalRequests": 50, "passed": 48, "failed": 2, "totalDurationMs": 6200, "stoppedEarly": false }
```

## Project Structure

```
http-bulk-runner/
├── client/                    # React + TypeScript + Vite (port 5173)
│   └── src/
│       ├── App.tsx            # Main layout and state orchestration
│       ├── types.ts           # Shared type definitions
│       └── components/
│           ├── RequestConfig.tsx      # URL, method, auth, body template
│           ├── AssertionsConfig.tsx   # Test assertion rules editor
│           ├── EnvVarsConfig.tsx      # Environment variables editor
│           ├── RunnerOptions.tsx      # Iterations, delay, stop-on-failure
│           ├── CsvUploader.tsx        # CSV file upload and preview
│           ├── ColumnMapper.tsx       # Column/variable mapping validation
│           ├── RunControls.tsx        # Run/Stop button and progress bar
│           └── RunnerResults.tsx      # Postman-style results panel
│
└── server/                    # Express + TypeScript (port 3001)
    └── src/
        ├── index.ts
        ├── types.ts
        ├── routes/runner.ts           # /run and /preview endpoints
        └── services/
            ├── csvParser.ts           # CSV stream parsing
            ├── httpRunner.ts          # HTTP request execution
            ├── templateEngine.ts      # {col} and {{var}} interpolation
            └── assertionRunner.ts     # Assertion evaluation engine
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express, TypeScript, axios, csv-parse, multer
- **Streaming**: Server-Sent Events (SSE)
