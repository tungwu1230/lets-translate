import { useEffect, useState } from 'react'
import { loadFavoritePairs, saveFavoritePairs } from '../lib/storage'
import type { FavoritePair, LanguageCode } from '../lib/types'

export function useFavoritePairs() {
  const [favoritePairs, setFavoritePairs] = useState<FavoritePair[]>(() => loadFavoritePairs())

  // 自動保存到 localStorage
  useEffect(() => {
    saveFavoritePairs(favoritePairs)
  }, [favoritePairs])

  function toggleFavoritePair(sourceLanguage: LanguageCode, targetLanguage: LanguageCode) {
    setFavoritePairs((current) => {
      const exists = current.some(
        (p) => p.sourceLanguage === sourceLanguage && p.targetLanguage === targetLanguage
      )
      if (exists) {
        // 移除收藏
        return current.filter(
          (p) => !(p.sourceLanguage === sourceLanguage && p.targetLanguage === targetLanguage)
        )
      } else {
        // 加入收藏
        return [
          ...current,
          {
            id: crypto.randomUUID(),
            sourceLanguage,
            targetLanguage,
          },
        ]
      }
    })
  }

  return {
    favoritePairs,
    toggleFavoritePair,
  }
}
