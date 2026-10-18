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
