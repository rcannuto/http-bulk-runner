import { RunConfig, AuthType } from '../types';

interface Props {
  config: RunConfig;
  onChange: (c: RunConfig) => void;
}

const AUTH_LABELS: Record<AuthType, string> = {
  none: 'Sem autenticação',
  bearer: 'Bearer Token',
  'apikey-header': 'API Key (Header)',
  'apikey-query': 'API Key (Query)',
  basic: 'Basic Auth',
};

export default function RequestConfig({ config, onChange }: Props) {
  const set = (partial: Partial<RunConfig>) => onChange({ ...config, ...partial });
  const setAuth = (partial: Partial<RunConfig['auth']>) =>
    onChange({ ...config, auth: { ...config.auth, ...partial } });

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Configuração da Requisição</h2>

      {/* URL + Method */}
      <div className="flex gap-2">
        <select
          value={config.method}
          onChange={(e) => set({ method: e.target.value as RunConfig['method'] })}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono w-28 shrink-0"
        >
          {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="https://api.exemplo.com/usuarios/{id}"
          value={config.url}
          onChange={(e) => set({ url: e.target.value })}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono placeholder-gray-600"
        />
      </div>

      {/* Auth */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase tracking-wide">Autenticação</label>
        <select
          value={config.auth.type}
          onChange={(e) => onChange({ ...config, auth: { type: e.target.value as AuthType } })}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full"
        >
          {(Object.keys(AUTH_LABELS) as AuthType[]).map((k) => (
            <option key={k} value={k}>{AUTH_LABELS[k]}</option>
          ))}
        </select>

        {config.auth.type === 'bearer' && (
          <input
            type="text"
            placeholder="Token"
            value={config.auth.token ?? ''}
            onChange={(e) => setAuth({ token: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
          />
        )}

        {config.auth.type === 'apikey-header' && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome do header (ex: X-API-Key)"
              value={config.auth.headerName ?? ''}
              onChange={(e) => setAuth({ headerName: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Valor"
              value={config.auth.apiKey ?? ''}
              onChange={(e) => setAuth({ apiKey: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
            />
          </div>
        )}

        {config.auth.type === 'apikey-query' && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome do parâmetro (ex: api_key)"
              value={config.auth.queryParam ?? ''}
              onChange={(e) => setAuth({ queryParam: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Valor"
              value={config.auth.apiKey ?? ''}
              onChange={(e) => setAuth({ apiKey: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
            />
          </div>
        )}

        {config.auth.type === 'basic' && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Usuário"
              value={config.auth.username ?? ''}
              onChange={(e) => setAuth({ username: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Senha"
              value={config.auth.password ?? ''}
              onChange={(e) => setAuth({ password: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {/* Body Template */}
      {(config.method === 'POST' || config.method === 'PUT') && (
        <div className="space-y-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Body Template (JSON)</label>
          <textarea
            rows={4}
            placeholder={'{\n  "nome": "{nome}",\n  "email": "{email}"\n}'}
            value={config.bodyTemplate ?? ''}
            onChange={(e) => set({ bodyTemplate: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono resize-y"
          />
        </div>
      )}

    </section>
  );
}
