import { useEffect, useMemo, useRef, useState } from 'react'
import {
  APP_MODES,
  MIN_BACKGROUND_SIZE,
  PLANNER_SIZE,
} from '../../constants/planner'
import { exportWallpaperPng } from '../../utils/exportWallpaper'
import PlannerCanvas from './PlannerCanvas'
import PlannerToolbar, { TutorialOverlay } from './PlannerToolbar'
import WallpaperBoard from './WallpaperBoard'
import { usePlannerState } from './usePlannerState'
import { useStickerImages } from './useStickerImages'
import './CircularPlanner.css'

const TOOLBAR_OFFSET_KEY = 'routine-maker-toolbar-offset'

function readStoredToolbarOffset() {
  try {
    const raw = localStorage.getItem(TOOLBAR_OFFSET_KEY)
    if (!raw) return { x: 0, y: 0 }
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.x === 'number' &&
      typeof parsed?.y === 'number' &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y }
    }
  } catch {
    // ignore corrupt storage
  }
  return { x: 0, y: 0 }
}

function clampToolbarOffset(x, y, visualLeft, visualTop, width, height, scale) {
  const safeScale = scale > 0 ? scale : 1
  const maxLeft = Math.max(0, window.innerWidth - width)
  const maxTop = Math.max(0, window.innerHeight - height)
  const nextLeft = Math.min(maxLeft, Math.max(0, visualLeft))
  const nextTop = Math.min(maxTop, Math.max(0, visualTop))
  return {
    x: x + (nextLeft - visualLeft) / safeScale,
    y: y + (nextTop - visualTop) / safeScale,
  }
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

function IconModeEdit() {
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
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5 17.5 10.5" />
    </svg>
  )
}

function IconModeLayout() {
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
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export default function CircularPlanner() {
  const {
    days,
    activeDayId,
    selectDay,
    addDay,
    renameDay,
    removeDay,
    setDayWeekday,
    blocks,
    stickers,
    theme,
    themes,
    themeId,
    changeTheme,
    tool,
    setTool,
    selectedColor,
    setSelectedColor,
    rangeStart,
    previewRange,
    handleHourClick,
    handleHourDoubleClick,
    handleHourHover,
    resetRange,
    uiHidden,
    toggleUiHidden,
    customBackgroundSrc,
    setCustomBackground,
    clearCustomBackground,
    backgroundSize,
    resizeBackground,
    backgroundOpacity,
    setBackgroundOpacity,
    appMode,
    setMode,
    artboardPresetId,
    artboardAspect,
    customAspectW,
    customAspectH,
    setArtboardPreset,
    setCustomAspect,
    wallpaperPlacements,
    selectedWallpaperDayIds,
    selectWallpaperPlacement,
    toggleWallpaperDay,
    autoArrangeWallpaper,
    moveWallpaperPlacements,
    bringWallpaperToFront,
    resizeWallpaperPlacements,
    saveProjectFile,
    loadProjectFromFile,
    stickerCategories,
    activeCategoryId,
    setActiveCategoryId,
    stickerLibrary,
    pendingStickerSrc,
    setPendingStickerSrc,
    selectedStickerIds,
    selectSticker,
    addLibraryStickers,
    removeLibraryItem,
    addStickerCategory,
    removeStickerCategory,
    renameStickerCategory,
    placeSticker,
    moveStickers,
    resizeSticker,
    rotateSticker,
    removeStickers,
    copySelectedSticker,
    pasteSticker,
    undo,
    redo,
    handleResizeBlockEdge,
    edgeHover,
    setEdgeHover,
  } = usePlannerState()

  const [bgEditMode, setBgEditMode] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const stageRef = useRef(null)
  const bgDragRef = useRef(null)
  const toolbarRef = useRef(null)
  const toolbarDragRef = useRef(null)
  const [toolbarOffset, setToolbarOffset] = useState(() => readStoredToolbarOffset())
  const [toolbarDragging, setToolbarDragging] = useState(false)

  // Keep the stage fitted inside the viewport — like the fixed toolbar,
  // it should never require scrolling, even after resize/reload with a
  // large custom background.
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }))

  useEffect(() => {
    function handleResize() {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Real browser page zoom (Ctrl +/-, pinch-zoom, etc.) uniformly magnifies
  // every CSS pixel — there is no way to exempt one element from that except
  // by detecting the zoom level and applying the inverse as a transform.
  // devicePixelRatio moves in lockstep with page zoom (relative to whatever
  // it was when the page first loaded), so we use that ratio to keep the
  // toolbar/chrome dock a constant *physical* size while the schedule
  // canvas is free to shrink/grow with zoom exactly like normal content.
  const baselineDprRef = useRef(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  )
  const [uiScale, setUiScale] = useState(1)

  useEffect(() => {
    function readZoom() {
      const dpr = window.devicePixelRatio || 1
      const zoom = dpr / baselineDprRef.current
      // Wide clamp so extreme zoom (well below 50%, well above 300%) still
      // gets fully compensated instead of only partially — a half-hearted
      // correction is what made the dock look "still tiny/huge" before.
      const inverse = Math.min(5, Math.max(1 / 6, 1 / zoom))
      setUiScale(inverse)
    }

    readZoom()
    let mql = null
    function watchNextStep() {
      const dpr = window.devicePixelRatio || 1
      mql?.removeEventListener?.('change', handleChange)
      mql = window.matchMedia(`(resolution: ${dpr}dppx)`)
      mql.addEventListener('change', handleChange)
    }
    function handleChange() {
      readZoom()
      watchNextStep()
    }
    watchNextStep()
    window.addEventListener('resize', readZoom)
    return () => {
      mql?.removeEventListener?.('change', handleChange)
      window.removeEventListener('resize', readZoom)
    }
  }, [])

  // Separate from the zoom compensation above: when the browser *window*
  // itself is narrow (not zoomed), the dock is still allowed to shrink a
  // little — otherwise it eats a huge share of a small window. This is a
  // plain window-width lookup, independent of uiScale, and multiplies into
  // it below. A floor keeps it from ever getting cramped/illegible.
  const WINDOW_UI_FULL_WIDTH = 900
  const WINDOW_UI_MIN_WIDTH = 480
  const WINDOW_UI_FLOOR = 0.72
  const windowUiScale = (() => {
    const w = viewportSize.width
    if (w >= WINDOW_UI_FULL_WIDTH) return 1
    if (w <= WINDOW_UI_MIN_WIDTH) return WINDOW_UI_FLOOR
    const t =
      (w - WINDOW_UI_MIN_WIDTH) / (WINDOW_UI_FULL_WIDTH - WINDOW_UI_MIN_WIDTH)
    return WINDOW_UI_FLOOR + t * (1 - WINDOW_UI_FLOOR)
  })()
  const dockScale = uiScale * windowUiScale

  useEffect(() => {
    if (!toolbarRef.current) return
    setToolbarOffset((prev) => {
      if (prev.x === 0 && prev.y === 0) return prev
      const rect = toolbarRef.current.getBoundingClientRect()
      const next = clampToolbarOffset(
        prev.x,
        prev.y,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        dockScale,
      )
      if (next.x === prev.x && next.y === prev.y) return prev
      persistToolbarOffset(next)
      return next
    })
  }, [viewportSize.width, viewportSize.height, dockScale])

  function persistToolbarOffset(next) {
    try {
      localStorage.setItem(TOOLBAR_OFFSET_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  function handleToolbarDragPointerDown(event) {
    if (event.button != null && event.button !== 0) return
    const el = toolbarRef.current
    if (!el) return
    event.preventDefault()
    const rect = el.getBoundingClientRect()
    setToolbarDragging(true)
    toolbarDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: toolbarOffset.x,
      originY: toolbarOffset.y,
      visualLeft: rect.left,
      visualTop: rect.top,
      width: rect.width,
      height: rect.height,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleToolbarDragPointerMove(event) {
    const drag = toolbarDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const screenDx = event.clientX - drag.startX
    const screenDy = event.clientY - drag.startY
    const proposedLeft = drag.visualLeft + screenDx
    const proposedTop = drag.visualTop + screenDy
    const next = clampToolbarOffset(
      drag.originX + screenDx / dockScale,
      drag.originY + screenDy / dockScale,
      proposedLeft,
      proposedTop,
      drag.width,
      drag.height,
      dockScale,
    )
    setToolbarOffset(next)
  }

  function handleToolbarDragPointerUp(event) {
    const drag = toolbarDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    toolbarDragRef.current = null
    setToolbarDragging(false)
    setToolbarOffset((prev) => {
      persistToolbarOffset(prev)
      return prev
    })
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  function handleToolbarDragDoubleClick() {
    toolbarDragRef.current = null
    setToolbarDragging(false)
    const reset = { x: 0, y: 0 }
    setToolbarOffset(reset)
    persistToolbarOffset(reset)
  }

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

  useEffect(() => {
    function onKeyDown(event) {
      if (uiHidden) return
      const tag = document.activeElement?.tagName
      const inField = tag === 'INPUT' || tag === 'TEXTAREA'
      const mod = event.ctrlKey || event.metaKey

      if (mod && !event.altKey && !inField) {
        const key = event.key.toLowerCase()
        if (key === 'z' && !event.shiftKey) {
          if (undo()) event.preventDefault()
          return
        }
        if (key === 'y' || (key === 'z' && event.shiftKey)) {
          if (redo()) event.preventDefault()
          return
        }
        if (key === 'a' && appMode === APP_MODES.wallpaper) {
          event.preventDefault()
          selectWallpaperPlacement(wallpaperPlacements.map((item) => item.dayId))
          return
        }
        if (appMode === APP_MODES.edit) {
          if (key === 'c') {
            if (copySelectedSticker()) event.preventDefault()
            return
          }
          if (key === 'v') {
            if (pasteSticker()) event.preventDefault()
            return
          }
        }
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (inField) return
        if (selectedStickerIds.length) {
          event.preventDefault()
          removeStickers(selectedStickerIds)
        }
      }
      if (event.key === 'Escape') {
        selectSticker(null)
        setPendingStickerSrc(null)
        selectWallpaperPlacement(null)
        setBgEditMode(false)
        resetRange()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    uiHidden,
    appMode,
    selectedStickerIds,
    removeStickers,
    copySelectedSticker,
    pasteSticker,
    undo,
    redo,
    selectWallpaperPlacement,
    wallpaperPlacements,
    selectSticker,
    setPendingStickerSrc,
    resetRange,
  ])

  function handleToolChange(nextTool) {
    setBgEditMode(false)
    setTool(nextTool)
  }

  function handleModeChange(nextMode) {
    setBgEditMode(false)
    setMode(nextMode)
  }

  const [transparentExport, setTransparentExport] = useState(false)

  async function handleExportWallpaperPng() {
    try {
      await exportWallpaperPng({
        aspect: artboardAspect,
        placements: wallpaperPlacements,
        days,
        theme,
        imageCache,
        backgroundSrc: customBackgroundSrc,
        transparentBg: transparentExport,
      })
    } catch {
      // ignore export failures (e.g. blocked download)
    }
  }

  function handleEnterBgEdit() {
    setBgEditMode(true)
    // Background edit is exclusive: painting/sticker placement are already
    // disabled (PlannerCanvas gets interactive=false), so drop any leftover
    // selection/preview state instead of leaving stale handles on screen.
    resetRange()
    selectSticker(null)
    setPendingStickerSrc(null)
  }

  function handleClearBackground() {
    clearCustomBackground()
    setBgEditMode(false)
  }

  const stageSize = Math.max(backgroundSize, PLANNER_SIZE)
  // Reserve a little breathing room from the viewport edges.
  const STAGE_VIEW_PADDING = 24
  // The toolbar dock is a constant *physical* size (see the zoom-detection
  // effect above) — its footprint in the current viewport's CSS-pixel
  // space grows/shrinks with `uiScale`, the same factor counter-scaling it.
  // Carving exactly that much out of the stage's fit area guarantees the
  // canvas never renders underneath the dock, at any zoom level or window
  // size. (132px card + rail padding + breathing room, at 100% zoom. This
  // is a single constant — the dock's own width never varies by viewport,
  // so the reserved space shouldn't either, or the canvas would visibly
  // jump sideways whenever that changed.)
  const UI_DOCK_WIDTH_BASE = 220
  const UI_DOCK_WIDTH = UI_DOCK_WIDTH_BASE * dockScale
  // Never shrink the stage below this on-screen size — a little vertical
  // scroll in extreme cases beats an illegibly tiny planner. This floor
  // only ever relaxes the *height* limit: the *width* limit (the dock) is
  // a hard cap with no exceptions, otherwise the canvas can grow out from
  // underneath a counter-scaled dock at high zoom.
  const MIN_STAGE_DISPLAY = 360
  const widthLimitScale =
    (viewportSize.width - STAGE_VIEW_PADDING * 2 - UI_DOCK_WIDTH) / stageSize
  const heightLimitScale =
    (viewportSize.height - STAGE_VIEW_PADDING * 2) / stageSize
  const stageFitScale = Math.min(
    1,
    widthLimitScale,
    Math.max(heightLimitScale, Math.min(1, MIN_STAGE_DISPLAY / stageSize)),
  )
  // Render the canvas natively at the size it's actually displayed at,
  // instead of always drawing a fixed PLANNER_SIZE bitmap and CSS-shrinking
  // it with `transform: scale()`. A shrunk bitmap can't thin its strokes
  // below roughly one device pixel, so hairline rings/dividers stop
  // shrinking proportionally and look disproportionately thick once the
  // window gets small — this is what made the ring "actually thicker" at
  // small sizes. Drawing at the true final size lets `drawPlanner`'s own
  // scale-aware stroke widths (see drawPlanner.js) do the job correctly.
  // Two different boxes can be involved: the background square (up to
  // `stageSize` if the user enlarged a custom background) and the circle
  // itself, which always stays at its own `PLANNER_SIZE` ratio within that
  // square — so each gets its own displayed size at the same fit scale.
  const stageDisplaySize = Math.max(1, Math.round(stageSize * stageFitScale))
  const plannerDisplaySize = Math.max(
    1,
    Math.round(PLANNER_SIZE * stageFitScale),
  )

  function handleBgResizePointerDown(event) {
    event.preventDefault()
    event.stopPropagation()
    bgDragRef.current = {
      originX: event.clientX,
      originY: event.clientY,
      originSize: backgroundSize,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleBgResizePointerMove(event) {
    const drag = bgDragRef.current
    if (!drag) return
    const delta = Math.max(
      event.clientX - drag.originX,
      event.clientY - drag.originY,
    )
    resizeBackground(
      Math.max(MIN_BACKGROUND_SIZE, drag.originSize + delta / stageFitScale),
    )
  }

  function handleBgResizePointerUp(event) {
    if (!bgDragRef.current) return
    bgDragRef.current = null
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    } catch {
      // ignore
    }
  }

  const bgStyle = {
    backgroundColor: theme.pageBackground,
    ...(customBackgroundSrc
      ? {
          backgroundImage: `url("${customBackgroundSrc}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: backgroundOpacity,
        }
      : null),
  }
  const isWallpaper = appMode === APP_MODES.wallpaper

  return (
    <div className={uiHidden ? 'circular-planner is-ui-hidden' : 'circular-planner'}>
      <div
        className="circular-planner__workspace"
        style={{ paddingRight: UI_DOCK_WIDTH }}
      >
        {isWallpaper ? (
          <WallpaperBoard
            days={days}
            placements={wallpaperPlacements}
            theme={theme}
            imageCache={imageCache}
            imageVersion={imageVersion}
            selectedPlacementIds={uiHidden ? [] : selectedWallpaperDayIds}
            onSelectPlacement={selectWallpaperPlacement}
            onMovePlacements={moveWallpaperPlacements}
            onResizePlacements={resizeWallpaperPlacements}
            onBringToFront={bringWallpaperToFront}
            boardBackgroundSrc={customBackgroundSrc}
            aspect={artboardAspect}
          />
        ) : (
      <div
        className="circular-planner__stage-fit"
        style={{ width: stageDisplaySize, height: stageDisplaySize }}
      >
      <div
        ref={stageRef}
        className={[
          'circular-planner__stage',
          edgeHover ? 'is-edge-hover' : '',
          bgEditMode ? 'is-bg-edit' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          width: stageDisplaySize,
          height: stageDisplaySize,
        }}
      >
        <div className="circular-planner__bg" style={bgStyle} aria-hidden="true" />
        <PlannerCanvas
          size={plannerDisplaySize}
          blocks={blocks}
          stickers={stickers}
          imageCache={imageCache}
          imageVersion={imageVersion}
          selectedStickerIds={uiHidden ? [] : selectedStickerIds}
          previewRange={uiHidden ? null : previewRange}
          previewColor={selectedColor}
          rangeStart={uiHidden ? null : rangeStart}
          pageBackground={theme.pageBackground}
          ringStroke={theme.ringStroke}
          tool={tool}
          pendingStickerSrc={pendingStickerSrc}
          interactive={!uiHidden && !bgEditMode}
          onHourClick={handleHourClick}
          onHourDoubleClick={handleHourDoubleClick}
          onHourHover={handleHourHover}
          onEdgeHover={setEdgeHover}
          onResizeBlockEdge={handleResizeBlockEdge}
          onPlaceSticker={placeSticker}
          onSelectSticker={selectSticker}
          onMoveStickers={moveStickers}
          onResizeSticker={resizeSticker}
          onRotateSticker={rotateSticker}
        />
        {!uiHidden && bgEditMode && (
          <button
            type="button"
            className="canvas-resize-handle"
            aria-label="배경 영역 크기 조절"
            title="드래그해서 배경만 크기 조절"
            onPointerDown={handleBgResizePointerDown}
            onPointerMove={handleBgResizePointerMove}
            onPointerUp={handleBgResizePointerUp}
            onPointerCancel={handleBgResizePointerUp}
          />
        )}
      </div>
      </div>
        )}
      </div>

      <div
        className="planner-ui-rail"
        style={{
          '--ui-zoom-scale': dockScale,
          '--toolbar-x': `${toolbarOffset.x}px`,
          '--toolbar-y': `${toolbarOffset.y}px`,
        }}
      >
      <div className="planner-chrome">
        <button
          type="button"
          className="planner-ui-toggle"
          aria-label={uiHidden ? 'UI 보이기' : 'UI 숨기기'}
          title={uiHidden ? 'UI 보이기' : 'UI 숨기기'}
          onClick={toggleUiHidden}
        >
          <IconEye crossed={uiHidden} />
        </button>
        {!uiHidden && (
          <div className="planner-mode-switch" role="group" aria-label="모드">
            <button
              type="button"
              className={
                !isWallpaper
                  ? 'planner-mode-switch__btn is-active'
                  : 'planner-mode-switch__btn'
              }
              aria-label="편집"
              title="편집"
              onClick={() => handleModeChange(APP_MODES.edit)}
            >
              <IconModeEdit />
            </button>
            <button
              type="button"
              className={
                isWallpaper
                  ? 'planner-mode-switch__btn is-active'
                  : 'planner-mode-switch__btn'
              }
              aria-label="배치"
              title="배치"
              onClick={() => handleModeChange(APP_MODES.wallpaper)}
            >
              <IconModeLayout />
            </button>
          </div>
        )}
      </div>

      {!uiHidden && (
        <PlannerToolbar
          tool={tool}
          onToolChange={handleToolChange}
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
          onSelectDay={selectDay}
          onAddDay={addDay}
          onRemoveDay={removeDay}
          onChangeWeekday={setDayWeekday}
          onRenameDay={renameDay}
          customBackgroundSrc={customBackgroundSrc}
          bgEditMode={bgEditMode}
          onEnterBgEdit={handleEnterBgEdit}
          onSetCustomBackground={(file) => {
            setCustomBackground(file)
            setBgEditMode(true)
          }}
          backgroundOpacity={backgroundOpacity}
          onBackgroundOpacityChange={setBackgroundOpacity}
          onClearBackground={handleClearBackground}
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
          selectedStickerIds={selectedStickerIds}
          onDeleteSelected={() =>
            selectedStickerIds.length && removeStickers(selectedStickerIds)
          }
          appMode={appMode}
          wallpaperDayIds={wallpaperPlacements.map((item) => item.dayId)}
          onToggleWallpaperDay={toggleWallpaperDay}
          onAutoArrangeWallpaper={autoArrangeWallpaper}
          artboardPresetId={artboardPresetId}
          onArtboardPresetChange={setArtboardPreset}
          customAspectW={customAspectW}
          customAspectH={customAspectH}
          onCustomAspectChange={setCustomAspect}
          onExportWallpaperPng={handleExportWallpaperPng}
          transparentExport={transparentExport}
          onToggleTransparentExport={() => setTransparentExport((prev) => !prev)}
          toolbarWrapRef={toolbarRef}
          toolbarDragging={toolbarDragging}
          onToolbarDragPointerDown={handleToolbarDragPointerDown}
          onToolbarDragPointerMove={handleToolbarDragPointerMove}
          onToolbarDragPointerUp={handleToolbarDragPointerUp}
          onToolbarDragDoubleClick={handleToolbarDragDoubleClick}
          onOpenTutorial={() => setTutorialOpen(true)}
        />
      )}
      </div>
      <TutorialOverlay
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </div>
  )
}
