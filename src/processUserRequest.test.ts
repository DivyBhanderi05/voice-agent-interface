import { afterEach, describe, expect, it, vi } from 'vitest'
import { AgentRequestError, processUserRequest } from './processUserRequest'

describe('processUserRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the complete text and returns the reply', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: 'Gemini response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(processUserRequest('complete user request')).resolves.toBe(
      'Gemini response',
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'complete user request' }),
    })
  })

  it('reports an API error returned by the server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Service unavailable' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(processUserRequest('request')).rejects.toMatchObject({
      kind: 'api',
      message: 'Service unavailable',
    } satisfies Partial<AgentRequestError>)
  })

  it('reports a network error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(processUserRequest('request')).rejects.toMatchObject({
      kind: 'network',
    } satisfies Partial<AgentRequestError>)
  })
})
