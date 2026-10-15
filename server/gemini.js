import { GoogleGenAI } from '@google/genai'
import { getGeminiConfig, SYSTEM_INSTRUCTION } from './config.js'

export async function generateGeminiReply(text) {
  const { apiKey, model } = getGeminiConfig()
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model,
    contents: text,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  })
  const reply = response.text?.trim()

  if (!reply) {
    throw new Error('Gemini returned an empty response')
  }

  return reply
}
