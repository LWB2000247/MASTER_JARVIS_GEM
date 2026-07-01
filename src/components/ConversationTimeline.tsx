import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, FileText, Image, Video, Download } from 'lucide-react'
import { useJarvisStore, Conversation } from '../store/jarvisStore'

interface ConversationTimelineProps {
  searchResults?: Conversation[]
}

export function ConversationTimeline({ searchResults }: ConversationTimelineProps) {
  const { t } = useTranslation()
  const { conversations, updateConversationRating } = useJarvisStore()

  const displayConversations = searchResults && searchResults.length > 0 ? searchResults : conversations

  const getInputTypeIcon = (type: string, fileType?: string) => {
    if (type === 'voice') return '🎤'
    if (type === 'file') {
      if (fileType === 'pdf') return <FileText size={16} />
      if (fileType === 'image') return <Image size={16} />
      if (fileType === 'video') return <Video size={16} />
    }
    return '✏️'
  }

  const exportConversationsAsJSON = () => {
    const dataStr = JSON.stringify(displayConversations, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conversations-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportConversationsAsMarkdown = () => {
    let markdown = '# Master Jarvis Conversations Export\n\n'
    markdown += `Exported on: ${new Date().toLocaleString()}\n\n`

    displayConversations.forEach((conv, index) => {
      markdown += `## Conversation ${index + 1}\n\n`
      markdown += `**Date:** ${new Date(conv.timestamp).toLocaleString()}\n\n`
      markdown += `**Language:** ${conv.language.toUpperCase()}\n\n`
      markdown += `**Input Type:** ${conv.userInputType}\n\n`
      if (conv.fileName) markdown += `**File:** ${conv.fileName}\n\n`

      markdown += `### User Input\n${conv.userInput}\n\n`
      markdown += `### Generated Prompt\n${conv.generatedPrompt}\n\n`
      markdown += `### Response\n${conv.response}\n\n`

      if (conv.tokensUsed) markdown += `**Tokens Used:** ${conv.tokensUsed}\n\n`
      if (conv.rating) markdown += `**Rating:** ${conv.rating}\n\n`

      markdown += '---\n\n'
    })

    const dataBlob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conversations-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (displayConversations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {searchResults && searchResults.length === 0 ? 'No search results found' : t('no_conversations')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('conversation_history')}</h2>
        <div className="flex gap-2">
          <button
            onClick={exportConversationsAsMarkdown}
            title="Export as Markdown"
            className="p-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition"
          >
            <Download size={18} />
          </button>
          <button
            onClick={exportConversationsAsJSON}
            title="Export as JSON"
            className="p-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {displayConversations.map((conv, index) => (
        <div
          key={conv.id}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500 dark:border-blue-400"
        >
          {/* Header */}
          <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getInputTypeIcon(conv.userInputType, conv.fileType)}</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(conv.timestamp).toLocaleString()}
                </p>
                {conv.fileName && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{conv.fileName}</p>}
              </div>
            </div>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full">
              {conv.language === 'de' ? 'Deutsch' : conv.language === 'pt' ? 'Português' : 'English'}
            </span>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* User Input */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">User Input:</h4>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 p-3 rounded">
                {conv.userInput}
              </p>
            </div>

            {/* Generated Prompt */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('generated_prompt')}:</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded max-h-24 overflow-y-auto">
                {conv.generatedPrompt}
              </p>
            </div>

            {/* Response */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('response')}:</h4>
              <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-slate-800 p-3 rounded max-h-48 overflow-y-auto">
                {conv.response}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm">
              {conv.tokensUsed && (
                <span className="text-gray-600 dark:text-gray-400">
                  {t('tokens_used')}: {conv.tokensUsed}
                </span>
              )}
            </div>
          </div>

          {/* Footer - Rating */}
          <div className="bg-gray-50 dark:bg-slate-800 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">#{displayConversations.length - index}</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateConversationRating(String(conv.id), 'up')}
                className={`p-2 rounded transition ${
                  conv.rating === 'up'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-500 hover:text-white'
                }`}
                title={t('helpful')}
              >
                <ThumbsUp size={18} />
              </button>
              <button
                onClick={() => updateConversationRating(String(conv.id), 'down')}
                className={`p-2 rounded transition ${
                  conv.rating === 'down'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white'
                }`}
                title={t('not_helpful')}
              >
                <ThumbsDown size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
