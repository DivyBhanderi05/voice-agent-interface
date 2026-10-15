import express from 'express'
import { MAX_REQUEST_LENGTH } from './config.js'
import { generateGeminiReply } from './gemini.js'

export function createApp({ generateReply = generateGeminiReply } = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

  app.post('/api/agent', async (request, response) => {
    const { text } = request.body ?? {}

    if (typeof text !== 'string') {
      return response.status(400).json({ error: 'text must be a string' })
    }

    const completeText = text.trim()

    if (!completeText) {
      return response.status(400).json({ error: 'text must not be empty' })
    }

    if (completeText.length > MAX_REQUEST_LENGTH) {
      return response.status(400).json({
        error: `text must be ${MAX_REQUEST_LENGTH} characters or fewer`,
      })
    }

    try {
      const reply = await generateReply(completeText)
      return response.json({ reply })
    } catch {
      return response.status(502).json({
        error: 'The assistant service is temporarily unavailable. Please try again.',
      })
    }
  })

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'Request body must be valid JSON' })
    }

    return response.status(500).json({ error: 'Unexpected server error' })
  })

  return app
}
