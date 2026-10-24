// ==UserScript==
// @name         Circle Create Event Voice Input
// @namespace    https://circle.ooo/
// @version      0.2.0
// @description  Adds browser voice-to-text controls to the Circle Event Title and Description fields.
// @match        https://circle.ooo/create-event*
// @sandbox      raw
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict'

  const CONTROL_CLASS = 'circle-event-voice-control'
  const STYLE_ID = 'circle-event-voice-style'
  const MOUNTED_ATTRIBUTE = 'data-circle-voice-mounted'
  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition

  const fields = [
    {
      key: 'title',
      label: 'Event Title',
      selectors: [
        'input[placeholder="Enter your event title" i]',
        'input[name="eventTitle"]',
        'input[name="event_title"]',
        'input[name="title"]',
      ],
    },
    {
      key: 'description',
      label: 'Description',
      selectors: [
        'textarea[placeholder="Tell attendees about your event" i]',
        'textarea[name="description"]',
        '[contenteditable="true"][aria-label="Description" i]',
      ],
    },
  ]

  let activeSession = null

  function normalizeText(value) {
    return value.replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  }

  function findField(config) {
    for (const selector of config.selectors) {
      const field = document.querySelector(selector)
      if (field) return field
    }

    const label = Array.from(document.querySelectorAll('label')).find(
      (element) => normalizeText(element.textContent || '') === config.label.toLowerCase(),
    )

    if (!label) return null

    if (label.htmlFor) {
      const labelledField = document.getElementById(label.htmlFor)
      if (labelledField) return labelledField
    }

    const nestedField = label.querySelector('input, textarea, [contenteditable="true"]')
    if (nestedField) return nestedField

    const container = label.parentElement
    return container?.querySelector('input, textarea, [contenteditable="true"]') || null
  }

  function joinTranscript(current, next) {
    return [current.trim(), next.trim()].filter(Boolean).join(' ')
  }

  function getFieldValue(field) {
    return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
      ? field.value
      : field.textContent || ''
  }

  function updateField(field, value) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      const prototype = field instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

      if (valueSetter) valueSetter.call(field, value)
      else field.value = value
    } else {
      field.textContent = value
    }

    field.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: value,
      }),
    )
    field.dispatchEvent(new Event('change', { bubbles: true }))
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return

    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      .${CONTROL_CLASS} {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-top: 0.55rem;
        font: inherit;
      }

      .${CONTROL_CLASS} button {
        min-height: 2.4rem;
        padding: 0.5rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 0.65rem;
        color: #ffffff;
        background: linear-gradient(90deg, #4c2bd9, #9b2cff);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .${CONTROL_CLASS} button[data-listening="true"] {
        background: #b42318;
      }

      .${CONTROL_CLASS} button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .${CONTROL_CLASS} [role="status"] {
        color: inherit;
        font-size: 0.9rem;
        opacity: 0.9;
      }
    `
    document.head.appendChild(style)
  }

  function stopListening() {
    activeSession?.recognition.stop()
  }

  function startListening(field, config, button, status) {
    if (!SpeechRecognitionAPI || activeSession) return

    const session = {
      recognition: new SpeechRecognitionAPI(),
      field,
      config,
      button,
      status,
      initialValue: getFieldValue(field).trim(),
      finalTranscript: '',
      error: false,
    }
    activeSession = session

    session.recognition.continuous = true
    session.recognition.interimResults = true
    session.recognition.lang = navigator.language || 'en-US'

    session.recognition.onstart = () => {
      button.textContent = 'Stop'
      button.dataset.listening = 'true'
      status.textContent = `Listening for ${config.label.toLowerCase()}…`
    }

    session.recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const segment = event.results[index][0].transcript
        if (event.results[index].isFinal) {
          session.finalTranscript = joinTranscript(session.finalTranscript, segment)
        } else {
          interimTranscript = joinTranscript(interimTranscript, segment)
        }
      }

      updateField(
        field,
        joinTranscript(
          joinTranscript(session.initialValue, session.finalTranscript),
          interimTranscript,
        ),
      )
    }

    session.recognition.onerror = (event) => {
      session.error = true
      status.textContent = `Speech recognition error: ${event.error}`
    }

    session.recognition.onend = () => {
      button.textContent = 'Mic'
      button.dataset.listening = 'false'
      updateField(field, joinTranscript(session.initialValue, session.finalTranscript))

      if (!session.error) {
        status.textContent = session.finalTranscript
          ? `Transcript added to ${config.label}.`
          : 'Listening stopped.'
      }

      if (activeSession === session) activeSession = null
    }

    try {
      session.recognition.start()
    } catch {
      activeSession = null
      status.textContent = 'Speech recognition could not start.'
    }
  }

  function mountVoiceControl(config) {
    const field = findField(config)
    if (!field || field.hasAttribute(MOUNTED_ATTRIBUTE)) return

    field.setAttribute(MOUNTED_ATTRIBUTE, config.key)
    addStyles()

    const control = document.createElement('div')
    control.className = CONTROL_CLASS
    control.dataset.voiceField = config.key

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Mic'
    button.dataset.listening = 'false'
    button.disabled = !SpeechRecognitionAPI
    button.setAttribute('aria-label', `Use microphone for ${config.label}`)

    const status = document.createElement('span')
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.textContent = SpeechRecognitionAPI
      ? `Voice input ready for ${config.label}.`
      : 'Speech recognition is unavailable in this browser.'

    button.addEventListener('click', () => {
      if (activeSession) stopListening()
      else startListening(field, config, button, status)
    })

    control.append(button, status)
    field.insertAdjacentElement('afterend', control)
  }

  function mountAllControls() {
    fields.forEach(mountVoiceControl)
  }

  mountAllControls()

  const observer = new MutationObserver(mountAllControls)
  observer.observe(document.body, { childList: true, subtree: true })
})()
