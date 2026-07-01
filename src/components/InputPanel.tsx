import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Send, Trash2, Upload, FileText, Type } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'
import { createVoiceService } from '../services/voiceService'
import { processFile } from '../services/fileProcessor'
import { generateOptimizedPrompt, processUserTask } from '../services/geminiApi'

const voiceService = createVoiceService()

export function InputPanel() {
  const { t } = useTranslation()
  const [textInput, setTextInput] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragAreaRef = useRef<HTMLDivElement>(null)

  const {
    isListening,
    isProcessing,
    setIsListening,
    setIsProcessing,
    language,
    apiKey,
    addConversation,
  } = useJarvisStore()

  useEffect(() => {
    const dragArea = dragAreaRef.current
    if (!dragArea) return

    const preventDefault = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    dragArea.addEventListener('dragover', preventDefault)
    dragArea.addEventListener('drop', preventDefault)

    dragArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    })

    return () => {
      dragArea.removeEventListener('dragover', preventDefault)
      dragArea.removeEventListener('drop', preventDefault)
    }
  }, [])

  const handleVoiceInput = async () => {
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
      return
    }

    if (!voiceService.isAvailable()) {
      setError(t('error_api'))
      return
    }

    setIsListening(true)
    setCurrentTranscript('')
    setError('')

    voiceService.startListening(
      language,
      (result) => {
        setCurrentTranscript(result.text)
        if (result.isFinal) {
          setTextInput(result.text)
        }
      },
      () => {
        setIsListening(false)
      },
    )
  }

  const handleFileSelect = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setError(t('file_too_large'))
      return
    }

    setUploadedFile(file)
    setError('')
  }

  const handleSubmit = async () => {
    if (!apiKey) {
      setError(t('error_api'))
      return
    }

    const input = textInput.trim() || currentTranscript.trim()
    if (!input && !uploadedFile) {
      setError('Please provide input')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      let finalInput = input

      if (uploadedFile) {
        const processed = await processFile(uploadedFile)
        finalInput = `File: ${processed.name}\n\n${processed.content}\n\nUser input: ${input}`
      }

      const promptResponse = await generateOptimizedPrompt(
        apiKey,
        finalInput,
        'General assistant context',
        language,
      )

      const responseData = await processUserTask(apiKey, promptResponse.text, language)

      const conversationId = Date.now().toString()
      addConversation({
        id: conversationId,
        timestamp: Date.now(),
        userInput: input,
        userInputType: uploadedFile ? 'file' : isListening ? 'voice' : 'text',
        fileType: uploadedFile
          ? (uploadedFile.type.startsWith('image/')
              ? 'image'
              : uploadedFile.type.startsWith('video/')
                ? 'video'
                : uploadedFile.type === 'application/pdf'
                  ? 'pdf'
                  : 'image')
          : undefined,
        fileName: uploadedFile?.name,
        generatedPrompt: promptResponse.text,
        response: responseData.text,
        language,
        tokensUsed: responseData.tokensUsed,
      })

      if (useJarvisStore.getState().voiceEnabled) {
        voiceService.speak(responseData.text, language, useJarvisStore.getState().voiceSpeed)
      }

      setTextInput('')
      setCurrentTranscript('')
      setUploadedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_processing'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setTextInput('')
    setCurrentTranscript('')
    setUploadedFile(null)
    setError('')
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 space-y-4">
      <div className="space-y-3">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Type size={16} className="inline mr-2" />
            {t('text_input')}
          </label>
          <textarea
            value={textInput || currentTranscript}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t('type_message')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={4}
            disabled={isProcessing}
          />
        </div>

        {/* Voice Input Button */}
        <button
          onClick={handleVoiceInput}
          disabled={isProcessing || !voiceService.isAvailable()}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400'
          }`}
        >
          <Mic size={20} />
          {isListening ? t('stop_listening') : t('click_to_speak')}
        </button>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Upload size={16} className="inline mr-2" />
            {t('file_upload')}
          </label>
          <div
            ref={dragAreaRef}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition bg-gray-50 dark:bg-slate-800"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.webm,.txt,.md"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            {uploadedFile ? (
              <div className="flex items-center gap-2 justify-center">
                <FileText size={20} className="text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{uploadedFile.name}</span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('or_drag_drop')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">{error}</div>}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (!textInput && !currentTranscript && !uploadedFile)}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
          >
            <Send size={20} />
            {isProcessing ? t('processing') : t('submit')}
          </button>
          <button
            onClick={handleClear}
            disabled={isProcessing}
            className="py-3 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center transition"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
