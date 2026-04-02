import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCsv } from '../services/csvParser';
import { runRow } from '../services/httpRunner';
import { RunConfig, RunSummary } from '../types';

export const runnerRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

runnerRouter.post('/run', upload.single('csv'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'CSV file is required' });
    return;
  }

  let config: RunConfig;
  try {
    config = JSON.parse(req.body.config as string) as RunConfig;
  } catch {
    res.status(400).json({ error: 'Invalid config JSON' });
    return;
  }

  let rows: Record<string, string>[];
  try {
    rows = await parseCsv(req.file.buffer);
  } catch {
    res.status(400).json({ error: 'Failed to parse CSV' });
    return;
  }

  if (rows.length === 0) {
    res.status(400).json({ error: 'CSV has no data rows' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const envMap = Object.fromEntries((config.envVars ?? []).map((e) => [e.key, e.value]));
  const iterations = Math.max(1, config.iterations ?? 1);
  const stopOnFirstFailure = config.stopOnFirstFailure ?? false;
  const total = rows.length * iterations;
  const runStart = Date.now();
  let passed = 0;
  let failed = 0;
  let stoppedEarly = false;

  outer: for (let iter = 1; iter <= iterations; iter++) {
    for (let i = 0; i < rows.length; i++) {
      const result = await runRow(config, rows[i], i + 1, iter, total, envMap);
      send(result);
      if (result.ok) {
        passed++;
      } else {
        failed++;
      }
      if (stopOnFirstFailure && !result.ok) {
        stoppedEarly = true;
        break outer;
      }
    }
  }

  const summary: RunSummary = {
    done: true,
    totalRequests: passed + failed,
    passed,
    failed,
    totalDurationMs: Date.now() - runStart,
    stoppedEarly,
  };
  send(summary);
  res.end();
});

runnerRouter.post('/preview', upload.single('csv'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'CSV file is required' });
    return;
  }

  try {
    const rows = await parseCsv(req.file.buffer);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    res.json({ columns, preview: rows.slice(0, 5), total: rows.length });
  } catch {
    res.status(400).json({ error: 'Failed to parse CSV' });
  }
});
