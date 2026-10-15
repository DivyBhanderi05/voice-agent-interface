export type AgentRequestErrorKind = 'api' | 'network'

export class AgentRequestError extends Error {
  constructor(
    public readonly kind: AgentRequestErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'AgentRequestError'
  }
}

export async function processUserRequest(text: string): Promise<string> {
  let response: Response

  try {
    response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    throw new AgentRequestError(
      'network',
      'Could not reach the server. Check your connection and try again.',
    )
  }

  let body: { reply?: unknown; error?: unknown }

  try {
    body = (await response.json()) as { reply?: unknown; error?: unknown }
  } catch {
    throw new AgentRequestError('api', 'The server returned an invalid response.')
  }

  if (!response.ok) {
    throw new AgentRequestError(
      'api',
      typeof body.error === 'string'
        ? body.error
        : 'The assistant could not process the request. Please try again.',
    )
  }

  if (typeof body.reply !== 'string' || !body.reply.trim()) {
    throw new AgentRequestError('api', 'The server returned an invalid response.')
  }

  return body.reply
}
