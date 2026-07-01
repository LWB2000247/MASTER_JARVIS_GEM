import axios from 'axios'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash'

export interface GenerationRequest {
  prompt: string
  context?: string
  language: 'en' | 'de' | 'pt'
  files?: Array<{ data: string; mimeType: string; name: string }>
}

export interface GenerationResponse {
  text: string
  tokensUsed: number
  confidence: number
}

export interface Part {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

async function callGeminiAPI(
  apiKey: string,
  parts: Part[],
  streaming = false,
): Promise<{ text: string; tokensUsed: number }> {
  try {
    const endpoint = streaming
      ? `${GEMINI_API_BASE}:streamGenerateContent?key=${apiKey}`
      : `${GEMINI_API_BASE}:generateContent?key=${apiKey}`

    const response = await axios.post(
      endpoint,
      {
        contents: [
          {
            parts,
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

    if (streaming) {
      const text = response.data
        .split('\n')
        .filter((line: string) => line.startsWith('data:'))
        .map((line: string) => {
          try {
            return JSON.parse(line.replace('data:', '')).candidates[0].content.parts[0].text || ''
          } catch {
            return ''
          }
        })
        .join('')

      return {
        text: text.trim(),
        tokensUsed: 0,
      }
    } else {
      const text = response.data.candidates[0].content.parts[0].text
      const usageMetadata = response.data.usageMetadata || {}

      return {
        text,
        tokensUsed: usageMetadata.totalTokenCount || 0,
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Gemini API Error: ${error.response?.data?.error?.message || error.message}`)
    }
    throw error
  }
}

export async function callGeminiAPIStreaming(
  apiKey: string,
  parts: Part[],
  onChunk: (text: string) => void,
): Promise<{ fullText: string; tokensUsed: number }> {
  try {
    const endpoint = `${GEMINI_API_BASE}:streamGenerateContent?key=${apiKey}`

    const response = await axios.post(
      endpoint,
      {
        contents: [
          {
            parts,
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

    let fullText = ''

    if (response.data) {
      const lines = response.data.split('\n')
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const json = JSON.parse(line.replace('data:', ''))
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (text) {
              onChunk(text)
              fullText += text
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }

    return {
      fullText: fullText.trim(),
      tokensUsed: 0,
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
  files?: Array<{ data: string; mimeType: string; name: string }>,
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

  const parts: Part[] = [{ text: fullPrompt }]

  if (files) {
    files.forEach((file) => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        },
      })
    })
  }

  const { text, tokensUsed } = await callGeminiAPI(apiKey, parts)

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
  files?: Array<{ data: string; mimeType: string; name: string }>,
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

  const parts: Part[] = [{ text: fullPrompt }]

  if (files) {
    files.forEach((file) => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        },
      })
    })
  }

  const { text, tokensUsed } = await callGeminiAPI(apiKey, parts)

  return {
    text,
    tokensUsed,
    confidence: 0.95,
  }
}

export async function processUserTaskStreaming(
  apiKey: string,
  task: string,
  language: 'en' | 'de' | 'pt',
  onChunk: (text: string) => void,
  files?: Array<{ data: string; mimeType: string; name: string }>,
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

  const parts: Part[] = [{ text: fullPrompt }]

  if (files) {
    files.forEach((file) => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        },
      })
    })
  }

  const { fullText, tokensUsed } = await callGeminiAPIStreaming(apiKey, parts, onChunk)

  return {
    text: fullText,
    tokensUsed,
    confidence: 0.95,
  }
}
