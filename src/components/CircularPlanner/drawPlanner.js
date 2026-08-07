import {
  HOURS_PER_DAY,
  PLANNER_GEOMETRY,
  PLANNER_SIZE,
  PLANNER_STYLE,
  STICKER_ROTATE_HANDLE_GAP,
  STICKER_ROTATE_HANDLE_RADIUS,
} from '../../constants/planner'
import {
  RAY_KINDS,
  formatClockLabel,
  getDividerRays,
  getPlannerLayout,
  hourToAngle,
  polarToCartesian,
} from '../../utils/canvasGeometry'
import {
  dividerColorForBoundary,
  hexToRgba,
  toneFromBackground,
} from '../../utils/color'

/**
 * Draw the full circular planner frame onto a 2D canvas context.
 */
export function drawPlanner(ctx, size, options = {}) {
  const {
    blocks = [],
    stickers = [],
    imageCache = null,
    selectedStickerIds = [],
    previewRange = null,
    previewColor = null,
    rangeStart = null,
    pageBackground = '#f7f4ef',
    ringStroke = '#3d4a6b',
  } = options
  const layout = getPlannerLayout(size)
  // Reference values are tuned for PLANNER_SIZE — scale so proportions hold
  // whether this is a tiny board thumbnail or a large PNG export tile.
  const scale = size / PLANNER_SIZE
  const style = {
    ...PLANNER_STYLE,
    strokeWidth: Math.max(
      PLANNER_STYLE.strokeMinWidth,
      PLANNER_STYLE.strokeWidth * scale,
    ),
    dividerWidth: Math.max(
      PLANNER_STYLE.dividerMinWidth,
      PLANNER_STYLE.dividerWidth * scale,
    ),
    labelFontSize: Math.max(
      PLANNER_STYLE.labelMinFontPx,
      PLANNER_STYLE.labelFontSize * scale,
    ),
  }
  const labelColor = toneFromBackground(pageBackground, {
    satDelta: style.labelSatDelta,
    lightDelta: style.labelLightDelta,
  })

  ctx.clearRect(0, 0, size, size)
  // Background image lives on the stage layer behind this canvas.
  drawDiskBase(ctx, layout, style)
  drawBlocks(ctx, layout, blocks)
  drawPreview(ctx, layout, previewRange, previewColor, style)
  drawDividers(ctx, layout, style, blocks)
  drawOuterStroke(ctx, layout, style, ringStroke)
  drawHourLabels(ctx, layout, style, labelColor)
  drawStickers(ctx, size, stickers, imageCache, selectedStickerIds, ringStroke, scale)
  drawAnchorHour(ctx, layout, rangeStart, ringStroke, style)
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

  ctx.lineWidth = style.dividerWidth

  // Seams are healed first so a real boundary line always wins the pixel.
  const rays = getDividerRays(blocks)
  rays.sort((a, b) => rayOrder(a.kind) - rayOrder(b.kind))

  for (const ray of rays) {
    ctx.strokeStyle = strokeForRay(ray, style)
    // A seam repair must not spill past the disk edge, so no round cap there.
    ctx.lineCap = ray.kind === RAY_KINDS.seam ? 'butt' : 'round'

    const angle = hourToAngle(ray.time)
    const outer = polarToCartesian(center, center, outerRadius, angle)
    const inner = polarToCartesian(center, center, hub, angle)

    ctx.beginPath()
    ctx.moveTo(outer.x, outer.y)
    ctx.lineTo(inner.x, inner.y)
    ctx.stroke()
  }
}

function rayOrder(kind) {
  return kind === RAY_KINDS.seam ? 0 : 1
}

function strokeForRay(ray, style) {
  switch (ray.kind) {
    case RAY_KINDS.grid:
      return style.emptyDividerColor
    // Same fill on both sides: paint the antialiasing gap back in, invisibly.
    case RAY_KINDS.seam:
      return ray.left
    // Outline of a painted region against the bare disk.
    case RAY_KINDS.edge:
      return dividerColorForBoundary(ray.left ?? ray.right, style.ringFill, {
        satDelta: style.dividerSatDelta,
        minContrast: style.dividerEdgeMinContrast,
      })
    default:
      return dividerColorForBoundary(ray.left, ray.right, {
        satDelta: style.dividerSatDelta,
        minContrast: style.dividerMinContrast,
      })
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
  ctx.font = `${style.labelFontWeight} ${style.labelFontSize}px ${style.labelFontFamily}`
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
  selectedStickerIds,
  ringStroke,
  scale = 1,
) {
  if (!stickers?.length) return

  const selectedSet = new Set(selectedStickerIds ?? [])
  const primaryId =
    selectedStickerIds?.[selectedStickerIds.length - 1] ?? null

  for (const sticker of stickers) {
    const img = imageCache?.get?.(sticker.src)
    if (!img || !img.complete) continue

    const width = size * sticker.sizeRatio
    const aspect = img.naturalHeight / img.naturalWidth || 1
    const height = width * aspect
    const cx = sticker.nx * size
    const cy = sticker.ny * size
    const rotationRad = ((sticker.rotation || 0) * Math.PI) / 180
    const isSelected = selectedSet.has(sticker.id)
    const isPrimary = sticker.id === primaryId

    // Everything below is drawn in the sticker's own local space (centered
    // on origin, unrotated) — translate+rotate once so the image, selection
    // outline, and handles all rotate together automatically.
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotationRad)
    ctx.drawImage(img, -width / 2, -height / 2, width, height)

    if (isSelected) {
      ctx.strokeStyle = ringStroke
      ctx.lineWidth = 1.25
      ctx.setLineDash([4, 3])
      ctx.strokeRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4)
      ctx.setLineDash([])

      // Resize/rotate handles only on the primary (last-selected) sticker.
      if (isPrimary) {
        const handleSize = 8
        const corners = [
          [-width / 2, -height / 2],
          [width / 2, -height / 2],
          [-width / 2, height / 2],
          [width / 2, height / 2],
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

        // Rotate handle: a small circle above the top edge, on a stalk — its
        // world position must match getStickerHandles().rotate exactly.
        const rotateGap = STICKER_ROTATE_HANDLE_GAP * scale
        const rotateRadius = STICKER_ROTATE_HANDLE_RADIUS * scale
        const rotateY = -height / 2 - rotateGap
        ctx.lineWidth = 1.25
        ctx.beginPath()
        ctx.moveTo(0, -height / 2)
        ctx.lineTo(0, rotateY)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(0, rotateY, rotateRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.stroke()
      }
    }

    ctx.restore()
  }
}
