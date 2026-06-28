import { describe, expect, it } from 'vitest'
import { estimateCostUsd, estimateTokens, formatUsd } from './cost'

describe('cost', () => {
  it('estimates tokens from text', () => {
    expect(estimateTokens('hello world')).toBeGreaterThan(0)
    expect(estimateTokens('')).toBe(0)
  })

  it('estimates model cost', () => {
    const cost = estimateCostUsd('gemini-2.5-flash-lite', 'hello world', '你好')
    expect(cost).toBeGreaterThan(0)
    expect(formatUsd(cost)).toMatch(/\$|<\$/)
  })
})
