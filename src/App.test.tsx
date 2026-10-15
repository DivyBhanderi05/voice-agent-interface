// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AgentRequestError, processUserRequest } from './processUserRequest'

vi.mock('./processUserRequest', async (importOriginal) => {
  const original = await importOriginal<typeof import('./processUserRequest')>()
  return { ...original, processUserRequest: vi.fn() }
})

const mockedProcessUserRequest = vi.mocked(processUserRequest)

describe('App request behavior', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('submits typed input only after Send and displays success', async () => {
    const user = userEvent.setup()
    let resolveRequest: (reply: string) => void = () => undefined
    mockedProcessUserRequest.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    render(<App />)

    await user.type(screen.getByLabelText('Your request'), 'Find a concert')
    expect(mockedProcessUserRequest).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(mockedProcessUserRequest).toHaveBeenCalledOnce()
    expect(mockedProcessUserRequest).toHaveBeenCalledWith('Find a concert')
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()

    resolveRequest('Here is a concert option.')
    expect(await screen.findByText('Here is a concert option.')).toBeInTheDocument()
    expect(screen.getByText('Response received.')).toBeInTheDocument()
  })

  it.each([
    ['api', 'The assistant service is unavailable.'],
    ['network', 'Could not reach the server.'],
  ] as const)('shows a retry state after a %s error', async (kind, message) => {
    const user = userEvent.setup()
    mockedProcessUserRequest
      .mockRejectedValueOnce(new AgentRequestError(kind, message))
      .mockResolvedValueOnce('Recovered response')
    render(<App />)

    await user.type(screen.getByLabelText('Your request'), 'Find an event')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(mockedProcessUserRequest).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Recovered response')).toBeInTheDocument()
  })
})
