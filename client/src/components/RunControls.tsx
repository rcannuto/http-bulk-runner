interface Props {
  canRun: boolean;
  running: boolean;
  done: boolean;
  progress: number;
  total: number;
  iterations: number;
  totalRows: number;
  onRun: () => void;
  onStop: () => void;
}

export default function RunControls({ canRun, running, done, progress, total, iterations, totalRows, onRun, onStop }: Props) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  let progressLabel = '';
  if ((running || done) && total > 0) {
    if (iterations > 1 && totalRows > 0) {
      const currentIteration = Math.ceil(progress / totalRows) || 1;
      const rowWithinIteration = progress % totalRows || (progress > 0 ? totalRows : 0);
      progressLabel = `Iteration ${Math.min(currentIteration, iterations)}/${iterations} — ${rowWithinIteration}/${totalRows} (${pct}%)`;
    } else {
      progressLabel = `${progress} / ${total} (${pct}%)`;
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-3">
        {!running ? (
          <button
            onClick={onRun}
            disabled={!canRun}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 rounded font-medium text-sm transition-colors"
          >
            ▶ Run
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-5 py-2 bg-red-700 hover:bg-red-600 rounded font-medium text-sm transition-colors"
          >
            ■ Stop
          </button>
        )}

        {(running || done) && total > 0 && (
          <span className="text-sm text-gray-400">
            {progressLabel}
            {done && <span className="ml-2 text-green-400">Done</span>}
          </span>
        )}
      </div>

      {(running || done) && total > 0 && (
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </section>
  );
}
