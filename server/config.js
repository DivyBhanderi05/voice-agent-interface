export const MAX_REQUEST_LENGTH = 5_000

export const SYSTEM_INSTRUCTION =
  'You are a voice-enabled assistant prototype for an event application. Help users understand requests related to finding events, creating events, updating events, and finding sponsors. No real application tools are connected yet, so clearly state when an action would require a future backend integration. Keep responses concise.'

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
  }
}
