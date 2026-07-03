// verifier.js: queries two distinct LLMs with the same prompt and produces
// a Discrepancy Report highlighting where their answers disagree.

const PROVIDERS = {
  openai: {
    envKey: 'OPENAI_API_KEY',
    async call(prompt, apiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? '';
    }
  },
  anthropic: {
    envKey: 'ANTHROPIC_API_KEY',
    async call(prompt, apiKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
      const json = await res.json();
      return json.content?.[0]?.text ?? '';
    }
  },
  gemini: {
    envKey: 'GEMINI_API_KEY',
    async call(prompt, apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      if (!res.ok) throw new Error(`Gemini error ${res.status}`);
      const json = await res.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
  }
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'and',
  'it', 'that', 'this', 'as', 'for', 'with', 'be', 'by', 'or'
]);

function significantWords(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

/** Jaccard similarity over significant words as a cheap agreement proxy. */
function similarity(textA, textB) {
  const a = significantWords(textA);
  const b = significantWords(textB);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 1 : intersection / union;
}

async function queryProvider(name, prompt) {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown LLM provider: ${name}`);
  const apiKey = process.env[provider.envKey];
  if (!apiKey) throw new Error(`${provider.envKey} not set in .env — cannot call ${name}.`);
  return provider.call(prompt, apiKey);
}

/**
 * Cross-references a query against two configured LLMs and returns a
 * Discrepancy Report.
 */
async function crossReference(query, { llmA = 'openai', llmB = 'anthropic' } = {}) {
  const [resultA, resultB] = await Promise.allSettled([
    queryProvider(llmA, query),
    queryProvider(llmB, query)
  ]);

  const responses = [
    {
      provider: llmA,
      ok: resultA.status === 'fulfilled',
      text: resultA.status === 'fulfilled' ? resultA.value : null,
      error: resultA.status === 'rejected' ? resultA.reason.message : null
    },
    {
      provider: llmB,
      ok: resultB.status === 'fulfilled',
      text: resultB.status === 'fulfilled' ? resultB.value : null,
      error: resultB.status === 'rejected' ? resultB.reason.message : null
    }
  ];

  const bothOk = responses[0].ok && responses[1].ok;
  const agreementScore = bothOk ? similarity(responses[0].text, responses[1].text) : null;

  return {
    query,
    generated_at: new Date().toISOString(),
    responses,
    agreement_score: agreementScore,
    likely_discrepancy: bothOk ? agreementScore < 0.35 : null,
    note: bothOk
      ? null
      : 'One or both providers failed — check API keys in .env before trusting this report.'
  };
}

export { crossReference, similarity, queryProvider };
