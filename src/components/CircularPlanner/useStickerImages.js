import { useEffect, useRef, useState } from 'react'

/**
 * Load sticker images into an in-memory cache and bump `version` when ready,
 * so canvas can redraw after async decode.
 */
export function useStickerImages(sources) {
  const cacheRef = useRef(new Map())
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const unique = [...new Set(sources.filter(Boolean))]

    unique.forEach((src) => {
      if (cacheRef.current.has(src)) return

      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (cancelled) return
        cacheRef.current.set(src, img)
        setVersion((v) => v + 1)
      }
      img.onerror = () => {
        if (cancelled) return
        cacheRef.current.delete(src)
      }
      img.src = src
    })

    return () => {
      cancelled = true
    }
  }, [sources])

  return { imageCache: cacheRef.current, imageVersion: version }
}
