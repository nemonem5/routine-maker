import { useEffect, useRef } from 'react'
import { TOOLS } from '../../constants/planner'
import {
  angleFromPointer,
  getDevicePixelRatio,
  getPlannerLayout,
  hitTestBlockEdge,
  hitTestHour,
  hitTestSticker,
  hitTestStickerHandle,
  hitTestTime,
  sizeRatioFromPointer,
} from '../../utils/canvasGeometry'
import { drawPlanner } from './drawPlanner'

export const STICKER_DRAG_MIME = 'application/x-routine-maker-sticker'

/**
 * HTML5 Canvas surface for the circular planner.
 * Paint: click hour to fill; double-click to clear; drag a block edge to resize.
 */
export default function PlannerCanvas({
  size,
  blocks,
  stickers,
  imageCache,
  imageVersion,
  selectedStickerIds = [],
  previewRange,
  previewColor,
  rangeStart,
  pageBackground,
  ringStroke,
  tool,
  pendingStickerSrc,
  interactive = true,
  backgroundImage = null,
  backgroundVersion = 0,
  onHourClick,
  onHourDoubleClick,
  onHourHover,
  onEdgeHover,
  onResizeBlockEdge,
  onPlaceSticker,
  onSelectSticker,
  onMoveStickers,
  onResizeSticker,
  onRotateSticker,
}) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const pendingPaintRef = useRef(null)
  const paintTimerRef = useRef(null)
  const selectedSet = new Set(selectedStickerIds)
  const primarySelectedId =
    selectedStickerIds[selectedStickerIds.length - 1] ?? null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = getDevicePixelRatio()
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Canvas defaults to imageSmoothingQuality "low", which visibly softens
    // sticker PNGs whenever they're drawn scaled down from their source
    // resolution — bump it up so stickers stay crisp.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    drawPlanner(ctx, size, {
      blocks,
      stickers,
      imageCache,
      selectedStickerIds,
      previewRange,
      previewColor,
      rangeStart,
      pageBackground,
      backgroundImage,
      ringStroke,
    })
  }, [
    size,
    blocks,
    stickers,
    imageCache,
    imageVersion,
    backgroundImage,
    backgroundVersion,
    selectedStickerIds,
    previewRange,
    previewColor,
    rangeStart,
    pageBackground,
    ringStroke,
  ])

  function pointerPos(event) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    // The canvas's rendered box can be smaller/larger than its logical
    // `size` (e.g. the stage is CSS-scaled to fit the viewport), so map
    // client coordinates back into the same coordinate space that
    // getPlannerLayout(size) and every hit-test function expect.
    const scaleX = rect.width / size || 1
    const scaleY = rect.height / size || 1
    return {
      x: (event.clientX - rect.left) / scaleX,
      y: (event.clientY - rect.top) / scaleY,
    }
  }

  function stickerAspect(sticker) {
    const img = imageCache?.get?.(sticker.src)
    if (!img?.naturalWidth) return 1
    return img.naturalHeight / img.naturalWidth
  }

  function handlePointerDown(event) {
    if (!interactive) return

    const { x, y } = pointerPos(event)
    const layout = getPlannerLayout(size)
    const hit = hitTestSticker(x, y, stickers, size, stickerAspect)

    if (tool === TOOLS.sticker) {
      const primary = stickers.find((item) => item.id === primarySelectedId)
      if (primary) {
        const corner = hitTestStickerHandle(
          x,
          y,
          primary,
          size,
          stickerAspect(primary),
        )
        if (corner === 'rotate') {
          dragRef.current = { kind: 'sticker-rotate', id: primary.id }
          canvasRef.current?.setPointerCapture?.(event.pointerId)
          return
        }
        if (corner) {
          dragRef.current = {
            kind: 'sticker-resize',
            id: primary.id,
            aspect: stickerAspect(primary),
          }
          canvasRef.current?.setPointerCapture?.(event.pointerId)
          return
        }
      }

      if (hit) {
        // Shift/Ctrl/Meta+click toggles multi-select without starting a drag.
        const additive = event.shiftKey || event.ctrlKey || event.metaKey
        if (additive) {
          onSelectSticker?.(hit.id, { additive: true })
          return
        }

        const alreadySelected = selectedSet.has(hit.id)
        const groupIds = alreadySelected
          ? selectedStickerIds.filter((id) =>
              stickers.some((item) => item.id === id),
            )
          : [hit.id]

        if (!alreadySelected) {
          onSelectSticker?.(hit.id)
        }

        const origins = Object.fromEntries(
          groupIds.map((id) => {
            const item = stickers.find((entry) => entry.id === id)
            return [id, { nx: item.nx, ny: item.ny }]
          }),
        )

        dragRef.current = {
          kind: 'sticker',
          id: hit.id,
          groupIds,
          origins,
          originPointerX: x,
          originPointerY: y,
        }
        canvasRef.current?.setPointerCapture?.(event.pointerId)
        return
      }

      if (pendingStickerSrc) {
        onPlaceSticker?.(x / size, y / size)
        return
      }

      onSelectSticker?.(null)
      return
    }

    if (tool === TOOLS.paint) {
      onSelectSticker?.(null)

      const edge = hitTestBlockEdge(x, y, blocks, layout)
      if (edge) {
        dragRef.current = {
          kind: 'edge',
          blockId: edge.blockId,
          edge: edge.edge,
        }
        canvasRef.current?.setPointerCapture?.(event.pointerId)
        return
      }

      const hour = hitTestHour(x, y, layout)
      if (hour != null) {
        pendingPaintRef.current = { hour, x, y }
        canvasRef.current?.setPointerCapture?.(event.pointerId)
      }
    }
  }

  function handlePointerMove(event) {
    if (!interactive) return

    const { x, y } = pointerPos(event)
    const layout = getPlannerLayout(size)
    const drag = dragRef.current

    if (drag?.kind === 'sticker') {
      const dx = (x - drag.originPointerX) / size
      const dy = (y - drag.originPointerY) / size
      const updates = drag.groupIds.map((id) => {
        const origin = drag.origins[id]
        return {
          id,
          nx: origin.nx + dx,
          ny: origin.ny + dy,
        }
      })
      onMoveStickers?.(updates)
      return
    }

    if (drag?.kind === 'sticker-resize') {
      const sticker = stickers.find((item) => item.id === drag.id)
      if (sticker) {
        const nextRatio = sizeRatioFromPointer(
          x,
          y,
          sticker,
          size,
          drag.aspect ?? stickerAspect(sticker),
        )
        onResizeSticker?.(drag.id, nextRatio)
      }
      return
    }

    if (drag?.kind === 'sticker-rotate') {
      const sticker = stickers.find((item) => item.id === drag.id)
      if (sticker) {
        let angle = angleFromPointer(x, y, sticker, size)
        // Hold Shift to snap to 15° steps — makes it easy to line stickers
        // up straight/diagonal without fighting free-hand precision.
        if (event.shiftKey) angle = Math.round(angle / 15) * 15
        onRotateSticker?.(drag.id, angle)
      }
      return
    }

    if (drag?.kind === 'edge') {
      const time = hitTestTime(x, y, layout)
      if (time != null) {
        onResizeBlockEdge?.(drag.blockId, drag.edge, time)
      }
      return
    }

    if (pendingPaintRef.current) {
      const pending = pendingPaintRef.current
      const moved = Math.hypot(x - pending.x, y - pending.y)
      if (moved > 6) {
        // Convert a paint press into an edge drag if we slipped onto an edge
        const edge = hitTestBlockEdge(x, y, blocks, layout)
        if (edge) {
          pendingPaintRef.current = null
          dragRef.current = {
            kind: 'edge',
            blockId: edge.blockId,
            edge: edge.edge,
          }
          onResizeBlockEdge?.(edge.blockId, edge.edge, hitTestTime(x, y, layout))
        }
      }
      return
    }

    if (tool === TOOLS.paint) {
      const edge = hitTestBlockEdge(x, y, blocks, layout)
      onEdgeHover?.(Boolean(edge))
      onHourHover?.(edge ? null : hitTestHour(x, y, layout))
    }

    if (tool === TOOLS.sticker && primarySelectedId && !drag) {
      const selected = stickers.find((item) => item.id === primarySelectedId)
      const canvas = canvasRef.current
      if (selected && canvas) {
        const corner = hitTestStickerHandle(
          x,
          y,
          selected,
          size,
          stickerAspect(selected),
        )
        canvas.style.cursor = corner === 'rotate' ? 'grab' : corner ? 'nwse-resize' : ''
      }
    }
  }

  function endDrag(event) {
    const pending = pendingPaintRef.current
    pendingPaintRef.current = null

    if (pending && !dragRef.current) {
      // Delay paint so a double-click can cancel it and clear instead.
      if (paintTimerRef.current) clearTimeout(paintTimerRef.current)
      const hour = pending.hour
      paintTimerRef.current = setTimeout(() => {
        paintTimerRef.current = null
        onHourClick?.(hour)
      }, 220)
    }

    if (!dragRef.current) return
    dragRef.current = null
    try {
      canvasRef.current?.releasePointerCapture?.(event.pointerId)
    } catch {
      // ignore
    }
  }

  function handleDoubleClick(event) {
    if (!interactive || tool !== TOOLS.paint) return
    if (paintTimerRef.current) {
      clearTimeout(paintTimerRef.current)
      paintTimerRef.current = null
    }
    const { x, y } = pointerPos(event)
    const hour = hitTestHour(x, y, getPlannerLayout(size))
    onHourDoubleClick?.(hour)
  }

  useEffect(
    () => () => {
      if (paintTimerRef.current) clearTimeout(paintTimerRef.current)
    },
    [],
  )

  function handlePointerLeave() {
    if (!dragRef.current && !pendingPaintRef.current) {
      onHourHover?.(null)
      onEdgeHover?.(false)
    }
    if (canvasRef.current) canvasRef.current.style.cursor = ''
  }

  function handleDragOver(event) {
    if (!interactive) return
    if (
      !event.dataTransfer.types.includes(STICKER_DRAG_MIME) &&
      !pendingStickerSrc
    ) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(event) {
    if (!interactive) return
    event.preventDefault()

    const { x, y } = pointerPos(event)
    const src =
      event.dataTransfer.getData(STICKER_DRAG_MIME) || pendingStickerSrc
    if (!src) return

    onPlaceSticker?.(x / size, y / size, src)
  }

  return (
    <canvas
      ref={canvasRef}
      className={interactive ? 'planner-canvas' : 'planner-canvas is-preview'}
      role="img"
      aria-label="루틴메이커 원형 시간표"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  )
}
