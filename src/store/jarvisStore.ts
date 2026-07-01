import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Conversation {
  id: string
  timestamp: number
  userInput: string
  userInputType: 'voice' | 'text' | 'file'
  fileType?: 'pdf' | 'image' | 'video'
  fileName?: string
  generatedPrompt: string
  response: string
  rating?: 'up' | 'down'
  language: 'en' | 'de'
  tokensUsed?: number
}

export interface PromptTemplate {
  id: string
  name: string
  template: string
  taskType: string
  successRate: number
  usageCount: number
}

interface JarvisStore {
  language: 'en' | 'de'
  isDarkMode: boolean
  conversations: Conversation[]
  promptTemplates: PromptTemplate[]
  apiKey: string
  voiceEnabled: boolean
  voiceSpeed: number
  isListening: boolean
  isProcessing: boolean

  setLanguage: (lang: 'en' | 'de') => void
  setDarkMode: (dark: boolean) => void
  setApiKey: (key: string) => void
  setVoiceEnabled: (enabled: boolean) => void
  setVoiceSpeed: (speed: number) => void
  setIsListening: (listening: boolean) => void
  setIsProcessing: (processing: boolean) => void
  addConversation: (conv: Conversation) => void
  updateConversationRating: (id: string, rating: 'up' | 'down') => void
  clearConversations: () => void
  getConversationHistory: (count?: number) => Conversation[]
  addPromptTemplate: (template: PromptTemplate) => void
}

export const useJarvisStore = create<JarvisStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      isDarkMode: false,
      conversations: [],
      promptTemplates: [],
      apiKey: '',
      voiceEnabled: true,
      voiceSpeed: 1,
      isListening: false,
      isProcessing: false,

      setLanguage: (lang) => set({ language: lang }),
      setDarkMode: (dark) => set({ isDarkMode: dark }),
      setApiKey: (key) => set({ apiKey: key }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
      setIsListening: (listening) => set({ isListening: listening }),
      setIsProcessing: (processing) => set({ isProcessing: processing }),

      addConversation: (conv) => {
        const conversations = [conv, ...get().conversations]
        set({ conversations })
      },

      updateConversationRating: (id, rating) => {
        const conversations = get().conversations.map((c) =>
          c.id === id ? { ...c, rating } : c,
        )
        set({ conversations })
      },

      clearConversations: () => set({ conversations: [] }),

      getConversationHistory: (count = 10) => {
        return get().conversations.slice(0, count)
      },

      addPromptTemplate: (template) => {
        set({ promptTemplates: [...get().promptTemplates, template] })
      },
    }),
    {
      name: 'jarvis-storage',
    },
  ),
)
