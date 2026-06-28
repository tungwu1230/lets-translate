import { useEffect } from 'react'

interface ShortcutMap {
  [key: string]: () => void
}

interface Options {
  disable?: boolean
}

/**
 * 註冊全局鍵盤快捷鍵
 *
 * 支援格式：
 * - 'Cmd+,' 或 'Ctrl+,' - Mac/Windows 快捷鍵
 * - 'KeyA' - 直接按鍵
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  deps: React.DependencyList = [],
  options: Options = {}
) {
  const { disable = false } = options

  useEffect(() => {
    if (disable) return

    function handleKeyDown(event: KeyboardEvent) {
      for (const [shortcut, handler] of Object.entries(shortcuts)) {
        if (matchShortcut(event, shortcut)) {
          event.preventDefault()
          handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, disable, ...deps])
}

function matchShortcut(event: KeyboardEvent, shortcut: string): boolean {
  // 解析快捷鍵格式，例如 'Cmd+,' 或 'Ctrl+Shift+KeyA'
  const parts = shortcut.split('+').map((p) => p.trim().toLowerCase())
  const key = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)

  // 檢查按鍵是否匹配
  const keyMatches =
    key.toLowerCase() === event.key.toLowerCase() ||
    key === event.code ||
    (key.startsWith('key') && key.toLowerCase() === event.key.toLowerCase())

  if (!keyMatches) return false

  // 檢查修飾鍵
  const hasCmd = modifiers.includes('cmd') || modifiers.includes('meta')
  const hasCtrl = modifiers.includes('ctrl')
  const hasShift = modifiers.includes('shift')
  const hasAlt = modifiers.includes('alt') || modifiers.includes('option')

  if (hasCmd && !event.metaKey) return false
  if (hasCtrl && !event.ctrlKey) return false
  if (hasShift && !event.shiftKey) return false
  if (hasAlt && !event.altKey) return false

  // 確保沒有多餘的修飾鍵
  if (!hasCmd && event.metaKey) return false
  if (!hasCtrl && event.ctrlKey) return false
  if (!hasShift && event.shiftKey) return false
  if (!hasAlt && event.altKey) return false

  return true
}
