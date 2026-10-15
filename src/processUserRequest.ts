/**
 * Temporary request processor. Replace this implementation with an AI service
 * call later; keeping it separate prevents the UI from depending on a provider.
 */
export async function processUserRequest(text: string): Promise<string> {
  return `Received complete request: ${text}`
}
