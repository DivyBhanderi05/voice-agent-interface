// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const userscript = readFileSync(
  resolve('userscripts/circle-event-voice-input.user.js'),
  'utf8',
)

describe('Circle Create Event voice userscript', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  it('runs on the Circle create-event page in the website main world', () => {
    expect(userscript).toContain('// @match        https://circle.ooo/create-event*')
    expect(userscript).toContain('// @sandbox      raw')
    expect(userscript).toContain('// @grant        none')
  })

  it('injects separate microphone controls for title and description', () => {
    document.body.innerHTML = `
      <label>Event Title *</label>
      <input placeholder="Enter your event title" />
      <label>Description *</label>
      <textarea placeholder="Tell attendees about your event"></textarea>
    `
    window.SpeechRecognition = class MockSpeechRecognition {}

    window.eval(userscript)

    const controls = document.querySelectorAll('.circle-event-voice-control')
    expect(controls).toHaveLength(2)
    expect(controls[0].dataset.voiceField).toBe('title')
    expect(controls[1].dataset.voiceField).toBe('description')
  })

  it('writes recognized speech to the selected field and emits an input event', () => {
    document.body.innerHTML = `
      <input placeholder="Enter your event title" />
      <textarea placeholder="Tell attendees about your event"></textarea>
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
    const description = document.querySelector('textarea')
    const inputListener = vi.fn()
    description.addEventListener('input', inputListener)

    window.eval(userscript)

    const button = document.querySelector(
      '[data-voice-field="description"] button',
    )
    button.click()
    expect(button.textContent).toBe('Stop')

    recognition.onresult({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'A community networking event' } }],
    })

    expect(description.value).toBe('A community networking event')
    expect(inputListener).toHaveBeenCalled()
  })
})
