import { useEffect, useRef, useState } from 'react'
import './App.css'

const joinTranscript = (current: string, next: string) =>
  [current.trim(), next.trim()].filter(Boolean).join(' ')

function App() {
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState('Checking browser support…')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setStatus('Speech recognition is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setStatus('Listening…')
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const spokenText = event.results[index][0].transcript

        if (event.results[index].isFinal) {
          finalTranscriptRef.current = joinTranscript(
            finalTranscriptRef.current,
            spokenText,
          )
        } else {
          interimTranscript = joinTranscript(interimTranscript, spokenText)
        }
      }

      setTranscript(joinTranscript(finalTranscriptRef.current, interimTranscript))
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setStatus(`Speech recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      setIsListening(false)
      setTranscript(finalTranscriptRef.current)
      setStatus('Stopped. Press Mic to continue testing.')
    }

    recognitionRef.current = recognition
    setIsSupported(true)
    setStatus('Speech recognition is supported. Press Mic to begin.')

    return () => {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
      recognitionRef.current = null
    }
  }, [])

  const toggleListening = () => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      return
    }

    try {
      recognition.start()
    } catch {
      setStatus('Speech recognition could not start. Please try again.')
    }
  }

  return (
    <main className="page-shell">
      <section className="voice-card" aria-labelledby="page-title">
        <h1 id="page-title">Browser Voice-to-Text Test</h1>
        <p id="speech-status" className="status-message" role="status">
          {status}
        </p>

        <label htmlFor="transcript">Speech transcript</label>
        <textarea
          id="transcript"
          value={transcript}
          readOnly
          rows={8}
          placeholder="Your spoken words will appear here…"
          aria-describedby="speech-status"
        />

        <button
          type="button"
          className={isListening ? 'active' : ''}
          onClick={toggleListening}
          disabled={!isSupported}
          aria-pressed={isListening}
        >
          {isListening ? 'Stop' : 'Mic'}
        </button>
      </section>
    </main>
  )
}

export default App
