export function interpolate(template: string, row: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in row ? row[key] : `{${key}}`;
  });
}

export function interpolateEnv(template: string, envVars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => envVars[key] ?? `{{${key}}}`);
}

export function resolveTemplate(
  template: string,
  row: Record<string, string>,
  envVars: Record<string, string>,
): string {
  return interpolate(interpolateEnv(template, envVars), row);
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{(\w+)\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}
