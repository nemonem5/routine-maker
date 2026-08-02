import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MAX_CANVAS_SIZE,
  MIN_CANVAS_SIZE,
} from '../../constants/planner'
import PlannerCanvas from './PlannerCanvas'
import PlannerToolbar from './PlannerToolbar'
import { usePlannerState } from './usePlannerState'
import { useStickerImages } from './useStickerImages'
import './CircularPlanner.css'

const SIDEBAR_WIDTH = 240

function useBackgroundImage(src) {
  const [image, setImage] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!src) {
      setImage(null)
      return undefined
    }

    let cancelled = false
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      setImage(img)
      setVersion((v) => v + 1)
    }
    img.onerror = () => {
      if (!cancelled) setImage(null)
    }
    img.src = src

    return () => {
      cancelled = true
    }
  }, [src])

  return { backgroundImage: image, backgroundVersion: version }
}

function IconEye({ crossed }) {
  return (
    <svg
      className="planner-ui-toggle__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {crossed && <path d="M5 5 19 19" />}
    </svg>
  )
}

function clampCanvasToViewport(size) {
  const padding = 32
  const sidebar = window.innerWidth > 720 ? SIDEBAR_WIDTH + 28 : 0
  const availableW = window.innerWidth - padding - sidebar
  const availableH = window.innerHeight - padding
  const available = Math.min(availableW, availableH, MAX_CANVAS_SIZE)
  return Math.min(
    Math.max(MIN_CANVAS_SIZE, size),
    Math.max(MIN_CANVAS_SIZE, available),
  )
}

export default function CircularPlanner() {
  const {
    days,
    activeDayId,
    selectDay,
    addDay,
    removeDay,
    setDayWeekday,
    availableWeekdays,
    blocks,
    stickers,
    themeId,
    theme,
    themes,
    changeTheme,
    tool,
    setTool,
    selectedColor,
    setSelectedColor,
    rangeStart,
    previewRange,
    handleHourClick,
    handleHourHover,
    resetRange,
    uiHidden,
    toggleUiHidden,
    customBackgroundSrc,
    setCustomBackground,
    clearCustomBackground,
    canvasSize,
    resizeCanvas,
    saveProjectFile,
    loadProjectFromFile,
    stickerCategories,
    activeCategoryId,
    setActiveCategoryId,
    stickerLibrary,
    pendingStickerSrc,
    setPendingStickerSrc,
    selectedStickerId,
    setSelectedStickerId,
    addLibraryStickers,
    removeLibraryItem,
    addStickerCategory,
    removeStickerCategory,
    renameStickerCategory,
    placeSticker,
    moveSticker,
    resizeSticker,
    removeSticker,
    handleResizeBlockEdge,
    edgeHover,
    setEdgeHover,
  } = usePlannerState()

  const stageRef = useRef(null)
  const canvasDragRef = useRef(null)

  const imageSources = useMemo(() => {
    const fromLibrary = stickerCategories.flatMap((category) =>
      category.stickers.map((item) => item.src),
    )
    const fromPlaced = days.flatMap((day) =>
      day.stickers.map((item) => item.src),
    )
    return [...fromLibrary, ...fromPlaced]
  }, [stickerCategories, days])

  const { imageCache, imageVersion } = useStickerImages(imageSources)
  const { backgroundImage, backgroundVersion } =
    useBackgroundImage(customBackgroundSrc)

  useEffect(() => {
    function onResize() {
      const capped = clampCanvasToViewport(canvasSize)
      if (capped !== canvasSize) resizeCanvas(capped)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [canvasSize, resizeCanvas])

  useEffect(() => {
    function onKeyDown(event) {
      if (uiHidden) return
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        if (selectedStickerId) {
          event.preventDefault()
          removeSticker(selectedStickerId)
        }
      }
      if (event.key === 'Escape') {
        setSelectedStickerId(null)
        setPendingStickerSrc(null)
        resetRange()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    uiHidden,
    selectedStickerId,
    removeSticker,
    setSelectedStickerId,
    setPendingStickerSrc,
    resetRange,
  ])

  function handleCanvasResizePointerDown(event) {
    event.preventDefault()
    event.stopPropagation()
    canvasDragRef.current = {
      originX: event.clientX,
      originY: event.clientY,
      originSize: canvasSize,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleCanvasResizePointerMove(event) {
    const drag = canvasDragRef.current
    if (!drag) return
    const delta = Math.max(
      event.clientX - drag.originX,
      event.clientY - drag.originY,
    )
    resizeCanvas(clampCanvasToViewport(drag.originSize + delta))
  }

  function handleCanvasResizePointerUp(event) {
    if (!canvasDragRef.current) return
    canvasDragRef.current = null
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div className={uiHidden ? 'circular-planner is-ui-hidden' : 'circular-planner'}>
      <button
        type="button"
        className="planner-ui-toggle"
        aria-label={uiHidden ? 'UI 보이기' : 'UI 숨기기'}
        title={uiHidden ? 'UI 보이기' : 'UI 숨기기'}
        onClick={toggleUiHidden}
      >
        <IconEye crossed={uiHidden} />
      </button>

      <div
        ref={stageRef}
        className={
          edgeHover
            ? 'circular-planner__stage is-edge-hover'
            : 'circular-planner__stage'
        }
        style={{ width: canvasSize, height: canvasSize }}
      >
        <PlannerCanvas
          size={canvasSize}
          blocks={blocks}
          stickers={stickers}
          imageCache={imageCache}
          imageVersion={imageVersion}
          backgroundImage={backgroundImage}
          backgroundVersion={backgroundVersion}
          selectedStickerId={uiHidden ? null : selectedStickerId}
          previewRange={uiHidden ? null : previewRange}
          previewColor={selectedColor}
          rangeStart={uiHidden ? null : rangeStart}
          pageBackground={theme.pageBackground}
          ringStroke={theme.ringStroke}
          tool={tool}
          pendingStickerSrc={pendingStickerSrc}
          interactive={!uiHidden}
          onHourClick={handleHourClick}
          onHourHover={handleHourHover}
          onEdgeHover={setEdgeHover}
          onResizeBlockEdge={handleResizeBlockEdge}
          onPlaceSticker={placeSticker}
          onSelectSticker={setSelectedStickerId}
          onMoveSticker={moveSticker}
          onResizeSticker={resizeSticker}
          onRemoveSticker={removeSticker}
        />
        {!uiHidden && (
          <button
            type="button"
            className="canvas-resize-handle"
            aria-label="네모 영역 크기 조절"
            title="드래그해서 크기 조절"
            onPointerDown={handleCanvasResizePointerDown}
            onPointerMove={handleCanvasResizePointerMove}
            onPointerUp={handleCanvasResizePointerUp}
            onPointerCancel={handleCanvasResizePointerUp}
          />
        )}
      </div>

      {!uiHidden && (
        <PlannerToolbar
          tool={tool}
          onToolChange={setTool}
          themes={themes}
          themeId={themeId}
          onThemeChange={changeTheme}
          colors={theme.colors}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          rangeStart={rangeStart}
          onCancelRange={resetRange}
          days={days}
          activeDayId={activeDayId}
          availableWeekdays={availableWeekdays}
          onSelectDay={selectDay}
          onAddDay={addDay}
          onRemoveDay={removeDay}
          onChangeWeekday={setDayWeekday}
          customBackgroundSrc={customBackgroundSrc}
          onSetCustomBackground={setCustomBackground}
          onClearCustomBackground={clearCustomBackground}
          onSaveProject={saveProjectFile}
          onLoadProjectFile={loadProjectFromFile}
          stickerCategories={stickerCategories}
          activeCategoryId={activeCategoryId}
          onActiveCategoryChange={setActiveCategoryId}
          onAddCategory={addStickerCategory}
          onRemoveCategory={removeStickerCategory}
          onRenameCategory={renameStickerCategory}
          stickerLibrary={stickerLibrary}
          pendingStickerSrc={pendingStickerSrc}
          onSelectLibrarySticker={setPendingStickerSrc}
          onAddStickers={addLibraryStickers}
          onRemoveLibraryItem={removeLibraryItem}
          selectedStickerId={selectedStickerId}
          onDeleteSelected={() =>
            selectedStickerId && removeSticker(selectedStickerId)
          }
        />
      )}
    </div>
  )
}
