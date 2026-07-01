import axios from 'axios'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export interface GenerationRequest {
  prompt: string
  context?: string
  language: 'en' | 'de' | 'pt'
}

export interface GenerationResponse {
  text: string
  tokensUsed: number
  confidence: number
}

async function callGeminiAPI(
  apiKey: string,
  prompt: string,
): Promise<{ text: string; tokensUsed: number }> {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.95,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const text = response.data.candidates[0].content.parts[0].text
    const usageMetadata = response.data.usageMetadata || {}

    return {
      text,
      tokensUsed: usageMetadata.totalTokenCount || 0,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Gemini API Error: ${error.response?.data?.error?.message || error.message}`)
    }
    throw error
  }
}

export async function generateOptimizedPrompt(
  apiKey: string,
  userTask: string,
  context: string,
  language: 'en' | 'de' | 'pt',
): Promise<GenerationResponse> {
  let systemPrompt = ''

  if (language === 'de') {
    systemPrompt = `Du bist Master Jarvis, ein intelligenter Prompt-Ingenieur.
Analysiere die Benutzeraufgabe und generiere einen optimierten Prompt für Claude oder Gemini.
Antworte NUR mit dem optimierten Prompt, keine Erklärungen.`
  } else if (language === 'pt') {
    systemPrompt = `Você é Master Jarvis, um engenheiro de prompts inteligente.
Analise a tarefa do usuário e gere um prompt otimizado para Claude ou Gemini.
Responda APENAS com o prompt otimizado, sem explicações.`
  } else {
    systemPrompt = `You are Master Jarvis, an intelligent prompt engineer.
Analyze the user task and generate an optimized prompt for Claude or Gemini.
Respond with ONLY the optimized prompt, no explanations.`
  }

  const fullPrompt = `${systemPrompt}\n\nUser Task: ${userTask}\nContext: ${context}`

  const { text, tokensUsed } = await callGeminiAPI(apiKey, fullPrompt)

  return {
    text: text.trim(),
    tokensUsed,
    confidence: 0.9,
  }
}

export async function processUserTask(
  apiKey: string,
  task: string,
  language: 'en' | 'de' | 'pt',
): Promise<GenerationResponse> {
  let systemPrompt = ''

  if (language === 'de') {
    systemPrompt = 'Du bist Master Jarvis, ein hilfreicher KI-Assistent. Beantworte die Frage präzise und hilfreich.'
  } else if (language === 'pt') {
    systemPrompt = 'Você é Master Jarvis, um assistente de IA útil. Responda à pergunta com precisão e utilidade.'
  } else {
    systemPrompt = 'You are Master Jarvis, a helpful AI assistant. Answer the question precisely and helpfully.'
  }

  const fullPrompt = `${systemPrompt}\n\n${task}`

  const { text, tokensUsed } = await callGeminiAPI(apiKey, fullPrompt)

  return {
    text,
    tokensUsed,
    confidence: 0.95,
  }
}
