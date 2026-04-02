import { EnvVar } from '../types';

interface Props {
  envVars: EnvVar[];
  onChange: (vars: EnvVar[]) => void;
}

export default function EnvVarsConfig({ envVars, onChange }: Props) {
  const update = (index: number, field: 'key' | 'value', val: string) => {
    const updated = envVars.map((v, i) => i === index ? { ...v, [field]: val } : v);
    onChange(updated);
  };

  const remove = (index: number) => onChange(envVars.filter((_, i) => i !== index));

  const add = () => onChange([...envVars, { key: '', value: '' }]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Environment Variables</h2>

      {envVars.length > 0 && (
        <div className="space-y-2">
          {envVars.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="variable name"
                value={v.key}
                onChange={(e) => update(i, 'key', e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500 font-mono"
              />
              <input
                type="text"
                placeholder="value"
                value={v.value}
                onChange={(e) => update(i, 'value', e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={() => remove(i)}
                className="text-gray-600 hover:text-red-400 text-base leading-none px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={add}
        className="text-sm text-orange-500 hover:text-orange-400"
      >
        + Add Variable
      </button>

      <p className="text-xs text-gray-600">
        Use <code className="text-gray-500 font-mono">{`{{varName}}`}</code> in URL, headers, or body
      </p>
    </div>
  );
}
