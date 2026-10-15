import { FormEvent, useEffect, useRef, useState } from 'react'
import { processUserRequest } from './processUserRequest'
import './App.css'

const joinTranscript = (current: string, next: string) =>
  [current.trim(), next.trim()].filter(Boolean).join(' ')

const errorMessages: Record<string, string> = {
  'not-allowed':
    'Microphone permission was denied. Allow microphone access or type your request below.',
  'service-not-allowed':
    'Speech recognition is blocked in this browser. You can still type your request below.',
  'no-speech': 'No speech was detected. Try again or type your request below.',
  'audio-capture':
    'No microphone was found. Check your microphone or type your request below.',
  network: 'Speech recognition could not reach its service. Check your connection and try again.',
  aborted: 'Listening stopped.',
}

function App() {
  const [input, setInput] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [status, setStatus] = useState('Checking speech recognition support…')
  const [isListening, setIsListening] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState('')
  const [submissionMessage, setSubmissionMessage] = useState('')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const inputBeforeListeningRef = useRef('')
  const finalTranscriptRef = useRef('')
  const lastSubmittedRef = useRef('')
  const manuallyStoppedRef = useRef(false)
  const recognitionErrorRef = useRef(false)
  const shouldKeepListeningRef = useRef(false)
  const restartTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setStatus(
        'Speech recognition is unavailable in this browser. You can still type and send your request.',
      )
      return
    }

    const recognition = new SpeechRecognitionAPI()
    // Keep the browser listening across phrases. Some browsers still end a
    // session after silence, so onend restarts it until the user presses Stop.
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setStatus('Listening… Your words will appear in the text box.')
    }

    // Accumulate final words, and also put interim words directly in the text
    // box so the user sees the transcript while speaking. Recognition never
    // submits anything; only the Send button calls handleSubmit.
    recognition.onresult = (event) => {
      let interim = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const segment = event.results[index][0].transcript

        if (event.results[index].isFinal) {
          finalTranscriptRef.current = joinTranscript(
            finalTranscriptRef.current,
            segment,
          )
        } else {
          interim = joinTranscript(interim, segment)
        }
      }

      setInterimTranscript(interim)
      setInput(
        joinTranscript(
          joinTranscript(inputBeforeListeningRef.current, finalTranscriptRef.current),
          interim,
        ),
      )
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' && shouldKeepListeningRef.current) {
        recognitionErrorRef.current = false
        setStatus('Listening… Your words will appear in the text box.')
        return
      }

      recognitionErrorRef.current = true
      shouldKeepListeningRef.current = false
      setIsListening(false)
      setInterimTranscript('')
      setStatus(
        errorMessages[event.error] ??
          `Speech recognition error: ${event.message || event.error}. Please try again or type your request.`,
      )
    }

    recognition.onend = () => {
      setInterimTranscript('')

      // Chrome, Edge, and Safari may end recognition after silence even in
      // continuous mode. Restart it so one Mic click lasts until one Stop click.
      if (shouldKeepListeningRef.current && !recognitionErrorRef.current) {
        setStatus('Listening… Your words will appear in the text box.')
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null
          if (!shouldKeepListeningRef.current) return

          try {
            recognition.start()
          } catch {
            shouldKeepListeningRef.current = false
            setIsListening(false)
            setStatus('Listening stopped unexpectedly. Press Mic to continue.')
          }
        }, 150)
        return
      }

      setIsListening(false)
      const completedTranscript = finalTranscriptRef.current.trim()
      if (completedTranscript) {
        setInput(joinTranscript(inputBeforeListeningRef.current, completedTranscript))
      }

      if (!recognitionErrorRef.current) {
        setStatus(
          completedTranscript
            ? 'Transcript ready. Review it or press Send.'
            : manuallyStoppedRef.current
              ? 'Listening stopped. Type a request or try the microphone again.'
              : 'Listening ended without a transcript. Try again or type your request.',
        )
      }
    }

    recognitionRef.current = recognition
    setStatus('Ready to type or speak.')

    return () => {
      shouldKeepListeningRef.current = false
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current)
      }
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
      manuallyStoppedRef.current = true
      shouldKeepListeningRef.current = false
      setStatus('Stopping…')

      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current)
        restartTimerRef.current = null
        setIsListening(false)
        setStatus('Listening stopped. Review your transcript, then press Send.')
        return
      }

      recognition.stop()
      return
    }

    finalTranscriptRef.current = ''
    inputBeforeListeningRef.current = input.trim()
    manuallyStoppedRef.current = false
    recognitionErrorRef.current = false
    shouldKeepListeningRef.current = true
    setInterimTranscript('')
    setSubmissionMessage('')

    try {
      recognition.start()
    } catch {
      shouldKeepListeningRef.current = false
      setStatus('Speech recognition could not start. Wait a moment and try again.')
    }
  }

  const handleSubmit = async (text: string) => {
    const completeText = text.trim()

    if (!completeText) {
      setSubmissionMessage('Enter or record a request before sending.')
      return
    }

    if (completeText === lastSubmittedRef.current) {
      setSubmissionMessage('That request was already sent. Edit it before sending again.')
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmissionMessage('')

    try {
      const agentResponse = await processUserRequest(completeText)
      lastSubmittedRef.current = completeText
      setResponse(agentResponse)
      setSubmissionMessage('Request sent.')
    } catch {
      setSubmissionMessage('The request could not be processed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isListening) {
      manuallyStoppedRef.current = true
      shouldKeepListeningRef.current = false
      recognitionRef.current?.stop()
    }

    void handleSubmit(input)
  }

  const speechSupported = recognitionRef.current !== null

  return (
    <main className="page-shell">
      <section className="agent-card" aria-labelledby="page-title">
        <h1 id="page-title">Voice Agent</h1>

        <form onSubmit={onSubmit}>
          <label htmlFor="request">Your request</label>
          <textarea
            id="request"
            name="request"
            rows={6}
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setSubmissionMessage('')
            }}
            placeholder="What would you like help with?"
            aria-describedby="speech-status interim-text submission-message"
          />

          <div className="speech-panel">
            <p id="speech-status" className="status-message" role="status" aria-live="polite">
              <span className={`status-dot${isListening ? ' listening' : ''}`} aria-hidden="true" />
              {status}
            </p>
            <span id="interim-text" className="visually-hidden" aria-live="polite">
              {interimTranscript ? `Hearing: ${interimTranscript}` : ''}
            </span>
          </div>

          <div className="actions">
            <button
              type="button"
              className={`microphone-button${isListening ? ' active' : ''}`}
              onClick={toggleListening}
              disabled={!speechSupported}
              aria-label={isListening ? 'Stop microphone recording' : 'Start microphone recording'}
              aria-pressed={isListening}
            >
              <span aria-hidden="true">{isListening ? '■' : '●'}</span>
              {isListening ? 'Stop' : 'Mic'}
            </button>
            <button type="submit" className="send-button" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send'}
            </button>
          </div>

          <p
            id="submission-message"
            className="submission-message"
            role="status"
            aria-live="polite"
          >
            {submissionMessage}
          </p>
        </form>

        <section className="response-panel" aria-label="Agent response">
          <p className={response ? '' : 'placeholder-response'}>
            {response || 'Your agent response will appear here.'}
          </p>
        </section>
      </section>
    </main>
  )
}

export default App
