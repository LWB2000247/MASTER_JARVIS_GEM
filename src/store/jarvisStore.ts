import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as db from '../services/database'

export interface Conversation {
  id: string | number
  timestamp: number
  userInput: string
  userInputType: 'voice' | 'text' | 'file'
  fileType?: 'pdf' | 'image' | 'video'
  fileName?: string
  generatedPrompt: string
  response: string
  rating?: 'up' | 'down'
  language: 'en' | 'de' | 'pt'
  tokensUsed?: number
}

export interface PromptTemplate {
  id: string | number
  name: string
  template: string
  taskType: string
  successRate: number
  usageCount: number
  createdAt?: number
}

interface JarvisStore {
  language: 'en' | 'de' | 'pt'
  isDarkMode: boolean
  conversations: Conversation[]
  promptTemplates: PromptTemplate[]
  apiKey: string
  voiceEnabled: boolean
  voiceSpeed: number
  isListening: boolean
  isProcessing: boolean
  searchQuery: string
  totalTokensUsed: number

  setLanguage: (lang: 'en' | 'de' | 'pt') => void
  setDarkMode: (dark: boolean) => void
  setApiKey: (key: string) => void
  setVoiceEnabled: (enabled: boolean) => void
  setVoiceSpeed: (speed: number) => void
  setIsListening: (listening: boolean) => void
  setIsProcessing: (processing: boolean) => void
  addConversation: (conv: Conversation) => void
  updateConversationRating: (id: string | number, rating: 'up' | 'down') => void
  clearConversations: () => void
  getConversationHistory: (count?: number) => Conversation[]
  searchConversations: (query: string) => Promise<Conversation[]>
  loadConversations: () => Promise<void>
  addPromptTemplate: (template: PromptTemplate) => void
  getPromptTemplates: (taskType?: string) => Promise<PromptTemplate[]>
}

export const useJarvisStore = create<JarvisStore>()(
  persist(
    (set, get) => ({
      language: 'en' as 'en' | 'de' | 'pt',
      isDarkMode: false,
      conversations: [],
      promptTemplates: [],
      apiKey: '',
      voiceEnabled: true,
      voiceSpeed: 1,
      isListening: false,
      isProcessing: false,
      searchQuery: '',
      totalTokensUsed: 0,

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
        // Also save to IndexedDB
        db.saveConversation(conv).catch(console.error)
      },

      updateConversationRating: async (id, rating) => {
        const conversations = get().conversations.map((c) =>
          c.id === id ? { ...c, rating } : c,
        )
        set({ conversations })
        // Update in database
        await db.updateConversationRating(String(id), rating)
      },

      clearConversations: () => {
        set({ conversations: [] })
        db.clearAllConversations().catch(console.error)
      },

      getConversationHistory: (count = 10) => {
        return get().conversations.slice(0, count)
      },

      searchConversations: async (query) => {
        return db.searchConversations(query, get().language)
      },

      loadConversations: async () => {
        const conversations = await db.getConversations(50)
        set({ conversations })
      },

      addPromptTemplate: (template) => {
        set({ promptTemplates: [...get().promptTemplates, template] })
        db.savePromptTemplate(template as db.PromptTemplate).catch(console.error)
      },

      getPromptTemplates: async (taskType?: string) => {
        return db.getPromptTemplates(taskType)
      },
    }),
    {
      name: 'jarvis-storage',
    },
  ),
)
