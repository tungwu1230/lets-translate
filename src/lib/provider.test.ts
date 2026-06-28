import { describe, expect, it } from 'vitest'
import { buildGeminiRequest, buildOpenAiRequest } from './provider'

const prompt = { system: 'You are a translator.', user: 'Translate this' }

describe('provider request builders', () => {
  it('builds an OpenAI Chat Completion request with system and user roles', () => {
    const request = buildOpenAiRequest(prompt, 'gpt-5.4-nano')
    expect(request.model).toBe('gpt-5.4-nano')
    expect(request.messages[0]).toEqual({ role: 'system', content: 'You are a translator.' })
    expect(request.messages[1]).toEqual({ role: 'user', content: 'Translate this' })
  })

  it('builds a Gemini generateContent request with systemInstruction', () => {
    const request = buildGeminiRequest(prompt)
    expect(request.systemInstruction.parts[0].text).toBe('You are a translator.')
    expect(request.contents[0].parts[0].text).toBe('Translate this')
    expect(request.generationConfig.temperature).toBe(0.2)
  })
})
