// ==UserScript==
// @name         Circle Hub Event Name Voice Input
// @namespace    https://circle-hub-xi.vercel.app/
// @version      0.1.0
// @description  Adds browser voice-to-text controls to the Circle Hub Event name field.
// @match        https://circle-hub-xi.vercel.app/hub/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict'

  const CONTROL_ID = 'circle-hub-event-name-voice-control'
  const STYLE_ID = 'circle-hub-event-name-voice-style'
  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition

  let mountedInput = null
  let recognition = null
  let isListening = false
  let initialValue = ''
  let finalTranscript = ''

  function normalizeText(value) {
    return value.replace(/\s+/g, ' ').trim().toLowerCase()
  }

  function findEventNameInput() {
    const directSelectors = [
      'input[name="eventName"]',
      'input[name="event_name"]',
      'input[id="event-name"]',
      'input[id="eventName"]',
      'input[aria-label="Event name" i]',
    ]

    for (const selector of directSelectors) {
      const input = document.querySelector(selector)
      if (input) return input
    }

    const label = Array.from(document.querySelectorAll('label')).find(
      (element) => normalizeText(element.textContent || '') === 'event name',
    )

    if (label) {
      if (label.htmlFor) {
        const labelledInput = document.getElementById(label.htmlFor)
        if (labelledInput instanceof HTMLInputElement) return labelledInput
      }

      const nestedInput = label.querySelector('input')
      if (nestedInput) return nestedInput

      const nearbyInput = label.parentElement?.querySelector('input')
      if (nearbyInput) return nearbyInput
    }

    const exactTextElement = document.evaluate(
      "//*[normalize-space(text())='Event name']",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue

    if (exactTextElement instanceof Element) {
      const followingInput = document.evaluate(
        'following::input[1]',
        exactTextElement,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue

      if (followingInput instanceof HTMLInputElement) return followingInput
    }

    return null
  }

  function joinTranscript(current, next) {
    return [current.trim(), next.trim()].filter(Boolean).join(' ')
  }

  function updateInput(input, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set

    if (valueSetter) {
      valueSetter.call(input, value)
    } else {
      input.value = value
    }

    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: value,
      }),
    )
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return

    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #${CONTROL_ID} {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-top: 0.65rem;
        font: inherit;
      }

      #${CONTROL_ID} button {
        min-height: 2.5rem;
        padding: 0.55rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 0.65rem;
        color: #ffffff;
        background: #087f8c;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      #${CONTROL_ID} button[data-listening="true"] {
        background: #b42318;
      }

      #${CONTROL_ID} button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      #${CONTROL_ID} [role="status"] {
        color: inherit;
        font-size: 0.9rem;
        opacity: 0.82;
      }
    `
    document.head.appendChild(style)
  }

  function stopListening() {
    if (!recognition || !isListening) return
    recognition.stop()
  }

  function startListening(input, button, status) {
    if (!SpeechRecognitionAPI) return

    initialValue = input.value.trim()
    finalTranscript = ''
    recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onstart = () => {
      isListening = true
      button.textContent = 'Stop'
      button.dataset.listening = 'true'
      status.textContent = 'Listening…'
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const segment = event.results[index][0].transcript

        if (event.results[index].isFinal) {
          finalTranscript = joinTranscript(finalTranscript, segment)
        } else {
          interimTranscript = joinTranscript(interimTranscript, segment)
        }
      }

      updateInput(
        input,
        joinTranscript(
          joinTranscript(initialValue, finalTranscript),
          interimTranscript,
        ),
      )
    }

    recognition.onerror = (event) => {
      status.textContent = `Speech recognition error: ${event.error}`
    }

    recognition.onend = () => {
      isListening = false
      button.textContent = 'Mic'
      button.dataset.listening = 'false'
      updateInput(input, joinTranscript(initialValue, finalTranscript))

      if (!status.textContent.startsWith('Speech recognition error:')) {
        status.textContent = finalTranscript
          ? 'Transcript added to Event name.'
          : 'Listening stopped.'
      }

      recognition = null
    }

    try {
      recognition.start()
    } catch {
      recognition = null
      status.textContent = 'Speech recognition could not start.'
    }
  }

  function mountVoiceControl() {
    const input = findEventNameInput()
    if (!input || input === mountedInput) return

    stopListening()
    document.getElementById(CONTROL_ID)?.remove()
    mountedInput = input
    addStyles()

    const control = document.createElement('div')
    control.id = CONTROL_ID

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Mic'
    button.dataset.listening = 'false'
    button.disabled = !SpeechRecognitionAPI

    const status = document.createElement('span')
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.textContent = SpeechRecognitionAPI
      ? 'Voice input ready.'
      : 'Speech recognition is unavailable in this browser.'

    button.addEventListener('click', () => {
      if (isListening) {
        stopListening()
      } else {
        startListening(input, button, status)
      }
    })

    control.append(button, status)
    input.insertAdjacentElement('afterend', control)
  }

  mountVoiceControl()

  const observer = new MutationObserver(() => {
    if (!mountedInput?.isConnected || !document.getElementById(CONTROL_ID)) {
      mountedInput = null
      mountVoiceControl()
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
})()
