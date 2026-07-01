const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition

export interface VoiceRecognitionResult {
  text: string
  confidence: number
  isFinal: boolean
}

export interface VoiceService {
  startListening: (language: string, onResult: (result: VoiceRecognitionResult) => void, onEnd: () => void) => void
  stopListening: () => void
  speak: (text: string, language: string, speed: number) => void
  isAvailable: () => boolean
}

let recognitionInstance: any = null

export function createVoiceService(): VoiceService {
  return {
    startListening: (language, onResult, onEnd) => {
      if (!SpeechRecognition) {
        console.error('Speech Recognition not supported')
        return
      }

      recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.language = language === 'de' ? 'de-DE' : 'en-US'

      recognitionInstance.onstart = () => {
        console.log('Listening started...')
      }

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }

          if (event.results[i].isFinal) {
            onResult({
              text: finalTranscript.trim(),
              confidence,
              isFinal: true,
            })
          }
        }

        if (interimTranscript) {
          onResult({
            text: interimTranscript,
            confidence: 0.5,
            isFinal: false,
          })
        }
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }

      recognitionInstance.onend = () => {
        onEnd()
      }

      recognitionInstance.start()
    },

    stopListening: () => {
      if (recognitionInstance) {
        recognitionInstance.stop()
      }
    },

    speak: (text, language, speed) => {
      if (!('speechSynthesis' in window)) {
        console.error('Speech Synthesis not supported')
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'de' ? 'de-DE' : 'en-US'
      utterance.rate = speed
      utterance.pitch = 1
      utterance.volume = 1

      window.speechSynthesis.speak(utterance)
    },

    isAvailable: () => {
      return !!SpeechRecognition && 'speechSynthesis' in window
    },
  }
}
