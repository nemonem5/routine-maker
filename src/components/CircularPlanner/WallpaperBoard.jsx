import { useEffect, useMemo, useRef, useState } from 'react'
import { ARTBOARD_PREVIEW_MAX, getTheme } from '../../constants/planner'
import { clampPlacement, clampRatio } from '../../utils/wallpaperLayout'
import PlannerCanvas from './PlannerCanvas'

/**
 * Flexible composition board (phone / desktop / square / custom).
 * Placements are normalized; preview size fits the viewport.
 * Supports multi-select (Ctrl/Shift+click), group move, and group resize.
 */
export default function WallpaperBoard({
  days,
  placements,
  theme,
  imageCache,
  imageVersion,
  selectedPlacementIds = [],
  onSelectPlacement,
  onMovePlacements,
  onResizePlacements,
  onBringToFront,
  boardBackgroundSrc = null,
  aspect = 16 / 9,
}) {
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const [frameSize, setFrameSize] = useState({ width: 640, height: 360 })

  useEffect(() => {
    function update() {
      const maxW = Math.min(window.innerWidth - 200, ARTBOARD_PREVIEW_MAX * 1.4)
      const maxH = Math.min(window.innerHeight - 48, ARTBOARD_PREVIEW_MAX)
      let width = maxW
      let height = Math.round(width / aspect)
      if (height > maxH) {
        height = maxH
        width = Math.round(height * aspect)
      }
      setFrameSize({
        width: Math.max(180, width),
        height: Math.max(180, height),
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [aspect])

  const dayMap = useMemo(() => {
    const map = new Map()
    for (const day of days) map.set(day.id, day)
    return map
  }, [days])

  const selectedSet = useMemo(
    () => new Set(selectedPlacementIds),
    [selectedPlacementIds],
  )

  const boardAspect = frameSize.width / frameSize.height

  function pointerPos(event) {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function hitPlacement(x, y) {
    for (let i = placements.length - 1; i >= 0; i -= 1) {
      const item = placements[i]
      const size = item.sizeRatio * frameSize.width
      const cx = item.nx * frameSize.width
      const cy = item.ny * frameSize.height
      if (Math.hypot(x - cx, y - cy) <= size / 2) return item
    }
    return null
  }

  function handlePointerDown(event) {
    const pos = pointerPos(event)
    if (!pos) return
    const hit = hitPlacement(pos.x, pos.y)
    if (!hit) {
      onSelectPlacement?.(null)
      return
    }

    const additive = event.shiftKey || event.ctrlKey || event.metaKey
    if (additive) {
      onSelectPlacement?.(hit.dayId, { additive: true })
      return
    }

    const alreadySelected = selectedSet.has(hit.dayId)
    const groupIds = alreadySelected
      ? selectedPlacementIds.filter((id) =>
          placements.some((item) => item.dayId === id),
        )
      : [hit.dayId]

    if (!alreadySelected) {
      onSelectPlacement?.(hit.dayId)
    }

    onBringToFront?.(hit.dayId)

    const origins = Object.fromEntries(
      groupIds.map((dayId) => {
        const item = placements.find((entry) => entry.dayId === dayId)
        return [dayId, { nx: item.nx, ny: item.ny }]
      }),
    )

    dragRef.current = {
      kind: 'move',
      dayId: hit.dayId,
      groupIds,
      origins,
      originPointerX: pos.x,
      originPointerY: pos.y,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleResizePointerDown(event, dayId) {
    event.preventDefault()
    event.stopPropagation()
    const item = placements.find((entry) => entry.dayId === dayId)
    if (!item) return

    const groupIds = selectedSet.has(dayId)
      ? selectedPlacementIds.filter((id) =>
          placements.some((entry) => entry.dayId === id),
        )
      : [dayId]

    if (!selectedSet.has(dayId)) {
      onSelectPlacement?.(dayId)
    }

    dragRef.current = {
      kind: 'resize',
      dayId,
      groupIds,
      startSizeRatio: item.sizeRatio,
      originX: event.clientX,
      originY: event.clientY,
    }
    frameRef.current?.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const pos = pointerPos(event)
    if (!pos) return

    if (drag.kind === 'move') {
      const dnx = (pos.x - drag.originPointerX) / frameSize.width
      const dny = (pos.y - drag.originPointerY) / frameSize.height
      const updates = drag.groupIds.map((dayId) => {
        const origin = drag.origins[dayId]
        return {
          dayId,
          nx: origin.nx + dnx,
          ny: origin.ny + dny,
        }
      })
      onMovePlacements?.(updates, boardAspect)
      return
    }

    if (drag.kind === 'resize') {
      const delta = Math.max(
        event.clientX - drag.originX,
        event.clientY - drag.originY,
      )
      const nextRatio = clampRatio(
        drag.startSizeRatio + delta / frameSize.width,
      )
      onResizePlacements?.(drag.groupIds, nextRatio, boardAspect)
    }
  }

  function handlePointerUp(event) {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    } catch {
      // ignore
    }
  }

  const bgStyle = boardBackgroundSrc
    ? {
        backgroundImage: `url("${boardBackgroundSrc}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: theme.pageBackground }

  return (
    <div
      ref={frameRef}
      className="wallpaper-board"
      style={{
        width: frameSize.width,
        height: frameSize.height,
        ...bgStyle,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {placements.map((item) => {
        const day = dayMap.get(item.dayId)
        if (!day) return null
        const safe = clampPlacement(item, boardAspect)
        const size = Math.round(safe.sizeRatio * frameSize.width)
        const left = safe.nx * frameSize.width - size / 2
        const top = safe.ny * frameSize.height - size / 2
        const selected = selectedSet.has(item.dayId)
        // Each tile keeps its own last-used palette — never the board's
        // currently-active theme — so arranging tabs painted with
        // different palettes doesn't repaint them all the same color.
        const dayTheme = getTheme(day.themeId)

        return (
          <div
            key={item.dayId}
            className={
              selected
                ? 'wallpaper-board__item is-selected'
                : 'wallpaper-board__item'
            }
            style={{
              width: size,
              height: size,
              left,
              top,
            }}
          >
            <PlannerCanvas
              size={size}
              blocks={day.blocks}
              stickers={day.stickers}
              imageCache={imageCache}
              imageVersion={imageVersion}
              pageBackground={dayTheme.pageBackground}
              ringStroke={dayTheme.ringStroke}
              interactive={false}
            />
            {selected && (
              <button
                type="button"
                className="wallpaper-board__resize"
                aria-label="크기 조절"
                title="크기 조절"
                onPointerDown={(event) =>
                  handleResizePointerDown(event, item.dayId)
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
