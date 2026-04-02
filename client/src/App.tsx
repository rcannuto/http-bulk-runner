import { useState, useRef } from 'react';
import { RunConfig, CsvPreview, RowResult, RunSummary } from './types';
import RequestConfig from './components/RequestConfig';
import CsvUploader from './components/CsvUploader';
import ColumnMapper from './components/ColumnMapper';
import RunControls from './components/RunControls';
import RunnerOptions from './components/RunnerOptions';
import AssertionsConfig from './components/AssertionsConfig';
import EnvVarsConfig from './components/EnvVarsConfig';
import RunnerResults from './components/RunnerResults';

const DEFAULT_CONFIG: RunConfig = {
  url: '',
  method: 'GET',
  auth: { type: 'none' },
  delayMs: 0,
  bodyTemplate: '',
  headers: {},
  iterations: 1,
  stopOnFirstFailure: false,
  assertions: [],
  envVars: [],
};

export default function App() {
  const [config, setConfig] = useState<RunConfig>(DEFAULT_CONFIG);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [results, setResults] = useState<RowResult[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [hasEverRun, setHasEverRun] = useState(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const abortRef = useRef<(() => void) | null>(null);

  const handleRun = async () => {
    if (!csvFile) return;
    setResults([]);
    setSummary(null);
    setDone(false);
    setRunning(true);
    setHasEverRun(true);
    setFilter('all');

    const formData = new FormData();
    formData.append('csv', csvFile);
    formData.append('config', JSON.stringify(config));

    const response = await fetch('/api/run', { method: 'POST', body: formData });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let cancelled = false;
    abortRef.current = () => { cancelled = true; reader.cancel(); };

    try {
      while (!cancelled) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.done) {
            setSummary(payload as RunSummary);
            setDone(true);
          } else {
            setResults((prev) => [...prev, payload as RowResult]);
          }
        }
      }
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.();
    setRunning(false);
  };

  const totalExpected = (csvPreview?.total ?? 0) * config.iterations;
  const envVarKeys = config.envVars.map((v) => v.key).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">HTTP Bulk Runner</h1>
      </header>

      <main className={`flex-1 flex ${hasEverRun ? 'flex-row overflow-hidden' : 'flex-col'}`}>
        {/* Left config panel */}
        <aside className={
          hasEverRun
            ? 'w-96 shrink-0 border-r border-gray-800 overflow-y-auto p-5 space-y-4'
            : 'max-w-3xl mx-auto w-full px-6 py-6 space-y-6'
        }>
          <RequestConfig config={config} onChange={setConfig} />
          <AssertionsConfig assertions={config.assertions} onChange={(a) => setConfig({ ...config, assertions: a })} />
          <EnvVarsConfig envVars={config.envVars} onChange={(v) => setConfig({ ...config, envVars: v })} />
          <CsvUploader onFileChange={setCsvFile} onPreview={setCsvPreview} />
          {csvPreview && (
            <ColumnMapper
              config={config}
              columns={csvPreview.columns}
              totalRows={csvPreview.total}
              envVarKeys={envVarKeys}
            />
          )}
          <RunnerOptions config={config} onChange={setConfig} />
          <RunControls
            canRun={!!csvFile && !!config.url}
            running={running}
            done={done}
            progress={results.length}
            total={totalExpected}
            iterations={config.iterations}
            totalRows={csvPreview?.total ?? 0}
            onRun={handleRun}
            onStop={handleStop}
          />
        </aside>

        {/* Right results panel */}
        {hasEverRun && (
          <div className="flex-1 overflow-y-auto p-5">
            <RunnerResults
              results={results}
              summary={summary}
              running={running}
              filter={filter}
              onFilterChange={setFilter}
              method={config.method}
            />
          </div>
        )}
      </main>
    </div>
  );
}
