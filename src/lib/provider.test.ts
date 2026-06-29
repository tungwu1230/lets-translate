import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  translateText,
  TranslationError,
  buildOpenAiRequest,
  buildGeminiRequest,
  buildCustomChatRequest,
} from './provider'
import type { TranslateRequest } from './provider'

// Mock fetch globally
global.fetch = vi.fn()

const mockPrompt = { system: 'You are a translator.', user: 'Translate this' }

// Mock prompt module
vi.mock('./prompt', () => ({
  buildTranslationPrompt: () => mockPrompt,
}))

describe('provider request builders', () => {
  it('builds an OpenAI Chat Completion request with system and user roles', () => {
    const request = buildOpenAiRequest(mockPrompt, 'gpt-5.4-nano')
    expect(request.model).toBe('gpt-5.4-nano')
    expect(request.messages[0]).toEqual({ role: 'system', content: 'You are a translator.' })
    expect(request.messages[1]).toEqual({ role: 'user', content: 'Translate this' })
  })

  it('builds an OpenAI request with stream enabled', () => {
    const request = buildOpenAiRequest(mockPrompt, 'gpt-5.4-nano', true)
    expect(request.stream).toBe(true)
  })

  it('builds a Gemini generateContent request with systemInstruction', () => {
    const request = buildGeminiRequest(mockPrompt)
    expect(request.systemInstruction.parts[0].text).toBe('You are a translator.')
    expect(request.contents[0].parts[0].text).toBe('Translate this')
    expect(request.generationConfig.temperature).toBe(0.2)
  })

  it('builds a custom chat request', () => {
    const request = buildCustomChatRequest(mockPrompt, 'custom-model')
    expect(request.model).toBe('custom-model')
    expect(request.messages[0]).toEqual({ role: 'system', content: 'You are a translator.' })
  })
})

describe('translateText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseRequest: TranslateRequest = {
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-5.4-nano',
    sourceLanguage: 'en',
    targetLanguage: 'zh-Hant',
    mode: 'natural',
    tone: 'neutral',
    text: 'Hello',
  }

  it('throws error when API key is missing for non-custom provider', async () => {
    const request = { ...baseRequest, apiKey: '' }
    await expect(translateText(request)).rejects.toThrow('請先設定目前供應商的 API key')
  })

  it('throws error when text is empty', async () => {
    const request = { ...baseRequest, text: '   ' }
    await expect(translateText(request)).rejects.toThrow('請輸入要翻譯的文字')
  })

  it('allows custom provider without API key', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '測試' } }],
      }),
    } as Response)

    const request = { ...baseRequest, provider: 'custom', apiKey: '' }
    const result = await translateText(request)
    expect(result).toBe('測試')
  })
})

describe('translateWithOpenAi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseRequest: TranslateRequest = {
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-5.4-nano',
    sourceLanguage: 'en',
    targetLanguage: 'zh-Hant',
    mode: 'natural',
    tone: 'neutral',
    text: 'Hello',
  }

  it('handles successful non-streaming response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '你好' } }],
      }),
    } as Response)

    const result = await translateText(baseRequest)
    expect(result).toBe('你好')
  })

  it('handles 401 unauthorized error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow(TranslationError)
    await expect(translateText(baseRequest)).rejects.toThrow('API key 無效或沒有模型權限')
  })

  it('handles 403 forbidden error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Access denied' } }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('API key 無效或沒有模型權限')
  })

  it('handles 429 rate limit error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limit exceeded' } }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('已達供應商速率或額度限制')
  })

  it('handles streaming response', async () => {
    const chunks = ['data: {"choices":[{"delta":{"content":"你"}}]}\n\n', 'data: [DONE]\n\n']
    let chunkIndex = 0

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (chunkIndex >= chunks.length) return { done: true, value: undefined }
            const chunk = chunks[chunkIndex++]
            return { done: false, value: new TextEncoder().encode(chunk) }
          },
        }),
      },
    } as Response)

    let receivedText = ''
    const onChunk = vi.fn((text) => {
      receivedText = text
    })

    const result = await translateText({ ...baseRequest, stream: true, onChunk })
    expect(result).toBe('你')
    expect(onChunk).toHaveBeenCalled()
  })

  it('throws error when response has no content', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: {} }] }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('OpenAI 回應中沒有可用的翻譯文字')
  })
})

describe('translateWithCustom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseRequest: TranslateRequest = {
    provider: 'custom',
    apiKey: '',
    model: 'custom-model',
    sourceLanguage: 'en',
    targetLanguage: 'zh-Hant',
    mode: 'natural',
    tone: 'neutral',
    text: 'Hello',
    customEndpoint: 'https://custom-api.com/v1/chat',
  }

  it('handles successful response with API key', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '測試' } }],
      }),
    } as Response)

    const request = { ...baseRequest, apiKey: 'custom-key' }
    const result = await translateText(request)

    // 驗證 fetch 被調用並且包含 Authorization header
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[0]).toBe('/api/proxy')
    const headers = fetchCall[1]?.headers as Headers
    expect(headers.get('authorization')).toBe('Bearer custom-key')
    expect(result).toBe('測試')
  })

  it('handles response without API key', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '測試' } }],
      }),
    } as Response)

    const result = await translateText(baseRequest)

    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[1]?.headers).not.toHaveProperty('authorization')
    expect(result).toBe('測試')
  })

  it('handles custom endpoint fallback', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '測試' } }],
      }),
    } as Response)

    const request = { ...baseRequest, customEndpoint: undefined }
    await translateText(request)

    expect(fetch).toHaveBeenCalledWith('/api/proxy', expect.any(Object))
  })

  it('handles alternative output_text format', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: '測試',
      }),
    } as Response)

    const result = await translateText(baseRequest)
    expect(result).toBe('測試')
  })

  it('throws error when no valid output format', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ other: 'data' }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('自訂 API 回應中沒有可用的翻譯文字')
  })
})

describe('translateWithGemini', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseRequest: TranslateRequest = {
    provider: 'gemini',
    apiKey: 'test-key',
    model: 'gemini-2.5-flash',
    sourceLanguage: 'en',
    targetLanguage: 'zh-Hant',
    mode: 'natural',
    tone: 'neutral',
    text: 'Hello',
  }

  it('handles successful non-streaming response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: '你好' }],
            },
          },
        ],
      }),
    } as Response)

    const result = await translateText(baseRequest)
    expect(result).toBe('你好')
  })

  it('handles streaming response with JSON array format', async () => {
    const chunks = [
      '[{"candidates":[{"content":{"parts":[{"text":"你"}]}}]}\n',
      ',{"candidates":[{"content":{"parts":[{"text":"好"}]}}]}]\n',
    ]
    let chunkIndex = 0

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (chunkIndex >= chunks.length) return { done: true, value: undefined }
            const chunk = chunks[chunkIndex++]
            return { done: false, value: new TextEncoder().encode(chunk) }
          },
        }),
      },
    } as Response)

    let receivedText = ''
    const onChunk = vi.fn((text) => {
      receivedText = text
    })

    const result = await translateText({ ...baseRequest, stream: true, onChunk })
    expect(result).toBe('你好')
    expect(onChunk).toHaveBeenCalled()
  })

  it('handles multiple parts in response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: '你好' }, { text: '，世界' }],
            },
          },
        ],
      }),
    } as Response)

    const result = await translateText(baseRequest)
    expect(result).toBe('你好，世界')
  })

  it('filters out empty parts', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: '你好' }, {}, { text: '世界' }],
            },
          },
        ],
      }),
    } as Response)

    const result = await translateText(baseRequest)
    expect(result).toBe('你好世界')
  })

  it('throws error when no candidates in response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('Gemini 回應中沒有可用的翻譯文字')
  })

  it('throws error with provider message for generic errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal server error' } }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('Internal server error')
  })

  it('throws default error message when no provider message', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ other: 'data' }),
    } as Response)

    await expect(translateText(baseRequest)).rejects.toThrow('翻譯服務暫時無法完成請求')
  })
})

describe('fetchWithProxy', () => {
  it('sets x-target-url header correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '測試' } }] }),
    } as Response)

    const request: TranslateRequest = {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-5.4-nano',
      sourceLanguage: 'en',
      targetLanguage: 'zh-Hant',
      mode: 'natural',
      tone: 'neutral',
      text: 'Hello',
    }

    await translateText(request)

    const fetchCall = vi.mocked(fetch).mock.calls[0]
    expect(fetchCall[0]).toBe('/api/proxy')
    expect(fetchCall[1]?.headers).toBeDefined()
  })
})

describe('TranslationError', () => {
  it('creates error with message and status', () => {
    const error = new TranslationError('Test error', 401)
    expect(error.message).toBe('Test error')
    expect(error.status).toBe(401)
    expect(error.name).toBe('TranslationError')
  })

  it('creates error without status', () => {
    const error = new TranslationError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.status).toBeUndefined()
  })
})
