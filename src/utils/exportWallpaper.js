import { WALLPAPER_EXPORT_LONG_EDGE, getTheme } from '../constants/planner'
import { clampPlacement } from './wallpaperLayout'
import { drawPlanner } from '../components/CircularPlanner/drawPlanner'

/**
 * Render the composition board to a high-res PNG and trigger download.
 */
export async function exportWallpaperPng({
  aspect,
  placements,
  days,
  theme,
  imageCache,
  backgroundSrc = null,
  transparentBg = false,
  longEdge = WALLPAPER_EXPORT_LONG_EDGE,
  filename,
}) {
  const { width, height } = sizeFromAspect(aspect, longEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  await paintBoard(ctx, width, height, {
    placements,
    days,
    theme,
    imageCache,
    backgroundSrc,
    transparentBg,
  })

  const stamp = new Date().toISOString().slice(0, 10)
  const name = filename || `루틴메이커-${stamp}.png`
  await downloadCanvasPng(canvas, name)
}

export function sizeFromAspect(aspect, longEdge) {
  if (aspect >= 1) {
    return {
      width: longEdge,
      height: Math.max(1, Math.round(longEdge / aspect)),
    }
  }
  return {
    height: longEdge,
    width: Math.max(1, Math.round(longEdge * aspect)),
  }
}

async function paintBoard(ctx, width, height, options) {
  const { placements, days, theme, imageCache, backgroundSrc, transparentBg } =
    options
  const aspect = width / height

  // Transparent export skips any backdrop entirely (custom image or solid
  // fill) so only the planner tiles themselves are opaque in the PNG.
  if (!transparentBg) {
    if (backgroundSrc) {
      const img = await loadImage(backgroundSrc)
      drawCover(ctx, img, width, height)
    } else {
      ctx.fillStyle = theme.pageBackground || '#f4f4f2'
      ctx.fillRect(0, 0, width, height)
    }
  }

  const dayMap = new Map(days.map((day) => [day.id, day]))

  for (const raw of placements) {
    const day = dayMap.get(raw.dayId)
    if (!day) continue
    const item = clampPlacement(raw, aspect)
    const size = Math.max(1, Math.round(item.sizeRatio * width))
    const left = Math.round(item.nx * width - size / 2)
    const top = Math.round(item.ny * height - size / 2)

    // Match the on-screen board: each tile keeps its own last-used
    // palette, not the board's currently-active theme.
    const dayTheme = getTheme(day.themeId)
    const tile = document.createElement('canvas')
    tile.width = size
    tile.height = size
    const tileCtx = tile.getContext('2d')
    tileCtx.imageSmoothingEnabled = true
    tileCtx.imageSmoothingQuality = 'high'
    drawPlanner(tileCtx, size, {
      blocks: day.blocks,
      stickers: day.stickers,
      imageCache,
      pageBackground: dayTheme.pageBackground,
      ringStroke: dayTheme.ringStroke,
    })
    ctx.drawImage(tile, left, top, size, size)
  }
}

function drawCover(ctx, img, width, height) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  const dx = (width - dw) / 2
  const dy = (height - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function downloadCanvasPng(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false)
        return
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      resolve(true)
    }, 'image/png')
  })
}
