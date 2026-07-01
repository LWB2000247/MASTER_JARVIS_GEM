import Dexie, { Table } from 'dexie'
import { Conversation } from '../store/jarvisStore'

export interface StoredFile {
  id: string
  name: string
  type: 'pdf' | 'image' | 'video' | 'text'
  content: string // base64 or text
  preview?: string
  size: number
  uploadedAt: number
}

export interface PromptTemplate {
  id: string
  name: string
  template: string
  taskType: string
  successRate: number
  usageCount: number
  createdAt: number
}

export class JarvisDB extends Dexie {
  conversations!: Table<Conversation>
  files!: Table<StoredFile>
  promptTemplates!: Table<PromptTemplate>

  constructor() {
    super('MasterJarvisDB')
    this.version(1).stores({
      conversations: '++id, timestamp, language',
      files: '++id, uploadedAt',
      promptTemplates: '++id, taskType, successRate',
    })
  }
}

export const db = new JarvisDB()

export async function saveConversation(conv: Conversation): Promise<void> {
  await db.conversations.add(conv)
}

export async function getConversations(limit = 50, offset = 0): Promise<Conversation[]> {
  return db.conversations.orderBy('timestamp').reverse().offset(offset).limit(limit).toArray()
}

export async function searchConversations(query: string, language?: string): Promise<Conversation[]> {
  let results = await db.conversations.toArray()

  results = results.filter((conv) => {
    const matchesQuery =
      conv.userInput.toLowerCase().includes(query.toLowerCase()) ||
      conv.response.toLowerCase().includes(query.toLowerCase())
    const matchesLanguage = !language || conv.language === language
    return matchesQuery && matchesLanguage
  })

  return results.sort((a, b) => b.timestamp - a.timestamp)
}

export async function updateConversationRating(id: string, rating: 'up' | 'down'): Promise<void> {
  const conv = await db.conversations.get(id as any)
  if (conv) {
    await db.conversations.update(id as any, { rating })
  }
}

export async function clearAllConversations(): Promise<void> {
  await db.conversations.clear()
}

export async function saveFile(file: StoredFile): Promise<string> {
  const id = await db.files.add(file)
  return id as string
}

export async function getFile(id: string): Promise<StoredFile | undefined> {
  return db.files.get(id as any)
}

export async function deleteFile(id: string): Promise<void> {
  await db.files.delete(id as any)
}

export async function savePromptTemplate(template: PromptTemplate): Promise<string> {
  const id = await db.promptTemplates.add(template)
  return id as string
}

export async function getPromptTemplates(taskType?: string): Promise<PromptTemplate[]> {
  if (taskType) {
    return db.promptTemplates.where('taskType').equals(taskType).toArray()
  }
  return db.promptTemplates.orderBy('successRate').reverse().toArray()
}

export async function updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void> {
  await db.promptTemplates.update(id as any, updates)
}

export async function getConversationStats(): Promise<{
  total: number
  byLanguage: Record<string, number>
  avgRating: number
  topTaskTypes: Array<{ type: string; count: number }>
}> {
  const conversations = await db.conversations.toArray()

  const byLanguage: Record<string, number> = {}
  let totalRatings = 0
  let ratingCount = 0

  conversations.forEach((conv) => {
    byLanguage[conv.language] = (byLanguage[conv.language] || 0) + 1
    if (conv.rating === 'up') totalRatings++
    if (conv.rating) ratingCount++
  })

  return {
    total: conversations.length,
    byLanguage,
    avgRating: ratingCount > 0 ? totalRatings / ratingCount : 0,
    topTaskTypes: [],
  }
}
