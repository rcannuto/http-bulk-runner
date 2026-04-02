export type AuthType = 'none' | 'bearer' | 'apikey-header' | 'apikey-query' | 'basic';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  headerName?: string;
  apiKey?: string;
  queryParam?: string;
  username?: string;
  password?: string;
}

export type AssertionType =
  | 'status-equals'
  | 'status-not-equals'
  | 'response-time-lt'
  | 'body-contains'
  | 'jsonpath-equals';

export interface AssertionRule {
  id: string;
  type: AssertionType;
  value: string;
  path?: string;
}

export interface EnvVar {
  key: string;
  value: string;
}

export interface AssertionResult {
  assertionId: string;
  type: AssertionType;
  label: string;
  passed: boolean;
  actual?: string;
}

export interface RunSummary {
  done: true;
  totalRequests: number;
  passed: number;
  failed: number;
  totalDurationMs: number;
  stoppedEarly: boolean;
}

export interface RunConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  auth: AuthConfig;
  delayMs: number;
  bodyTemplate?: string;
  headers?: Record<string, string>;
  iterations: number;
  stopOnFirstFailure: boolean;
  assertions: AssertionRule[];
  envVars: EnvVar[];
}

export interface RowResult {
  row: number;
  iteration: number;
  total: number;
  url: string;
  statusCode: number;
  duration: number;
  ok: boolean;
  httpOk: boolean;
  assertionResults: AssertionResult[];
  responseBody?: string;
  error?: string;
}
