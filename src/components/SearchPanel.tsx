import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'
import { Conversation } from '../store/jarvisStore'

interface SearchPanelProps {
  onResultsChange: (results: Conversation[]) => void
}

export function SearchPanel({ onResultsChange }: SearchPanelProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { language } = useJarvisStore()
  const { searchConversations } = useJarvisStore()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      onResultsChange([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchConversations(query)
      onResultsChange(results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    onResultsChange([])
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Search size={20} className="text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search conversations..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {isSearching && <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>}

      {searchQuery && !isSearching && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Language filter: <span className="font-medium">{language.toUpperCase()}</span>
        </p>
      )}
    </div>
  )
}
