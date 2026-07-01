import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from './components/Header'
import { InputPanel } from './components/InputPanel'
import { ConversationTimeline } from './components/ConversationTimeline'
import { SettingsPanel } from './components/SettingsPanel'
import { SearchPanel } from './components/SearchPanel'
import { useJarvisStore, Conversation } from './store/jarvisStore'

export default function App() {
  const { i18n } = useTranslation()
  const { language, isDarkMode, loadConversations } = useJarvisStore()
  const [searchResults, setSearchResults] = useState<Conversation[]>([])

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-white dark:bg-slate-950 transition-colors`}>
      <div className="max-w-6xl mx-auto">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <div className="lg:col-span-2 space-y-4">
            <SearchPanel onResultsChange={setSearchResults} />
            <ConversationTimeline searchResults={searchResults} />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <InputPanel />
            <SettingsPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
