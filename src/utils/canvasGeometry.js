import { HOURS_PER_DAY, PLANNER_GEOMETRY, SLOT_ANGLE } from '../constants/planner'

const EPS = 1e-6
/** Snap edge drags to this many minutes. */
export const TIME_SNAP_MINUTES = 5
/** Min painted arc length (hours). */
export const MIN_BLOCK_HOURS = TIME_SNAP_MINUTES / 60
/** How close (in hours) to a block edge to grab it. */
export const EDGE_HIT_HOURS = 0.14

/**
 * Convert CSS pixel size to device-pixel canvas size for crisp rendering.
 */
export function getDevicePixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2)
}

/**
 * Compute shared planner geometry from a square canvas size (CSS pixels).
 */
export function getPlannerLayout(size) {
  const { paddingRatio, innerRadiusRatio, labelRadiusRatio } = PLANNER_GEOMETRY
  const center = size / 2
  const outerRadius = center * (1 - paddingRatio)
  const innerRadius = outerRadius * innerRadiusRatio
  const labelRadius = outerRadius * labelRadiusRatio

  return { center, outerRadius, innerRadius, labelRadius }
}

export function normalizeHour(hour) {
  return ((hour % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY
}

/**
 * Angle (radians) for a fractional hour position.
 * Hour 0 is top (-π/2), then clockwise.
 */
export function hourToAngle(hour) {
  return -Math.PI / 2 + normalizeHour(hour) * SLOT_ANGLE
}

export function hourToMidAngle(hour) {
  return hourToAngle(hour) + SLOT_ANGLE / 2
}

export function blockMidAngle(startHour, endHour) {
  const mid = normalizeHour(startHour + spanHours(startHour, endHour) / 2)
  return hourToAngle(mid)
}

export function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

/** Clockwise duration from start → end in (0, 24]; 24 if equal (full day). */
export function spanHours(startHour, endHour) {
  const start = normalizeHour(startHour)
  const end = normalizeHour(endHour)
  const delta = (end - start + HOURS_PER_DAY) % HOURS_PER_DAY
  return delta < EPS ? HOURS_PER_DAY : delta
}

/** Linear intervals on [0, 24) covering a clockwise arc. */
export function spanToIntervals(startHour, endHour) {
  const start = normalizeHour(startHour)
  // Allow 24 as exclusive end-of-day sentinel from math like start+1
  if (endHour >= HOURS_PER_DAY - EPS && endHour <= HOURS_PER_DAY + EPS) {
    if (start < EPS) return [[0, HOURS_PER_DAY]]
    return [[start, HOURS_PER_DAY]]
  }

  const end = normalizeHour(endHour)
  if (spanHours(start, end) >= HOURS_PER_DAY - EPS) {
    return [[0, HOURS_PER_DAY]]
  }
  if (start < end) return [[start, end]]
  return [
    [start, HOURS_PER_DAY],
    [0, end],
  ].filter(([a, b]) => b - a > EPS)
}

export function timeInBlock(time, block) {
  const t = normalizeHour(time)
  for (const [a, b] of spanToIntervals(block.startHour, block.endHour)) {
    if (t >= a - EPS && t < b - EPS) return true
  }
  return false
}

export function intervalsOverlap(a, b) {
  return a[0] < b[1] - EPS && b[0] < a[1] - EPS
}

export function blocksOverlap(a, b) {
  const left = spanToIntervals(a.startHour, a.endHour)
  const right = spanToIntervals(b.startHour, b.endHour)
  return left.some((ia) => right.some((ib) => intervalsOverlap(ia, ib)))
}

export function snapHour(time, stepMinutes = TIME_SNAP_MINUTES) {
  const step = stepMinutes / 60
  return normalizeHour(Math.round(normalizeHour(time) / step) * step)
}

/**
 * Fractional hour under a canvas point, or null outside the disk.
 */
export function hitTestTime(x, y, layout) {
  const { center, outerRadius } = layout
  const dx = x - center
  const dy = y - center
  if (Math.hypot(dx, dy) > outerRadius) return null

  let angle = Math.atan2(dy, dx) + Math.PI / 2
  if (angle < 0) angle += Math.PI * 2
  return (angle / SLOT_ANGLE) % HOURS_PER_DAY
}

/**
 * Resolve which hour slot contains a canvas point (integer hour index).
 */
export function hitTestHour(x, y, layout) {
  const time = hitTestTime(x, y, layout)
  if (time == null) return null
  return Math.floor(time) % HOURS_PER_DAY
}

/**
 * Nearest block edge under the pointer, if within EDGE_HIT_HOURS.
 */
export function hitTestBlockEdge(x, y, blocks, layout, tolerance = EDGE_HIT_HOURS) {
  const time = hitTestTime(x, y, layout)
  if (time == null || !blocks?.length) return null

  let best = null
  let bestDist = tolerance

  for (const block of blocks) {
    for (const edge of ['start', 'end']) {
      const edgeTime = normalizeHour(
        edge === 'start' ? block.startHour : block.endHour,
      )
      let dist = Math.abs(time - edgeTime)
      dist = Math.min(dist, HOURS_PER_DAY - dist)
      if (dist < bestDist) {
        bestDist = dist
        best = { blockId: block.id, edge, block }
      }
    }
  }

  return best
}

export function colorAtTime(blocks, time) {
  const t = normalizeHour(time)
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    if (timeInBlock(t, blocks[i])) return blocks[i].color
  }
  return null
}

/**
 * Hours covered by an integer-aligned view of a block (for legacy helpers).
 */
export function getBlockHours(startHour, endHour) {
  const start = Math.floor(normalizeHour(startHour))
  const span = spanHours(startHour, endHour)
  if (span >= HOURS_PER_DAY - EPS) {
    return Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour)
  }

  const hours = []
  const endFloor = Math.floor(normalizeHour(endHour - EPS))
  let hour = start
  for (let i = 0; i < HOURS_PER_DAY; i += 1) {
    hours.push(hour)
    if (hour === endFloor) break
    hour = (hour + 1) % HOURS_PER_DAY
  }
  return hours
}

export function rangeFromClicks(startHour, endHourInclusive) {
  return {
    startHour,
    endHour: (endHourInclusive + 1) % HOURS_PER_DAY,
  }
}

export function findBlockAtHour(blocks, hour) {
  const t = normalizeHour(hour) + 0.5
  return blocks.find((block) => timeInBlock(t, block)) ?? null
}

export function findBlockAtTime(blocks, time) {
  return blocks.find((block) => timeInBlock(time, block)) ?? null
}

/** Map each hour index → dominant fill color at hour midpoints. */
export function getHourColorMap(blocks) {
  const map = Array.from({ length: HOURS_PER_DAY }, () => null)
  for (let hour = 0; hour < HOURS_PER_DAY; hour += 1) {
    map[hour] = colorAtTime(blocks, hour + 0.5)
  }
  return map
}

/**
 * Divider times (fractional hours) to draw.
 * Same-color continuous paint skips integer hour lines between them.
 */
export function getDividerTimes(blocks) {
  const times = []

  for (let hour = 0; hour < HOURS_PER_DAY; hour += 1) {
    const left = colorAtTime(blocks, hour - EPS)
    const right = colorAtTime(blocks, hour + EPS)
    if (left != null && left === right) continue
    times.push(hour)
  }

  for (const block of blocks) {
    for (const edge of [block.startHour, block.endHour]) {
      const t = normalizeHour(edge)
      const nearestHour = Math.round(t) % HOURS_PER_DAY
      if (Math.abs(t - nearestHour) < EPS || Math.abs(t - nearestHour - HOURS_PER_DAY) < EPS) {
        continue
      }
      times.push(t)
    }
  }

  return times
}

function subtractIntervalFromBlock(block, cutStart, cutEnd) {
  const cut = spanToIntervals(cutStart, cutEnd)
  const kept = []

  for (const [a, b] of spanToIntervals(block.startHour, block.endHour)) {
    let pieces = [[a, b]]
    for (const [c0, c1] of cut) {
      const next = []
      for (const [p0, p1] of pieces) {
        if (!intervalsOverlap([p0, p1], [c0, c1])) {
          next.push([p0, p1])
          continue
        }
        if (p0 < c0 - EPS) next.push([p0, Math.min(p1, c0)])
        if (p1 > c1 + EPS) next.push([Math.max(p0, c1), p1])
      }
      pieces = next
    }
    for (const [p0, p1] of pieces) {
      if (p1 - p0 >= MIN_BLOCK_HOURS - EPS) {
        kept.push({ start: p0, end: p1 })
      }
    }
  }

  return kept
}

/** Remove [start, end) from all blocks; returns new block list. */
export function subtractRange(blocks, startHour, endHour) {
  const next = []
  for (const block of blocks) {
    const pieces = subtractIntervalFromBlock(block, startHour, endHour)
    for (const piece of pieces) {
      next.push({
        id: pieces.length === 1 ? block.id : createBlockId(),
        startHour: piece.start,
        endHour: piece.end,
        color: block.color,
      })
    }
  }
  return next
}

function circularDistance(a, b) {
  const d = Math.abs(normalizeHour(a) - normalizeHour(b))
  return Math.min(d, HOURS_PER_DAY - d)
}

/** Merge contiguous same-color arcs. */
export function mergeAdjacentSameColor(blocks) {
  if (blocks.length <= 1) return blocks

  const items = blocks.map((block) => ({
    ...block,
    startHour: normalizeHour(block.startHour),
    endHour: normalizeHour(block.endHour),
  }))

  let changed = true
  while (changed) {
    changed = false
    outer: for (let i = 0; i < items.length; i += 1) {
      for (let j = 0; j < items.length; j += 1) {
        if (i === j) continue
        const a = items[i]
        const b = items[j]
        if (a.color !== b.color) continue
        if (circularDistance(a.endHour, b.startHour) > EPS) continue

        const merged = {
          id: a.id,
          startHour: a.startHour,
          endHour: b.endHour,
          color: a.color,
        }
        if (spanHours(merged.startHour, merged.endHour) >= HOURS_PER_DAY - EPS) {
          merged.startHour = 0
          merged.endHour = 0
        }
        items.splice(Math.max(i, j), 1)
        items.splice(Math.min(i, j), 1, merged)
        changed = true
        break outer
      }
    }
  }

  return items
}

/** Paint a full hour slot [hour, hour+1), replacing whatever was there. */
export function paintHourSlot(blocks, hour, color) {
  const start = Math.floor(normalizeHour(hour))
  const endExclusive = start + 1
  const afterCut = subtractRange(blocks, start, endExclusive)
  return mergeAdjacentSameColor([
    ...afterCut,
    {
      id: createBlockId(),
      startHour: start,
      endHour: endExclusive % HOURS_PER_DAY,
      color,
    },
  ])
}

/** Clear a full hour slot. */
export function eraseHourSlot(blocks, hour) {
  const start = Math.floor(normalizeHour(hour))
  return mergeAdjacentSameColor(subtractRange(blocks, start, start + 1))
}

/**
 * Move a block edge to `rawTime` (snapped). Cuts through other blocks.
 */
export function resizeBlockEdge(blocks, blockId, edge, rawTime) {
  const target = blocks.find((block) => block.id === blockId)
  if (!target) return blocks

  let start = normalizeHour(target.startHour)
  let end = normalizeHour(target.endHour)
  const snapped = snapHour(rawTime)

  if (edge === 'start') start = snapped
  else end = snapped

  if (circularDistance(start, end) < EPS) return blocks
  if (spanHours(start, end) < MIN_BLOCK_HOURS) return blocks

  let list = blocks.filter((block) => block.id !== blockId)
  for (const [a, b] of spanToIntervals(start, end)) {
    list = subtractRange(list, a, b)
  }

  return mergeAdjacentSameColor([
    ...list,
    {
      id: blockId,
      startHour: start,
      endHour: end,
      color: target.color,
    },
  ])
}

export function formatClockLabel(hour24) {
  const h = Math.floor(normalizeHour(hour24)) % 12
  return String(h === 0 ? 12 : h)
}

export function formatBlockRange(startHour, endHour) {
  const lastHour =
    Math.abs(spanHours(startHour, endHour) - HOURS_PER_DAY) < EPS
      ? (Math.floor(normalizeHour(startHour)) + HOURS_PER_DAY - 1) % HOURS_PER_DAY
      : Math.floor(normalizeHour(endHour - EPS))
  return `${formatClockLabel(startHour)}–${formatClockLabel(lastHour)}`
}

export function createBlockId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createStickerId(prefix = 'sticker') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createEmptyDay(weekdayId = 'mon') {
  return {
    id: createStickerId('day'),
    weekdayId,
    blocks: [],
    stickers: [],
  }
}

export function createInitialWeek() {
  return [createEmptyDay('mon')]
}

export function getStickerBounds(sticker, canvasSize, aspect = 1) {
  const width = canvasSize * sticker.sizeRatio
  const height = width * aspect
  const cx = sticker.nx * canvasSize
  const cy = sticker.ny * canvasSize
  return {
    left: cx - width / 2,
    top: cy - height / 2,
    width,
    height,
    right: cx + width / 2,
    bottom: cy + height / 2,
    cx,
    cy,
  }
}

/** Corner handle positions for a sticker (NW/NE/SW/SE). */
export function getStickerHandles(sticker, canvasSize, aspect = 1) {
  const box = getStickerBounds(sticker, canvasSize, aspect)
  return {
    nw: { x: box.left, y: box.top },
    ne: { x: box.right, y: box.top },
    sw: { x: box.left, y: box.bottom },
    se: { x: box.right, y: box.bottom },
  }
}

export function hitTestStickerHandle(
  x,
  y,
  sticker,
  canvasSize,
  aspect = 1,
  hitRadius = 10,
) {
  const handles = getStickerHandles(sticker, canvasSize, aspect)
  for (const [corner, point] of Object.entries(handles)) {
    if (Math.hypot(x - point.x, y - point.y) <= hitRadius) {
      return corner
    }
  }
  return null
}

/**
 * Uniform sizeRatio from pointer distance to sticker center (aspect locked).
 */
export function sizeRatioFromPointer(x, y, sticker, canvasSize, aspect = 1) {
  const cx = sticker.nx * canvasSize
  const cy = sticker.ny * canvasSize
  const halfW = Math.max(
    Math.abs(x - cx),
    Math.abs(y - cy) / Math.max(aspect, 0.01),
  )
  return (halfW * 2) / canvasSize
}

export function hitTestSticker(x, y, stickers, canvasSize, getAspect) {
  for (let i = stickers.length - 1; i >= 0; i -= 1) {
    const sticker = stickers[i]
    const aspect = getAspect?.(sticker) ?? 1
    const box = getStickerBounds(sticker, canvasSize, aspect)
    if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
      return sticker
    }
  }
  return null
}
