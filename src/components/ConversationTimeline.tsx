import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, FileText, Image, Video } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

export function ConversationTimeline() {
  const { t } = useTranslation()
  const { conversations, updateConversationRating } = useJarvisStore()

  const getInputTypeIcon = (type: string, fileType?: string) => {
    if (type === 'voice') return '🎤'
    if (type === 'file') {
      if (fileType === 'pdf') return <FileText size={16} />
      if (fileType === 'image') return <Image size={16} />
      if (fileType === 'video') return <Video size={16} />
    }
    return '✏️'
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t('no_conversations')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('conversation_history')}</h2>

      {conversations.map((conv, index) => (
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
              {conv.language === 'de' ? 'Deutsch' : 'English'}
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
              <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-slate-800 p-3 rounded">
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
            <span className="text-sm text-gray-600 dark:text-gray-400">#{conversations.length - index}</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateConversationRating(conv.id, 'up')}
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
                onClick={() => updateConversationRating(conv.id, 'down')}
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
