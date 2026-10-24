# Browser Voice-to-Text Test

A small React page for testing whether a browser supports its built-in Web
Speech Recognition API. It contains only a microphone control, support status,
and a read-only text box that displays recognized speech.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, press **Mic**, allow microphone access, and speak.
Press **Stop** to end the test.

Speech recognition is detected through `SpeechRecognition` or
`webkitSpeechRecognition`. Chrome, Edge, and Safari are the main browsers to
test. Recognition availability can vary by browser version, operating system,
language, permissions, network, and secure-context rules.

## Verify

```bash
npm test
npm run build
```

This branch does not send transcripts to Gemini or any application backend.

## Tampermonkey demo for Circle Create Event

The userscript at
`userscripts/circle-event-voice-input.user.js` injects separate **Mic/Stop**
controls beside the existing **Event Title** and **Description** fields. It is
restricted to `https://circle.ooo/create-event*` and makes no network requests
of its own.

To install it for the demo:

1. Install Tampermonkey in Chrome or Edge.
2. Open the Tampermonkey dashboard and select **Create a new script**.
3. Replace the generated template with the complete contents of the userscript.
4. Save the script and confirm that it is enabled.
5. Open `https://circle.ooo/create-event`, and allow microphone access.
6. Press the **Mic** below Event Title or Description, speak, and press **Stop**.

The browser's speech-recognition service may process audio outside the page.
Do not use confidential information during the demo.

If recognition reports `not-allowed` even after site and operating-system
microphone permissions are enabled, confirm the installed userscript includes
`// @sandbox raw`, save it again, and reload the page. This requests execution
in the website's main JavaScript context rather than an isolated extension
context.
