import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Trash2 } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

export function SettingsPanel() {
  const { t } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')

  const {
    language,
    isDarkMode,
    voiceEnabled,
    voiceSpeed,
    apiKey,
    clearConversations,
    setLanguage,
    setDarkMode,
    setVoiceEnabled,
    setVoiceSpeed,
    setApiKey,
  } = useJarvisStore()

  const handleSaveSettings = () => {
    if (tempApiKey) {
      setApiKey(tempApiKey)
      setTempApiKey('')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full px-6 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 font-medium flex items-center gap-2 transition"
      >
        <Settings size={20} />
        {t('settings')}
      </button>

      {showSettings && (
        <div className="px-6 py-4 space-y-5 border-t border-gray-200 dark:border-slate-700">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('language')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 rounded font-medium transition ${
                  language === 'en'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white'
                }`}
              >
                {t('english')}
              </button>
              <button
                onClick={() => setLanguage('de')}
                className={`flex-1 py-2 rounded font-medium transition ${
                  language === 'de'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white'
                }`}
              >
                {t('german')}
              </button>
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dark_mode')}</label>
            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className={`relative w-12 h-6 rounded-full transition ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}
              />
            </button>
          </div>

          {/* Voice Output */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('voice_enabled')}</label>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`relative w-12 h-6 rounded-full transition ${voiceEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${voiceEnabled ? 'right-0.5' : 'left-0.5'}`}
              />
            </button>
          </div>

          {/* Voice Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('voice_speed')}: {voiceSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('api_key')}</label>
            <input
              type="password"
              value={tempApiKey || apiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder={t('api_key_placeholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {apiKey && !tempApiKey && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {t('success')}</p>
            )}
          </div>

          {/* Save Settings */}
          <button
            onClick={handleSaveSettings}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
          >
            {t('save_settings')}
          </button>

          {/* Clear History */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all conversations?')) {
                clearConversations()
              }
            }}
            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
          >
            <Trash2 size={18} />
            {t('clear_history')}
          </button>
        </div>
      )}
    </div>
  )
}
