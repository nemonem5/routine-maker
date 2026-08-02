import { useEffect, useRef } from 'react'
import { TOOLS } from '../../constants/planner'
import {
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
 * Paint: click hour to fill; drag a block edge to invade neighboring time.
 */
export default function PlannerCanvas({
  size,
  blocks,
  stickers,
  imageCache,
  imageVersion,
  selectedStickerId,
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
  onHourHover,
  onEdgeHover,
  onResizeBlockEdge,
  onPlaceSticker,
  onSelectSticker,
  onMoveSticker,
  onResizeSticker,
  onRemoveSticker,
}) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const pendingPaintRef = useRef(null)

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

    drawPlanner(ctx, size, {
      blocks,
      stickers,
      imageCache,
      selectedStickerId,
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
    selectedStickerId,
    previewRange,
    previewColor,
    rangeStart,
    pageBackground,
    ringStroke,
  ])

  function pointerPos(event) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
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
      const selected = stickers.find((item) => item.id === selectedStickerId)
      if (selected) {
        const corner = hitTestStickerHandle(
          x,
          y,
          selected,
          size,
          stickerAspect(selected),
        )
        if (corner) {
          dragRef.current = {
            kind: 'sticker-resize',
            id: selected.id,
            aspect: stickerAspect(selected),
          }
          canvasRef.current?.setPointerCapture?.(event.pointerId)
          return
        }
      }

      if (hit) {
        onSelectSticker?.(hit.id)
        dragRef.current = {
          kind: 'sticker',
          id: hit.id,
          offsetX: x - hit.nx * size,
          offsetY: y - hit.ny * size,
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

    if (tool === TOOLS.erase && hit) {
      onRemoveSticker?.(hit.id)
      return
    }

    if (tool === TOOLS.paint || tool === TOOLS.erase) {
      onSelectSticker?.(null)

      if (tool === TOOLS.paint) {
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
        return
      }

      onHourClick?.(hitTestHour(x, y, layout))
    }
  }

  function handlePointerMove(event) {
    if (!interactive) return

    const { x, y } = pointerPos(event)
    const layout = getPlannerLayout(size)
    const drag = dragRef.current

    if (drag?.kind === 'sticker') {
      onMoveSticker?.(
        drag.id,
        (x - drag.offsetX) / size,
        (y - drag.offsetY) / size,
      )
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

    if (tool === TOOLS.sticker && selectedStickerId && !drag) {
      const selected = stickers.find((item) => item.id === selectedStickerId)
      const canvas = canvasRef.current
      if (selected && canvas) {
        const corner = hitTestStickerHandle(
          x,
          y,
          selected,
          size,
          stickerAspect(selected),
        )
        canvas.style.cursor = corner ? 'nwse-resize' : ''
      }
    }
  }

  function endDrag(event) {
    const pending = pendingPaintRef.current
    pendingPaintRef.current = null

    if (pending && !dragRef.current) {
      onHourClick?.(pending.hour)
    }

    if (!dragRef.current) return
    dragRef.current = null
    try {
      canvasRef.current?.releasePointerCapture?.(event.pointerId)
    } catch {
      // ignore
    }
  }

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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  )
}
