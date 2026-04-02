import { AssertionRule, AssertionResult } from '../types';

function resolvePath(obj: unknown, path: string): unknown {
  // Supports $.a.b.c and $.a[0].b
  const parts = path
    .replace(/^\$\.?/, '')
    .split(/\.|\[(\d+)\]/)
    .filter(Boolean);

  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current)) {
      const idx = parseInt(part, 10);
      current = isNaN(idx) ? undefined : current[idx];
    } else {
      return undefined;
    }
  }
  return current;
}

function buildLabel(rule: AssertionRule): string {
  switch (rule.type) {
    case 'status-equals':
      return `Status code equals ${rule.value}`;
    case 'status-not-equals':
      return `Status code is not ${rule.value}`;
    case 'response-time-lt':
      return `Response time < ${rule.value}ms`;
    case 'body-contains':
      return `Body contains "${rule.value}"`;
    case 'jsonpath-equals':
      return `${rule.path} equals "${rule.value}"`;
  }
}

export function evaluateAssertions(
  rules: AssertionRule[],
  statusCode: number,
  duration: number,
  responseBody: string,
): AssertionResult[] {
  return rules.map((rule) => {
    const label = buildLabel(rule);
    let passed = false;
    let actual: string | undefined;

    switch (rule.type) {
      case 'status-equals':
        passed = statusCode === parseInt(rule.value, 10);
        actual = passed ? undefined : String(statusCode);
        break;
      case 'status-not-equals':
        passed = statusCode !== parseInt(rule.value, 10);
        actual = passed ? undefined : String(statusCode);
        break;
      case 'response-time-lt':
        passed = duration < parseInt(rule.value, 10);
        actual = passed ? undefined : `${duration}ms`;
        break;
      case 'body-contains':
        passed = responseBody.includes(rule.value);
        if (!passed) {
          actual = responseBody.length > 100
            ? responseBody.slice(0, 100) + '...'
            : responseBody;
        }
        break;
      case 'jsonpath-equals': {
        try {
          const parsed = JSON.parse(responseBody);
          const resolved = resolvePath(parsed, rule.path ?? '$');
          passed = String(resolved) === rule.value;
          actual = passed ? undefined : String(resolved);
        } catch {
          passed = false;
          actual = 'invalid JSON';
        }
        break;
      }
    }

    return { assertionId: rule.id, type: rule.type, label, passed, actual };
  });
}
