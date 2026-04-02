import { useState } from 'react';
import { RowResult, RunSummary } from '../types';

interface Props {
  results: RowResult[];
  summary: RunSummary | null;
  running: boolean;
  filter: 'all' | 'passed' | 'failed';
  onFilterChange: (f: 'all' | 'passed' | 'failed') => void;
  method: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-900 text-green-300',
  POST: 'bg-blue-900 text-blue-300',
  PUT: 'bg-yellow-900 text-yellow-300',
  DELETE: 'bg-red-900 text-red-300',
  PATCH: 'bg-purple-900 text-purple-300',
};

function statusColor(code: number): string {
  if (code === 0) return 'text-red-400';
  if (code < 300) return 'text-green-400';
  if (code < 400) return 'text-yellow-400';
  return 'text-red-400';
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

function tryPrettyJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function exportToCsv(results: RowResult[]) {
  const assertionHeaders = results[0]?.assertionResults.map((a) => a.label) ?? [];
  const headers = ['iteration', 'row', 'url', 'statusCode', 'duration', 'ok', ...assertionHeaders, 'error'];
  const rows = results.map((r) => [
    r.iteration,
    r.row,
    r.url,
    r.statusCode,
    r.duration,
    r.ok,
    ...r.assertionResults.map((a) => a.passed ? 'pass' : `fail (${a.actual ?? ''})`),
    r.error ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'runner-results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function ResultRow({ result, method }: { result: RowResult; method: string }) {
  const [expanded, setExpanded] = useState(false);
  const displayUrl = result.url.length > 60 ? result.url.slice(0, 60) + '…' : result.url;

  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/60 text-left transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-gray-600 text-xs w-3 shrink-0">
          {expanded ? '▼' : '▶'}
        </span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${METHOD_COLORS[method] ?? 'bg-gray-800 text-gray-300'}`}>
          {method}
        </span>
        <span className="flex-1 text-sm text-gray-300 font-mono truncate">{displayUrl}</span>
        <span className={`text-sm font-mono shrink-0 ${statusColor(result.statusCode)}`}>
          {result.statusCode === 0 ? 'ERR' : result.statusCode}
        </span>
        <span className="text-xs text-gray-500 shrink-0 w-14 text-right">{formatMs(result.duration)}</span>
        <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
          result.ok ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {result.ok ? 'PASS' : 'FAIL'}
        </span>
      </button>

      {expanded && (
        <div className="px-8 pb-3 space-y-3">
          {result.assertionResults.length > 0 && (
            <div className="space-y-1">
              {result.assertionResults.map((a) => (
                <div key={a.assertionId} className="flex items-start gap-2 text-sm">
                  <span className={a.passed ? 'text-green-400' : 'text-red-400'}>
                    {a.passed ? '✓' : '✗'}
                  </span>
                  <span className={a.passed ? 'text-gray-400' : 'text-gray-300'}>{a.label}</span>
                  {!a.passed && a.actual !== undefined && (
                    <span className="text-gray-600 text-xs ml-1">— actual: {a.actual}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.error ? (
            <div className="text-red-400 text-xs font-mono bg-red-950/30 rounded p-2">{result.error}</div>
          ) : result.responseBody !== undefined && (
            <pre className="text-xs text-gray-400 font-mono bg-gray-800 rounded p-3 max-h-48 overflow-auto whitespace-pre-wrap break-all">
              {tryPrettyJson(result.responseBody)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunnerResults({ results, summary, running, filter, onFilterChange, method }: Props) {
  const filtered = results.filter((r) =>
    filter === 'all' ? true : filter === 'passed' ? r.ok : !r.ok
  );

  // Group by iteration
  const iterations = [...new Set(results.map((r) => r.iteration))].sort((a, b) => a - b);
  const hasIterations = iterations.length > 1;

  const passedCount = summary?.passed ?? results.filter((r) => r.ok).length;
  const failedCount = summary?.failed ?? results.filter((r) => !r.ok).length;
  const totalCount = summary?.totalRequests ?? results.length;

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center gap-5 mb-4 flex-wrap">
        <span className="text-sm text-gray-400">{totalCount} requests</span>
        <span className="text-sm text-green-400 font-medium">✓ {passedCount} passed</span>
        {failedCount > 0 && (
          <span className="text-sm text-red-400 font-medium">✗ {failedCount} failed</span>
        )}
        {running ? (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Running...
          </span>
        ) : summary ? (
          <span className="text-sm text-gray-500">{formatMs(summary.totalDurationMs)} total</span>
        ) : null}
        {summary?.stoppedEarly && (
          <span className="text-xs px-2 py-0.5 bg-orange-900 text-orange-300 rounded font-medium">
            Stopped early
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-gray-800 mb-0">
        {(['all', 'passed', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              filter === f
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            {f}
            {f === 'passed' && passedCount > 0 && (
              <span className="ml-1.5 text-xs text-green-600">{passedCount}</span>
            )}
            {f === 'failed' && failedCount > 0 && (
              <span className="ml-1.5 text-xs text-red-600">{failedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto bg-gray-900 border border-t-0 border-gray-800 rounded-b-lg">
        {filtered.length === 0 && !running && (
          <p className="text-sm text-gray-600 text-center py-8">No results to display</p>
        )}

        {hasIterations
          ? iterations.map((iter) => {
              const iterRows = filtered.filter((r) => r.iteration === iter);
              if (iterRows.length === 0) return null;
              const iterPassed = iterRows.filter((r) => r.ok).length;
              const iterFailed = iterRows.filter((r) => !r.ok).length;
              return (
                <div key={iter}>
                  <div className="flex items-center justify-between bg-gray-800/50 px-3 py-1.5 text-xs text-gray-500 border-b border-gray-800">
                    <span>Iteration {iter}</span>
                    <span>
                      <span className="text-green-600">{iterPassed} passed</span>
                      {iterFailed > 0 && <span className="text-red-600 ml-2">{iterFailed} failed</span>}
                    </span>
                  </div>
                  {iterRows.map((r, i) => <ResultRow key={`${iter}-${i}`} result={r} method={method} />)}
                </div>
              );
            })
          : filtered.map((r, i) => <ResultRow key={i} result={r} method={method} />)
        }
      </div>

      {/* Export */}
      {!running && results.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => exportToCsv(results)}
            className="text-sm text-gray-500 hover:text-gray-300 px-3 py-1.5 border border-gray-800 rounded hover:border-gray-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
