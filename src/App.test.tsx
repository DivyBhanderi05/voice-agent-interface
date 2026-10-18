// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = ''
  onstart: (() => void) | null = null
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn(() => this.onstart?.())
  stop = vi.fn(() => this.onend?.())
  abort = vi.fn()
}

describe('browser voice-to-text test', () => {
  afterEach(() => {
    cleanup()
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  it('disables the microphone when speech recognition is unavailable', async () => {
    render(<App />)

    expect(await screen.findByText(/not supported/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mic' })).toBeDisabled()
  })

  it('starts and stops a supported speech recognizer', async () => {
    const recognition = new MockSpeechRecognition()
    const SpeechRecognitionMock = function () {
      return recognition
    } as unknown as SpeechRecognitionConstructor
    window.SpeechRecognition = SpeechRecognitionMock
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Mic' }))
    expect(recognition.start).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()

    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: true, 0: { transcript: 'hello browser' } },
        },
      } as unknown as SpeechRecognitionEvent)
    })
    expect(screen.getByLabelText('Speech transcript')).toHaveValue('hello browser')

    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(recognition.stop).toHaveBeenCalledOnce()
  })
})
