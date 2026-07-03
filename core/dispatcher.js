// dispatcher.js: turns a natural-language command into a structured JSON
// payload and posts it to an n8n webhook. Payloads flagged `sensitive`
// (i.e. touching /vault content) require an approved security handshake
// before they are allowed to leave the machine.

import { requireApprovedHandshake } from './security.js';

const ACTION_PATTERNS = [
  { action: 'schedule_meeting', regex: /\b(schedule|marcar|termin|reunião|reuniao)\b/i },
  { action: 'send_invoice', regex: /\b(invoice|fatura|rechnung)\b/i },
  { action: 'create_task', regex: /\b(task|tarefa|aufgabe|todo)\b/i },
  { action: 'guest_booking', regex: /\b(booking|reserva|reservation|buchung)\b/i },
  { action: 'notify', regex: /\b(notify|avisar|notificar|benachrichtigen)\b/i }
];

function classifyAction(text) {
  const match = ACTION_PATTERNS.find((p) => p.regex.test(text));
  return match ? match.action : 'generic_command';
}

/**
 * Converts free text into an n8n-ready payload.
 * @param {string} text - the natural language command
 * @param {{ department: string, language: string, sensitive?: boolean }} context
 */
function buildPayload(text, context = {}) {
  return {
    event: classifyAction(text),
    department: context.department || 'general',
    language: context.language || 'en',
    sensitive: Boolean(context.sensitive),
    text,
    timestamp: new Date().toISOString(),
    source: 'master-jarvis-dispatcher'
  };
}

/**
 * Sends a payload to the configured n8n webhook. If the payload is marked
 * sensitive, a confirmed handshakeToken must be supplied or this throws.
 */
async function dispatchToN8n(payload, { handshakeToken } = {}) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL is not set in .env — cannot dispatch.');
  }

  if (payload.sensitive) {
    requireApprovedHandshake(handshakeToken);
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`n8n webhook responded with ${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
}

export { classifyAction, buildPayload, dispatchToN8n };
