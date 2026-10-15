# voice-agent-interface

A React voice-and-text interface backed by a small Node.js server and the Gemini
API. The browser collects a complete typed or spoken request, and Gemini is
called only after the user presses **Send**.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Gemini API key
- Chrome, Edge, or Safari for browser speech recognition (typed input works in
  other modern browsers)

## Local setup

Install dependencies:

```bash
npm install
```

Create a local environment file from the committed template:

```bash
cp .env.example .env
```

Replace `your_key_here` in `.env` with your Gemini API key:

```dotenv
GEMINI_API_KEY=your_actual_key
```

> **Never commit `.env`.** It contains a server credential and is intentionally
> ignored by Git. Do not prefix the key with `VITE_`; Vite-prefixed variables
> are exposed to browser code.

## Start the application

Run the frontend and backend together:

```bash
npm run dev
```

The frontend is normally available at `http://localhost:5173`. The backend
listens on `http://localhost:3001`, and Vite proxies browser requests beginning
with `/api` to it.

To run each process separately:

```bash
npm run dev:server
npm run dev:client
```

The server port can be changed with `PORT`. The server-side Gemini model can be
changed with `GEMINI_MODEL`; when unset, it defaults to `gemini-2.5-flash`.
Neither setting is sent to the browser.

## Request flow

1. The user types or records speech. Interim recognition results stay in the
   browser and update the text box only.
2. The user reviews the complete request and presses **Send**.
3. React sends `{ "text": "complete user request" }` to `POST /api/agent`.
4. The Node.js server validates and trims the text, then reads
   `GEMINI_API_KEY` from its environment and calls Gemini with the configured
   system instruction.
5. The server returns only `{ "reply": "Gemini response" }`. Credentials and
   upstream error details are never included in the response.

## Tests and production build

```bash
npm test
npm run build
```

To preview the built frontend, keep the backend running in another terminal and
run:

```bash
npm run preview
```

## Current limitations

- The assistant can explain event discovery, event creation or updates, and
  sponsor discovery, but no event, sponsor, database, or application tools are
  connected yet.
- Requests are single-turn; conversation history is not persisted.
- There is no user authentication, rate limiting, streaming, or durable storage.
- Speech recognition support and accuracy depend on the browser, operating
  system, language, network, and browser speech service. Typed input remains
  available when recognition is unsupported.
- The server uses a 5,000-character request limit.

## Troubleshooting

- **The server reports that the assistant is unavailable:** confirm `.env`
  exists at the repository root, the key is valid, and restart the backend after
  changing environment variables. Check that the selected `GEMINI_MODEL` is
  available to the key.
- **The browser reports a network error:** confirm both development processes
  are running, port 3001 is free, and Vite printed its local URL.
- **The microphone button is disabled:** use Chrome, Edge, or Safari, grant
  microphone permission, and use `localhost` or HTTPS. You can always type.
- **The microphone stops after silence:** press **Mic** again or type the rest of
  the request. The browser controls recognition session limits.
- **Port 3001 is already in use:** stop the other process or start the backend on
  another `PORT` and update the proxy target in `vite.config.ts` for local
  development.
