# voice-agent-interface

Voice and text input interface for the capstone AI agent

## Current milestone

This first working version provides a simple, responsive React interface for
typed and browser-transcribed requests. Speech appears directly in the text box
while the user is speaking. One Mic click keeps listening across pauses until
the user presses Stop, and the transcript remains available to review and edit.
It is only submitted when the user presses Send. The agent response is
currently a local mock; no AI service, API key, or backend is connected.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A supported browser (see below)

## Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

To create and preview a production build:

```bash
npm run build
npm run preview
```

## Browser support

The text interface works in modern browsers. Built-in speech recognition is
targeted at:

- Google Chrome
- Microsoft Edge
- Safari

Microphone access requires the user's permission and a secure context
(`https://` or `localhost`). Firefox does not currently offer dependable
built-in Web Speech recognition, so the microphone control is disabled there
and a clear fallback message is shown. Typed requests remain fully usable.

## Current limitations

- `processUserRequest` returns a mock response and does not call an AI service.
- Speech recognition support and accuracy depend on the browser, operating
  system, language, network connection, and browser speech service.
- The browser may stop listening automatically after silence or due to a
  service limit.
- Conversations are not persisted, and there is no authentication or backend.
