# /vault

Local, encrypted-at-rest storage for sensitive business plans, contracts,
and code (AC Management, Aura Tavira, or anything Leon marks confidential).

- Files in this directory are written and read exclusively through
  `core/security.js` (`encryptVault` / `decryptVault`, AES-256-GCM).
- Nothing in here is ever transmitted anywhere by `core/dispatcher.js`
  without an explicit, manually-confirmed handshake
  (`core/security.js#requestHandshake` / `confirmHandshake`).
- Raw contents are gitignored — only this README is tracked.
