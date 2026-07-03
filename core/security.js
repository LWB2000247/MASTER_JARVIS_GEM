// Security module: AES-256-GCM encryption for the /vault and a manual
// handshake gate that must be explicitly confirmed before any vault-derived
// data is allowed to leave the machine (e.g. via dispatcher.js -> n8n).

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const pendingHandshakes = new Map(); // token -> { summary, createdAt, approved }
const HANDSHAKE_TTL_MS = 15 * 60 * 1000;

function getVaultKey() {
  const hex = process.env.VAULT_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'VAULT_KEY missing or invalid in .env — must be a 64-char hex string (32 bytes) for AES-256-GCM.'
    );
  }
  return Buffer.from(hex, 'hex');
}

function encryptVault(plainObjectOrString) {
  const key = getVaultKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext =
    typeof plainObjectOrString === 'string'
      ? plainObjectOrString
      : JSON.stringify(plainObjectOrString);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex')
  };
}

function decryptVault({ iv, authTag, data }) {
  const key = getVaultKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

/**
 * Any code path that wants to send vault-derived data off this machine
 * (dispatcher -> n8n, an LLM API call that includes vault content, etc.)
 * must first request a handshake token, and that token can only be
 * confirmed by an explicit, separate human action (CLI prompt or an
 * /api/handshake/:token/confirm call) — never auto-approved.
 */
function requestHandshake(summary) {
  const token = crypto.randomUUID();
  pendingHandshakes.set(token, { summary, createdAt: Date.now(), approved: false });
  return token;
}

function confirmHandshake(token) {
  const entry = pendingHandshakes.get(token);
  if (!entry) throw new Error('Unknown or expired handshake token.');
  if (Date.now() - entry.createdAt > HANDSHAKE_TTL_MS) {
    pendingHandshakes.delete(token);
    throw new Error('Handshake token expired — request a new one.');
  }
  entry.approved = true;
  return true;
}

function isHandshakeApproved(token) {
  const entry = pendingHandshakes.get(token);
  return Boolean(entry && entry.approved);
}

function requireApprovedHandshake(token) {
  if (!isHandshakeApproved(token)) {
    throw new Error('Manual handshake not confirmed — refusing to let data leave the machine.');
  }
  pendingHandshakes.delete(token); // one-time use
}

export {
  encryptVault,
  decryptVault,
  requestHandshake,
  confirmHandshake,
  isHandshakeApproved,
  requireApprovedHandshake
};
