// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const userscript = readFileSync(
  resolve('userscripts/circle-hub-event-name-voice.user.js'),
  'utf8',
)

describe('Circle Hub Event name voice userscript', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  it('requests execution in the website main world', () => {
    expect(userscript).toContain('// @sandbox      raw')
    expect(userscript).toContain('// @grant        none')
  })

  it('injects a microphone control and writes recognized speech to the input', () => {
    document.body.innerHTML = `
      <form>
        <div>
          <label for="event-title">Event name</label>
          <input id="event-title" type="text" />
        </div>
      </form>
    `

    let recognition
    class MockSpeechRecognition {
      constructor() {
        recognition = this
      }

      start = vi.fn(() => this.onstart?.())
      stop = vi.fn(() => this.onend?.())
    }

    window.SpeechRecognition = MockSpeechRecognition
    const input = document.getElementById('event-title')
    const inputListener = vi.fn()
    input.addEventListener('input', inputListener)

    window.eval(userscript)

    const button = document.querySelector(
      '#circle-hub-event-name-voice-control button',
    )
    expect(button).not.toBeNull()
    expect(button.textContent).toBe('Mic')

    button.click()
    expect(button.textContent).toBe('Stop')

    recognition.onresult({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'Desert Founders Mixer' } }],
    })

    expect(input.value).toBe('Desert Founders Mixer')
    expect(inputListener).toHaveBeenCalled()
  })

  it('recognizes the current Circle Hub Event name input signature', () => {
    document.body.innerHTML = `
      <input
        required
        maxlength="80"
        placeholder="Desert Founders Mixer"
        class="mt-1 w-full font-normal field"
        value=""
      />
    `
    window.SpeechRecognition = class MockSpeechRecognition {}

    window.eval(userscript)

    const input = document.querySelector('input')
    expect(input.nextElementSibling?.id).toBe(
      'circle-hub-event-name-voice-control',
    )
  })
})
