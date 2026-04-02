import { RunConfig } from '../types';

interface Props {
  config: RunConfig;
  onChange: (c: RunConfig) => void;
}

export default function RunnerOptions({ config, onChange }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Runner</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Iterations</label>
          <input
            type="number"
            min={1}
            value={config.iterations}
            onChange={(e) => onChange({ ...config, iterations: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Delay (ms)</label>
          <input
            type="number"
            min={0}
            step={100}
            value={config.delayMs}
            onChange={(e) => onChange({ ...config, delayMs: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Stop on first failure</span>
        <button
          role="switch"
          aria-checked={config.stopOnFirstFailure}
          onClick={() => onChange({ ...config, stopOnFirstFailure: !config.stopOnFirstFailure })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            config.stopOnFirstFailure ? 'bg-orange-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.stopOnFirstFailure ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
