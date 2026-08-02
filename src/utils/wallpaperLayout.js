import {
  WALLPAPER_DEFAULT_CIRCLE_RATIO,
  WALLPAPER_MAX_CIRCLE_RATIO,
  WALLPAPER_MIN_CIRCLE_RATIO,
} from '../constants/planner'

/**
 * Auto-pack circles on an artboard.
 * sizeRatio = diameter / boardWidth; nx/ny = center in normalized board space.
 */
export function autoLayoutWallpaper(dayIds, aspect = 1) {
  const n = dayIds.length
  if (n === 0) return []

  const landscape = aspect >= 1.15
  const sizeRatio = clampRatio(defaultSizeForCount(n, landscape))
  const slots = landscape ? slotCentersLandscape(n) : slotCentersPortrait(n)

  return dayIds.map((dayId, index) => ({
    dayId,
    nx: slots[index].nx,
    ny: slots[index].ny,
    sizeRatio,
  }))
}

function defaultSizeForCount(n, landscape) {
  if (n <= 1) return landscape ? 0.38 : 0.72
  if (n === 2) return landscape ? 0.36 : 0.48
  if (n === 3) return landscape ? 0.28 : 0.4
  if (n === 4) return landscape ? 0.26 : 0.38
  if (n <= 6) return landscape ? 0.22 : 0.32
  return landscape ? 0.2 : 0.28
}

function slotCentersPortrait(n) {
  if (n === 1) return [{ nx: 0.5, ny: 0.5 }]
  if (n === 2) {
    return [
      { nx: 0.5, ny: 0.28 },
      { nx: 0.5, ny: 0.72 },
    ]
  }
  if (n === 3) {
    return [
      { nx: 0.5, ny: 0.2 },
      { nx: 0.5, ny: 0.5 },
      { nx: 0.5, ny: 0.8 },
    ]
  }
  if (n === 4) {
    return [
      { nx: 0.3, ny: 0.28 },
      { nx: 0.7, ny: 0.28 },
      { nx: 0.3, ny: 0.72 },
      { nx: 0.7, ny: 0.72 },
    ]
  }
  return gridSlots(n, n <= 6 ? 2 : 3)
}

function slotCentersLandscape(n) {
  if (n === 1) return [{ nx: 0.5, ny: 0.5 }]
  if (n === 2) {
    return [
      { nx: 0.28, ny: 0.5 },
      { nx: 0.72, ny: 0.5 },
    ]
  }
  if (n === 3) {
    return [
      { nx: 0.2, ny: 0.5 },
      { nx: 0.5, ny: 0.5 },
      { nx: 0.8, ny: 0.5 },
    ]
  }
  if (n === 4) {
    return [
      { nx: 0.28, ny: 0.32 },
      { nx: 0.72, ny: 0.32 },
      { nx: 0.28, ny: 0.72 },
      { nx: 0.72, ny: 0.72 },
    ]
  }
  return gridSlots(n, n <= 6 ? 3 : 4)
}

function gridSlots(n, cols) {
  const rows = Math.ceil(n / cols)
  const slots = []
  for (let i = 0; i < n; i += 1) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const inRow = Math.min(cols, n - row * cols)
    const nx = (col + 1) / (inRow + 1)
    const ny = (row + 1) / (rows + 1)
    slots.push({ nx, ny })
  }
  return slots
}

export function clampRatio(ratio) {
  return Math.min(
    WALLPAPER_MAX_CIRCLE_RATIO,
    Math.max(WALLPAPER_MIN_CIRCLE_RATIO, ratio),
  )
}

export function clampNorm(v) {
  return Math.min(1, Math.max(0, v))
}

/** Keep circle fully inside the board. */
export function clampPlacement(item, boardAspect) {
  const halfW = item.sizeRatio / 2
  const halfH = (item.sizeRatio * boardAspect) / 2
  return {
    ...item,
    sizeRatio: clampRatio(item.sizeRatio),
    nx: clampNorm(Math.min(1 - halfW, Math.max(halfW, item.nx))),
    ny: clampNorm(Math.min(1 - halfH, Math.max(halfH, item.ny))),
  }
}

export function createWallpaperPlacement(dayId, index = 0, total = 1, aspect = 1) {
  const laid = autoLayoutWallpaper(
    Array.from({ length: total }, (_, i) => (i === index ? dayId : `tmp-${i}`)),
    aspect,
  )
  const slot = laid[index] ?? {
    dayId,
    nx: 0.5,
    ny: 0.5,
    sizeRatio: WALLPAPER_DEFAULT_CIRCLE_RATIO,
  }
  return {
    dayId,
    nx: slot.nx,
    ny: slot.ny,
    sizeRatio: slot.sizeRatio,
  }
}
