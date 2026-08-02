import {
  HOURS_PER_DAY,
  PLANNER_GEOMETRY,
  PLANNER_STYLE,
} from '../../constants/planner'
import {
  colorAtTime,
  formatClockLabel,
  getDividerTimes,
  getPlannerLayout,
  hourToAngle,
  polarToCartesian,
} from '../../utils/canvasGeometry'
import { hexToRgba, subtleDividerColor, toneFromBackground } from '../../utils/color'

/**
 * Draw the full circular planner frame onto a 2D canvas context.
 */
export function drawPlanner(ctx, size, options = {}) {
  const {
    blocks = [],
    stickers = [],
    imageCache = null,
    selectedStickerId = null,
    previewRange = null,
    previewColor = null,
    rangeStart = null,
    pageBackground = '#f7f4ef',
    backgroundImage = null,
    ringStroke = '#3d4a6b',
  } = options
  const layout = getPlannerLayout(size)
  const style = PLANNER_STYLE
  const labelColor = toneFromBackground(pageBackground, {
    satDelta: style.labelSatDelta,
    lightDelta: style.labelLightDelta,
  })

  ctx.clearRect(0, 0, size, size)
  drawBackground(ctx, size, pageBackground, backgroundImage)
  drawDiskBase(ctx, layout, style)
  drawBlocks(ctx, layout, blocks)
  drawPreview(ctx, layout, previewRange, previewColor, style)
  drawDividers(ctx, layout, style, blocks)
  drawOuterStroke(ctx, layout, style, ringStroke)
  drawHourLabels(ctx, layout, style, labelColor)
  drawStickers(ctx, size, stickers, imageCache, selectedStickerId, ringStroke)
  drawAnchorHour(ctx, layout, rangeStart, ringStroke, style)
}

function drawBackground(ctx, size, pageBackground, backgroundImage = null) {
  if (backgroundImage?.complete && backgroundImage.naturalWidth) {
    const iw = backgroundImage.naturalWidth
    const ih = backgroundImage.naturalHeight
    const scale = Math.max(size / iw, size / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (size - dw) / 2
    const dy = (size - dh) / 2
    ctx.drawImage(backgroundImage, dx, dy, dw, dh)
    return
  }

  ctx.fillStyle = pageBackground
  ctx.fillRect(0, 0, size, size)
}

function drawDiskBase(ctx, layout, style) {
  const { center, outerRadius } = layout

  ctx.beginPath()
  ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
  ctx.fillStyle = style.ringFill
  ctx.fill()
}

/** Pie wedge from center → outer edge. Supports fractional hours. */
function drawSector(ctx, layout, startHour, endHour) {
  const { center, outerRadius } = layout
  const start = hourToAngle(startHour)
  const end =
    startHour === endHour ? start + Math.PI * 2 : hourToAngle(endHour)

  ctx.beginPath()
  ctx.moveTo(center, center)
  ctx.arc(center, center, outerRadius, start, end, false)
  ctx.closePath()
}

function drawBlocks(ctx, layout, blocks) {
  for (const block of blocks) {
    drawSector(ctx, layout, block.startHour, block.endHour)
    ctx.fillStyle = block.color
    ctx.fill()
  }
}

function drawPreview(ctx, layout, previewRange, previewColor, style) {
  if (!previewRange || !previewColor) return

  drawSector(ctx, layout, previewRange.startHour, previewRange.endHour)
  ctx.fillStyle = hexToRgba(previewColor, style.previewAlpha)
  ctx.fill()
}

function drawDividers(ctx, layout, style, blocks) {
  const { center, outerRadius } = layout
  const hub = outerRadius * PLANNER_GEOMETRY.dividerHubRatio
  const emptyFill = style.ringFill

  ctx.lineWidth = style.dividerWidth
  ctx.lineCap = 'round'

  for (const time of getDividerTimes(blocks)) {
    const sample =
      colorAtTime(blocks, time + 1e-4) ??
      colorAtTime(blocks, time - 1e-4) ??
      emptyFill

    ctx.strokeStyle = subtleDividerColor(sample, {
      satDelta: style.dividerSatDelta,
      lightDelta: style.dividerLightDelta,
    })
    const angle = hourToAngle(time)
    const outer = polarToCartesian(center, center, outerRadius, angle)
    const inner = polarToCartesian(center, center, hub, angle)

    ctx.beginPath()
    ctx.moveTo(outer.x, outer.y)
    ctx.lineTo(inner.x, inner.y)
    ctx.stroke()
  }
}

function drawOuterStroke(ctx, layout, style, ringStroke) {
  const { center, outerRadius } = layout

  ctx.strokeStyle = ringStroke
  ctx.lineWidth = style.strokeWidth
  ctx.beginPath()
  ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Labels sit on each hour's START ray (not mid-slot),
 * so both "12"s land at the exact top and bottom.
 */
function drawHourLabels(ctx, layout, style, labelColor) {
  const { center, labelRadius } = layout

  ctx.fillStyle = labelColor
  ctx.font = style.labelFont
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let hour = 0; hour < HOURS_PER_DAY; hour += 1) {
    const angle = hourToAngle(hour)
    const point = polarToCartesian(center, center, labelRadius, angle)
    ctx.fillText(formatClockLabel(hour), point.x, point.y)
  }
}

function drawAnchorHour(ctx, layout, rangeStart, ringStroke, style) {
  if (rangeStart == null) return

  drawSector(ctx, layout, rangeStart, (rangeStart + 1) % HOURS_PER_DAY)
  ctx.strokeStyle = ringStroke
  ctx.lineWidth = style.strokeWidth * 2
  ctx.stroke()
}

function drawStickers(
  ctx,
  size,
  stickers,
  imageCache,
  selectedStickerId,
  ringStroke,
) {
  if (!stickers?.length) return

  for (const sticker of stickers) {
    const img = imageCache?.get?.(sticker.src)
    if (!img || !img.complete) continue

    const width = size * sticker.sizeRatio
    const aspect = img.naturalHeight / img.naturalWidth || 1
    const height = width * aspect
    const x = sticker.nx * size - width / 2
    const y = sticker.ny * size - height / 2

    ctx.drawImage(img, x, y, width, height)

    if (sticker.id === selectedStickerId) {
      ctx.strokeStyle = ringStroke
      ctx.lineWidth = 1.25
      ctx.setLineDash([4, 3])
      ctx.strokeRect(x - 2, y - 2, width + 4, height + 4)
      ctx.setLineDash([])

      const handleSize = 8
      const corners = [
        [x, y],
        [x + width, y],
        [x, y + height],
        [x + width, y + height],
      ]
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = ringStroke
      ctx.lineWidth = 1.25
      for (const [hx, hy] of corners) {
        ctx.beginPath()
        ctx.rect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize)
        ctx.fill()
        ctx.stroke()
      }
    }
  }
}
