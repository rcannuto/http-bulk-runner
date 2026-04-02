import axios, { AxiosRequestConfig } from 'axios';
import { AuthConfig, RunConfig, RowResult } from '../types';
import { resolveTemplate } from './templateEngine';
import { evaluateAssertions } from './assertionRunner';

function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'bearer':
      return { Authorization: `Bearer ${auth.token ?? ''}` };
    case 'apikey-header':
      return { [auth.headerName ?? 'X-API-Key']: auth.apiKey ?? '' };
    case 'basic': {
      const encoded = Buffer.from(`${auth.username ?? ''}:${auth.password ?? ''}`).toString('base64');
      return { Authorization: `Basic ${encoded}` };
    }
    default:
      return {};
  }
}

function applyApiKeyQuery(url: string, auth: AuthConfig): string {
  if (auth.type !== 'apikey-query') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${auth.queryParam ?? 'api_key'}=${auth.apiKey ?? ''}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runRow(
  config: RunConfig,
  row: Record<string, string>,
  rowIndex: number,
  iteration: number,
  total: number,
  envMap: Record<string, string>,
): Promise<RowResult> {
  const resolvedUrl = applyApiKeyQuery(
    resolveTemplate(config.url, row, envMap),
    config.auth,
  );
  const authHeaders = buildAuthHeaders(config.auth);

  let body: string | undefined;
  if (config.bodyTemplate && config.method !== 'GET' && config.method !== 'DELETE') {
    body = resolveTemplate(config.bodyTemplate, row, envMap);
  }

  const resolvedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(config.headers ?? {})) {
    resolvedHeaders[resolveTemplate(k, row, envMap)] = resolveTemplate(v, row, envMap);
  }

  const axiosConfig: AxiosRequestConfig = {
    method: config.method,
    url: resolvedUrl,
    headers: {
      'Content-Type': 'application/json',
      ...resolvedHeaders,
      ...authHeaders,
    },
    data: body ? JSON.parse(body) : undefined,
    validateStatus: () => true,
    timeout: 30000,
  };

  const start = Date.now();
  try {
    const response = await axios(axiosConfig);
    const duration = Date.now() - start;
    const statusCode = response.status;
    const httpOk = statusCode >= 200 && statusCode < 300;
    const responseBody = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    const assertionResults = evaluateAssertions(
      config.assertions ?? [],
      statusCode,
      duration,
      responseBody,
    );
    const ok = httpOk && assertionResults.every((a) => a.passed);

    return {
      row: rowIndex,
      iteration,
      total,
      url: resolvedUrl,
      statusCode,
      duration,
      ok,
      httpOk,
      assertionResults,
      responseBody,
    };
  } catch (err: unknown) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return {
      row: rowIndex,
      iteration,
      total,
      url: resolvedUrl,
      statusCode: 0,
      duration,
      ok: false,
      httpOk: false,
      assertionResults: [],
      error: message,
    };
  } finally {
    if (config.delayMs > 0) {
      await delay(config.delayMs);
    }
  }
}
