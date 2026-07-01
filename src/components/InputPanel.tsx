import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Send, Trash2, Upload, FileText, Type, Edit2, CheckCircle } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'
import { createVoiceService } from '../services/voiceService'
import { processFile, ProcessedFile } from '../services/fileProcessor'
import { generateOptimizedPrompt, processUserTaskStreaming } from '../services/geminiApi'
import { saveConversation } from '../services/database'

const voiceService = createVoiceService()

export function InputPanel() {
  const { t } = useTranslation()
  const [textInput, setTextInput] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [showPromptReview, setShowPromptReview] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
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

    try {
      const processed = await processFile(file)
      setUploadedFiles([...uploadedFiles, processed])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unsupported_format'))
    }
  }

  const handleGeneratePrompt = async () => {
    if (!apiKey) {
      setError(t('error_api'))
      return
    }

    const input = textInput.trim() || currentTranscript.trim()
    if (!input) {
      setError('Please provide input')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const files = uploadedFiles
        .filter((f) => f.type === 'image' || f.type === 'pdf')
        .map((f) => ({
          data: f.content,
          mimeType: f.mimeType,
          name: f.name,
        }))

      const promptResponse = await generateOptimizedPrompt(
        apiKey,
        input,
        'General assistant context',
        language,
        files.length > 0 ? files : undefined,
      )

      setGeneratedPrompt(promptResponse.text)
      setShowPromptReview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_processing'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmitWithPrompt = async () => {
    if (!apiKey) {
      setError(t('error_api'))
      return
    }

    setIsProcessing(true)
    setError('')
    setStreamingResponse('')

    try {
      const files = uploadedFiles
        .filter((f) => f.type === 'image' || f.type === 'pdf')
        .map((f) => ({
          data: f.content,
          mimeType: f.mimeType,
          name: f.name,
        }))

      const responseData = await processUserTaskStreaming(
        apiKey,
        generatedPrompt,
        language,
        (chunk) => {
          setStreamingResponse((prev) => prev + chunk)
        },
        files.length > 0 ? files : undefined,
      )

      const input = textInput.trim() || currentTranscript.trim()
      const conversationId = Date.now().toString()

      const conversation = {
        id: conversationId,
        timestamp: Date.now(),
        userInput: input,
        userInputType: uploadedFiles.length > 0 ? 'file' : isListening ? 'voice' : 'text',
        fileType: uploadedFiles[0]?.type as any,
        fileName: uploadedFiles[0]?.name,
        generatedPrompt: generatedPrompt,
        response: streamingResponse || responseData.text,
        language,
        tokensUsed: responseData.tokensUsed,
      }

      addConversation(conversation)
      await saveConversation(conversation)

      if (useJarvisStore.getState().voiceEnabled) {
        voiceService.speak(
          streamingResponse || responseData.text,
          language,
          useJarvisStore.getState().voiceSpeed,
        )
      }

      setTextInput('')
      setCurrentTranscript('')
      setUploadedFiles([])
      setGeneratedPrompt('')
      setShowPromptReview(false)
      setStreamingResponse('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_processing'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setTextInput('')
    setCurrentTranscript('')
    setUploadedFiles([])
    setGeneratedPrompt('')
    setShowPromptReview(false)
    setStreamingResponse('')
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
            disabled={isProcessing || showPromptReview}
          />
        </div>

        {/* Voice Input Button */}
        <button
          onClick={handleVoiceInput}
          disabled={isProcessing || !voiceService.isAvailable() || showPromptReview}
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
              disabled={showPromptReview}
            />
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 justify-center">
                    <FileText size={20} className="text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('or_drag_drop')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Prompt Review Section */}
        {showPromptReview && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Edit2 size={18} className="text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">{t('generated_prompt')}</h4>
            </div>
            <textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
              rows={4}
            />
            {streamingResponse && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                <p className="text-sm text-green-900 dark:text-green-100">{streamingResponse}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!showPromptReview ? (
            <>
              <button
                onClick={handleGeneratePrompt}
                disabled={isProcessing || (!textInput && !currentTranscript)}
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                <Edit2 size={20} />
                Generate Prompt
              </button>
              <button
                onClick={handleClear}
                disabled={isProcessing}
                className="py-3 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center transition"
              >
                <Trash2 size={20} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSubmitWithPrompt}
                disabled={isProcessing}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                <CheckCircle size={20} />
                {isProcessing ? t('processing') : t('submit')}
              </button>
              <button
                onClick={() => {
                  setShowPromptReview(false)
                  setGeneratedPrompt('')
                  setStreamingResponse('')
                }}
                disabled={isProcessing}
                className="py-3 px-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
