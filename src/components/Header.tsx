import { useTranslation } from 'react-i18next'
import { Mic } from 'lucide-react'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Mic size={32} />
          <h1 className="text-4xl font-bold">{t('app_title')}</h1>
        </div>
        <p className="text-blue-100 text-lg">{t('app_subtitle')}</p>
      </div>
    </header>
  )
}
