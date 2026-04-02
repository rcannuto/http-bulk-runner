import { RunConfig } from '../types';

function extractCsvVariables(template: string): string[] {
  const matches = template.match(/\{(\w+)\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

interface Props {
  config: RunConfig;
  columns: string[];
  totalRows: number;
  envVarKeys: string[];
}

export default function ColumnMapper({ config, columns, totalRows, envVarKeys }: Props) {
  const urlVars = extractCsvVariables(config.url);
  const bodyVars = config.bodyTemplate ? extractCsvVariables(config.bodyTemplate) : [];
  const allVars = [...new Set([...urlVars, ...bodyVars])];

  // Only flag as unmapped if not resolved by either CSV columns or env vars
  const unmapped = allVars.filter((v) => !columns.includes(v) && !envVarKeys.includes(v));

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mapeamento de Colunas</h2>
        <span className="text-xs text-gray-600">{totalRows} linhas detectadas</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {columns.map((col) => {
          const used = allVars.includes(col);
          return (
            <span
              key={col}
              className={`px-2 py-1 rounded text-xs font-mono ${
                used ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {col}
              {used && <span className="ml-1 text-green-500">→ {`{${col}}`}</span>}
            </span>
          );
        })}
      </div>

      {unmapped.length > 0 && (
        <p className="text-xs text-yellow-400">
          Atenção: as variáveis{' '}
          {unmapped.map((v) => <code key={v} className="font-mono">{`{${v}}`}</code>).reduce((a, b) => (
            <>{a}, {b}</>
          ))}{' '}
          não foram encontradas nas colunas do CSV.
        </p>
      )}
    </section>
  );
}
