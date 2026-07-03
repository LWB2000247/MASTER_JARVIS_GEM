// orchestrator.js: the main entry point that ties router, dispatcher,
// memory_manager, security and verifier together. Starts with zero
// knowledge of the user and builds memory/brain.json purely from
// conversation.

import readline from 'node:readline';
import { route } from './router.js';
import { addFact, listFacts, totalFactCount, loadBrain } from './memory_manager.js';
import { buildPayload } from './dispatcher.js';
import { crossReference } from './verifier.js';

const INTRO_PT = [
  'Olá, Leon. Sou o Master Jarvis — o teu orquestrador pessoal, a correr localmente na tua máquina.',
  'Estado atual: conhecimento zero. Ainda não sei nada sobre ti, a AC Management ou a Aura Tavira.',
  'Tudo o que eu aprender fica guardado apenas aqui, em memory/brain.json — nunca sai deste computador sem a tua confirmação manual.',
  'Podes começar por me dizer um facto simples: o teu nome completo, ou algo sobre a AC Management ou a Aura Tavira?'
].join('\n');

/** A very simple "remember: <fact>" convention for teaching the brain. */
const REMEMBER_PATTERN = /^remember:\s*(.+)$/i;

function introduce() {
  return INTRO_PT;
}

async function handleMessage(text, { source = 'cli' } = {}) {
  const { language, department } = route(text);

  const rememberMatch = text.match(REMEMBER_PATTERN);
  let storedFact = null;

  if (rememberMatch) {
    const factText = rememberMatch[1].trim();
    const key = `fact_${Date.now()}`;
    await addFact(department, key, factText, { source });
    storedFact = { department, key, value: factText };
  }

  const payload = buildPayload(text, { department, language });

  return {
    language,
    department,
    storedFact,
    dispatchPreview: payload,
    reply: storedFact
      ? `[${language}] Guardado em memory/brain.json sob "${department}".`
      : `[${language}] Recebido. Departamento detetado: ${department}. (Usa "remember: <facto>" para ensinar-me algo.)`
  };
}

async function status() {
  const brain = await loadBrain();
  return {
    knowledge_level: brain.meta.knowledge_level,
    total_facts: totalFactCount(brain),
    facts: await listFacts()
  };
}

async function runReplIfMain() {
  console.log(introduce());
  console.log('\n(Digita "sair" para terminar. Usa "remember: <facto>" para ensinar algo novo.)\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt('you> ');
  rl.prompt();

  // readline can emit several 'line' events synchronously in one tick
  // (e.g. piped input arriving as a single chunk), but each handler does
  // async I/O (memory_manager writes to disk). Chain them onto one promise
  // so writes are never interrupted by a later 'sair' closing the process
  // mid-flight.
  let chain = Promise.resolve();

  rl.on('line', (line) => {
    chain = chain.then(() => processLine(line.trim())).catch((err) => {
      console.error('Erro:', err.message);
    });
  });

  async function processLine(text) {
    if (['sair', 'exit', 'quit'].includes(text.toLowerCase())) {
      rl.close();
      return;
    }
    const result = await handleMessage(text);
    console.log(result.reply);
    rl.prompt();
  }

  rl.on('close', async () => {
    await chain;
    console.log('\nAté já.');
    process.exit(0);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReplIfMain();
}

export { introduce, handleMessage, status, crossReference };
