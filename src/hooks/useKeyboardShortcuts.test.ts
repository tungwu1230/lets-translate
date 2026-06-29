import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should register keyboard shortcut handler', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'a': handler }))

    const event = new KeyboardEvent('keydown', { key: 'a' })
    window.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should handle Cmd+ shortcut', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'Cmd+,': handler }))

    const event = new KeyboardEvent('keydown', { key: ',', metaKey: true })
    window.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should handle Ctrl+ shortcut', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'Ctrl+,': handler }))

    const event = new KeyboardEvent('keydown', { key: ',', ctrlKey: true })
    window.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should prevent default for matched shortcuts', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'a': handler }))

    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefault).toHaveBeenCalled()
  })

  it('should not trigger for non-matching keys', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'a': handler }))

    const event = new KeyboardEvent('keydown', { key: 'b' })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not trigger when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'a': handler }, [], { disable: true }))

    const event = new KeyboardEvent('keydown', { key: 'a' })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useKeyboardShortcuts({ 'a': vi.fn() }))

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should handle multiple shortcuts', () => {
    const handlerA = vi.fn()
    const handlerB = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'a': handlerA, 'b': handlerB }))

    const eventA = new KeyboardEvent('keydown', { key: 'a' })
    const eventB = new KeyboardEvent('keydown', { key: 'b' })

    window.dispatchEvent(eventA)
    window.dispatchEvent(eventB)

    expect(handlerA).toHaveBeenCalledTimes(1)
    expect(handlerB).toHaveBeenCalledTimes(1)
  })

  it('should handle Shift+ shortcut', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'Shift+a': handler }))

    const event = new KeyboardEvent('keydown', { key: 'a', shiftKey: true })
    window.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not trigger Shift+ shortcut without Shift key', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts({ 'Shift+a': handler }))

    const event = new KeyboardEvent('keydown', { key: 'a', shiftKey: false })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })
})
