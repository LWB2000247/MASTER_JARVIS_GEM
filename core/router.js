// Language detection + department routing for Master Jarvis.

const LANGUAGE_MARKERS = {
  'pt-PT': [
    'obrigado', 'obrigada', 'por favor', 'você', 'voce', 'está', 'esta',
    'não', 'nao', 'olá', 'ola', 'sim', 'ficheiro', 'telemóvel', 'preciso',
    'quero', 'agora', 'hoje', 'amanhã', 'reunião', 'apartamento'
  ],
  de: [
    'bitte', 'danke', 'nicht', 'und', 'ist', 'ich', 'sie', 'wir', 'heute',
    'morgen', 'wohnung', 'termin', 'jetzt', 'brauche'
  ],
  en: [
    'please', 'thanks', 'thank you', 'the', 'and', 'is', 'you', 'need',
    'today', 'tomorrow', 'meeting', 'apartment', 'now'
  ]
};

const DEPARTMENT_KEYWORDS = {
  ac_management: ['ac management', 'air condition', 'ar condicionado', 'klimaanlage', 'hvac', 'installation', 'instalação', 'instalacao', 'client', 'cliente', 'kunde'],
  aura_tavira: ['aura tavira', 'aura', 'tavira', 'apartment', 'apartamento', 'wohnung', 'guest', 'hóspede', 'hospede', 'gast', 'booking', 'reserva'],
  leon: ['leon', 'personal', 'pessoal', 'persönlich'],
  general: []
};

function detectLanguage(text = '') {
  const lower = text.toLowerCase();
  const scores = { 'pt-PT': 0, de: 0, en: 0 };

  for (const [lang, markers] of Object.entries(LANGUAGE_MARKERS)) {
    for (const marker of markers) {
      if (lower.includes(marker)) scores[lang] += 1;
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] === 0) return 'en'; // default fallback
  return best[0];
}

function routeDepartment(text = '') {
  const lower = text.toLowerCase();
  for (const [department, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (department === 'general') continue;
    if (keywords.some((kw) => lower.includes(kw))) return department;
  }
  return 'general';
}

function route(text = '') {
  return {
    language: detectLanguage(text),
    department: routeDepartment(text)
  };
}

export { detectLanguage, routeDepartment, route };
