// memory_manager.js: CRUD access to /memory/brain.json — the only place
// persistent facts about Leon, AC Management and Aura Tavira live.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAIN_PATH = path.join(__dirname, '..', 'memory', 'brain.json');

const EMPTY_BRAIN = {
  meta: { version: 1, created: null, last_updated: null, knowledge_level: 'zero' },
  facts: { leon: {}, ac_management: {}, aura_tavira: {}, general: {} }
};

async function loadBrain() {
  try {
    const raw = await fs.readFile(BRAIN_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return structuredClone(EMPTY_BRAIN);
    throw err;
  }
}

async function saveBrain(brain) {
  brain.meta.last_updated = new Date().toISOString();
  if (!brain.meta.created) brain.meta.created = brain.meta.last_updated;
  brain.meta.knowledge_level = totalFactCount(brain) === 0 ? 'zero' : 'learning';
  await fs.writeFile(BRAIN_PATH, JSON.stringify(brain, null, 2), 'utf8');
  return brain;
}

function totalFactCount(brain) {
  return Object.values(brain.facts).reduce((sum, cat) => sum + Object.keys(cat).length, 0);
}

/** Store or overwrite a fact under a department/category. */
async function addFact(category, key, value, { source = 'conversation' } = {}) {
  const brain = await loadBrain();
  if (!brain.facts[category]) brain.facts[category] = {};
  brain.facts[category][key] = { value, source, updated_at: new Date().toISOString() };
  return saveBrain(brain);
}

async function getFact(category, key) {
  const brain = await loadBrain();
  return brain.facts[category]?.[key] ?? null;
}

async function listFacts(category) {
  const brain = await loadBrain();
  if (category) return brain.facts[category] ?? {};
  return brain.facts;
}

async function deleteFact(category, key) {
  const brain = await loadBrain();
  if (brain.facts[category]) delete brain.facts[category][key];
  return saveBrain(brain);
}

export { loadBrain, saveBrain, addFact, getFact, listFacts, deleteFact, totalFactCount };
