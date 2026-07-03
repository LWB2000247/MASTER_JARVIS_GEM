// api/server.js: lightweight Express server exposing the orchestrator for
// future mobile/laptop web access. Runs alongside (not instead of) the
// Vite frontend in /src.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleMessage, introduce, status } from '../core/orchestrator.js';
import { crossReference } from '../core/verifier.js';
import { confirmHandshake, requestHandshake } from '../core/security.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'master-jarvis', time: new Date().toISOString() });
});

app.get('/api/introduce', (_req, res) => {
  res.json({ message: introduce() });
});

app.get('/api/status', async (_req, res, next) => {
  try {
    res.json(await status());
  } catch (err) {
    next(err);
  }
});

app.post('/api/message', async (req, res, next) => {
  try {
    const { text, source } = req.body ?? {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    res.json(await handleMessage(text, { source: source || 'api' }));
  } catch (err) {
    next(err);
  }
});

app.post('/api/verify', async (req, res, next) => {
  try {
    const { query, llmA, llmB } = req.body ?? {};
    if (!query) return res.status(400).json({ error: 'query is required' });
    res.json(await crossReference(query, { llmA, llmB }));
  } catch (err) {
    next(err);
  }
});

app.post('/api/handshake/request', (req, res) => {
  const { summary } = req.body ?? {};
  const token = requestHandshake(summary || 'unspecified vault export');
  res.json({ token });
});

app.post('/api/handshake/:token/confirm', (req, res, next) => {
  try {
    confirmHandshake(req.params.token);
    res.json({ confirmed: true });
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Master Jarvis API listening on http://localhost:${PORT}`);
});
