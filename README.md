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

## Tampermonkey demo for Circle Hub

The userscript at
`userscripts/circle-hub-event-name-voice.user.js` injects a **Mic/Stop** control
beside the existing **Event name** input on Circle Hub. It is restricted to
`https://circle-hub-xi.vercel.app/hub/*` and makes no network requests of its
own.

To install it for the demo:

1. Install Tampermonkey in Chrome or Edge.
2. Open the Tampermonkey dashboard and select **Create a new script**.
3. Replace the generated template with the complete contents of the userscript.
4. Save the script and confirm that it is enabled.
5. Open Circle Hub, navigate to the event form, and allow microphone access.
6. Press **Mic**, speak the event name, and press **Stop**.

The browser's speech-recognition service may process audio outside the page.
Do not use confidential information during the demo.

If recognition reports `not-allowed` even after site and operating-system
microphone permissions are enabled, confirm the installed userscript includes
`// @sandbox raw`, save it again, and reload Circle Hub. This requests execution
in the website's main JavaScript context rather than an isolated extension
context.
