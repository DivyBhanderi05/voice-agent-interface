import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.js'
import { MAX_REQUEST_LENGTH } from './config.js'

describe('POST /api/agent', () => {
  it.each([
    ['a missing text field', {}, 'text must be a string'],
    ['a non-string text field', { text: 42 }, 'text must be a string'],
    ['empty text', { text: '   ' }, 'text must not be empty'],
  ])('rejects %s', async (_description, body, message) => {
    const generateReply = vi.fn()
    const response = await request(createApp({ generateReply }))
      .post('/api/agent')
      .send(body)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: message })
    expect(generateReply).not.toHaveBeenCalled()
  })

  it('rejects text over the maximum length', async () => {
    const generateReply = vi.fn()
    const response = await request(createApp({ generateReply }))
      .post('/api/agent')
      .send({ text: 'a'.repeat(MAX_REQUEST_LENGTH + 1) })

    expect(response.status).toBe(400)
    expect(generateReply).not.toHaveBeenCalled()
  })

  it('sends the trimmed complete request and returns the reply', async () => {
    const generateReply = vi.fn().mockResolvedValue('A concise response')
    const response = await request(createApp({ generateReply }))
      .post('/api/agent')
      .send({ text: '  Find events nearby  ' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ reply: 'A concise response' })
    expect(generateReply).toHaveBeenCalledOnce()
    expect(generateReply).toHaveBeenCalledWith('Find events nearby')
  })

  it('returns a sanitized error when Gemini fails', async () => {
    const generateReply = vi.fn().mockRejectedValue(new Error('secret upstream detail'))
    const response = await request(createApp({ generateReply }))
      .post('/api/agent')
      .send({ text: 'Find an event' })

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      error: 'The assistant service is temporarily unavailable. Please try again.',
    })
    expect(response.text).not.toContain('secret upstream detail')
  })
})
