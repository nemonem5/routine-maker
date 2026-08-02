import { useEffect, useRef, useState } from 'react'
import {
  APP_MODES,
  COLOR_THEMES,
  DEFAULT_ARTBOARD_PRESET,
  DEFAULT_BACKGROUND_SIZE,
  DEFAULT_CUSTOM_ASPECT_H,
  DEFAULT_CUSTOM_ASPECT_W,
  DEFAULT_CUSTOM_DAY_LABEL,
  DEFAULT_PLANNER_TITLE,
  DEFAULT_STICKER_CATEGORY_ID,
  DEFAULT_STICKER_SIZE_RATIO,
  DEFAULT_THEME_ID,
  HOURS_PER_DAY,
  MAX_CUSTOM_DAY_LABEL_LENGTH,
  MAX_DAYS,
  MAX_STICKER_SIZE_RATIO,
  MIN_BACKGROUND_SIZE,
  MIN_STICKER_SIZE_RATIO,
  TOOLS,
  WEEKDAYS,
  clampAspectSide,
  createEmptyStickerLibrary,
  resolveArtboardAspect,
  resolveArtboardPresetId,
  getTheme,
} from '../../constants/planner'
import {
  createInitialWeek,
  createEmptyDay,
  createStickerId,
  eraseHourSlot,
  paintHourSlot,
  resizeBlockEdge,
} from '../../utils/canvasGeometry'
import { toneFromBackground } from '../../utils/color'
import {
  downloadProjectFile,
  loadProjectFromLocalStorage,
  readProjectFile,
  saveProjectToLocalStorage,
  serializeProject,
} from '../../utils/plannerStorage'
import {
  autoLayoutWallpaper,
  clampPlacement,
} from '../../utils/wallpaperLayout'

function updateActiveDay(days, activeDayId, updater) {
  return days.map((day) => (day.id === activeDayId ? updater(day) : day))
}

function createDefaultLiveState() {
  const days = createInitialWeek()
  return {
    days,
    activeDayId: days[0].id,
    title: DEFAULT_PLANNER_TITLE,
    customBackgroundSrc: null,
    backgroundSize: DEFAULT_BACKGROUND_SIZE,
    appMode: APP_MODES.edit,
    artboardPresetId: DEFAULT_ARTBOARD_PRESET,
    customAspectW: DEFAULT_CUSTOM_ASPECT_W,
    customAspectH: DEFAULT_CUSTOM_ASPECT_H,
    wallpaperPlacements: [],
    stickerCategories: createEmptyStickerLibrary(),
    activeCategoryId: DEFAULT_STICKER_CATEGORY_ID,
  }
}

/**
 * Week + active day state: blocks, stickers, tools, UI chrome.
 */
export function usePlannerState() {
  const restoredRef = useRef(false)
  const [days, setDays] = useState(createInitialWeek)
  const [activeDayId, setActiveDayId] = useState(null)
  const [title, setTitle] = useState(DEFAULT_PLANNER_TITLE)
  const [tool, setTool] = useState(TOOLS.paint)
  const [rangeStart, setRangeStart] = useState(null)
  const [hoverHour, setHoverHour] = useState(null)
  const [edgeHover, setEdgeHover] = useState(false)
  const [uiHidden, setUiHidden] = useState(false)
  const [customBackgroundSrc, setCustomBackgroundSrc] = useState(null)
  const [backgroundSize, setBackgroundSize] = useState(DEFAULT_BACKGROUND_SIZE)
  const [backgroundOpacity, setBackgroundOpacityState] = useState(1)
  const [appMode, setAppMode] = useState(APP_MODES.edit)
  const [artboardPresetId, setArtboardPresetId] = useState(DEFAULT_ARTBOARD_PRESET)
  const [customAspectW, setCustomAspectW] = useState(DEFAULT_CUSTOM_ASPECT_W)
  const [customAspectH, setCustomAspectH] = useState(DEFAULT_CUSTOM_ASPECT_H)
  const [wallpaperPlacements, setWallpaperPlacements] = useState([])
  const [selectedWallpaperDayId, setSelectedWallpaperDayId] = useState(null)
  const artboardAspect = resolveArtboardAspect(
    artboardPresetId,
    customAspectW,
    customAspectH,
  )

  const [stickerCategories, setStickerCategories] = useState(
    createEmptyStickerLibrary,
  )
  const [activeCategoryId, setActiveCategoryId] = useState(
    DEFAULT_STICKER_CATEGORY_ID,
  )
  const [pendingStickerSrc, setPendingStickerSrc] = useState(null)
  const [selectedStickerId, setSelectedStickerId] = useState(null)

  const resolvedActiveDayId = activeDayId ?? days[0]?.id
  const activeDay =
    days.find((day) => day.id === resolvedActiveDayId) ?? days[0]
  // Per-day, not global: each schedule keeps its own last-used palette, so
  // switching tabs restores whatever that day was painted with instead of
  // whichever theme happened to be active elsewhere.
  const themeId = activeDay?.themeId ?? DEFAULT_THEME_ID
  const theme = getTheme(themeId)
  const selectedColor =
    activeDay?.selectedColor && theme.colors.includes(activeDay.selectedColor)
      ? activeDay.selectedColor
      : theme.colors[0]
  const activeCategory =
    stickerCategories.find((category) => category.id === activeCategoryId) ??
    stickerCategories[0]
  const stickerLibrary = activeCategory?.stickers ?? []

  const usedWeekdays = new Set(days.map((day) => day.weekdayId))
  const availableWeekdays = WEEKDAYS.filter((day) => !usedWeekdays.has(day.id))

  function applyProject(project) {
    setDays(project.days)
    setActiveDayId(project.activeDayId)
    setTitle(project.title)
    setCustomBackgroundSrc(project.customBackgroundSrc)
    if (typeof project.backgroundSize === 'number') {
      setBackgroundSize(
        Math.max(MIN_BACKGROUND_SIZE, Math.round(project.backgroundSize)),
      )
    }
    setBackgroundOpacityState(
      typeof project.backgroundOpacity === 'number'
        ? Math.min(1, Math.max(0, project.backgroundOpacity))
        : 1,
    )
    setAppMode(project.appMode === APP_MODES.wallpaper ? APP_MODES.wallpaper : APP_MODES.edit)
    setArtboardPresetId(resolveArtboardPresetId(project.artboardPresetId))
    setCustomAspectW(
      clampAspectSide(project.customAspectW, DEFAULT_CUSTOM_ASPECT_W),
    )
    setCustomAspectH(
      clampAspectSide(project.customAspectH, DEFAULT_CUSTOM_ASPECT_H),
    )
    setWallpaperPlacements(
      Array.isArray(project.wallpaperPlacements)
        ? project.wallpaperPlacements
        : [],
    )
    setSelectedWallpaperDayId(null)
    setStickerCategories(project.stickerCategories)
    setActiveCategoryId(project.activeCategoryId)
    setPendingStickerSrc(null)
    setSelectedStickerId(null)
    setRangeStart(null)
    setHoverHour(null)
    setTool(TOOLS.paint)
  }

  function getProjectSnapshot() {
    return serializeProject({
      title,
      customBackgroundSrc,
      backgroundSize,
      backgroundOpacity,
      appMode,
      artboardPresetId,
      customAspectW,
      customAspectH,
      wallpaperPlacements,
      activeDayId: resolvedActiveDayId,
      activeCategoryId,
      days,
      stickerCategories,
    })
  }

  // Restore last session once on mount
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const saved = loadProjectFromLocalStorage()
    if (saved) applyProject(saved)
  }, [])

  // Autosave (debounced)
  useEffect(() => {
    if (!restoredRef.current) return undefined
    const timer = window.setTimeout(() => {
      saveProjectToLocalStorage(getProjectSnapshot())
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    days,
    resolvedActiveDayId,
    title,
    customBackgroundSrc,
    backgroundSize,
    backgroundOpacity,
    appMode,
    artboardPresetId,
    customAspectW,
    customAspectH,
    wallpaperPlacements,
    stickerCategories,
    activeCategoryId,
  ])

  useEffect(() => {
    const root = document.documentElement
    const pageBg = theme.pageBackground
    root.style.setProperty('--bg', pageBg)
    root.style.setProperty('--text', toneFromBackground(pageBg))
    // Custom background stays on the planner square only (canvas), not the page.
    root.style.removeProperty('--bg-image')
  }, [theme.pageBackground])

  function saveProjectFile() {
    downloadProjectFile(getProjectSnapshot())
    saveProjectToLocalStorage(getProjectSnapshot())
  }

  async function loadProjectFromFile(file) {
    const project = await readProjectFile(file)
    applyProject(project)
    saveProjectToLocalStorage(serializeProject(project))
  }

  function resetProject() {
    applyProject(createDefaultLiveState())
    saveProjectToLocalStorage(serializeProject(createDefaultLiveState()))
  }

  function resetRange() {
    setRangeStart(null)
    setHoverHour(null)
    setEdgeHover(false)
  }

  function setToolAndReset(nextTool) {
    // Eraser tool removed — double-click a painted cell instead.
    const resolved = nextTool === TOOLS.erase ? TOOLS.paint : nextTool
    setTool(resolved)
    resetRange()
    if (resolved !== TOOLS.sticker) {
      setPendingStickerSrc(null)
      setSelectedStickerId(null)
    }
  }

  function setCustomBackground(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setCustomBackgroundSrc(reader.result)
      setBackgroundOpacityState(1)
    }
    reader.readAsDataURL(file)
  }

  function clearCustomBackground() {
    setCustomBackgroundSrc(null)
    setBackgroundOpacityState(1)
  }

  function setBackgroundOpacity(nextOpacity) {
    setBackgroundOpacityState(Math.min(1, Math.max(0, nextOpacity)))
  }

  function changeTheme(nextThemeId) {
    const next = getTheme(nextThemeId)
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        themeId: next.id,
        selectedColor: next.colors.includes(day.selectedColor)
          ? day.selectedColor
          : next.colors[0],
      })),
    )
    resetRange()
  }

  function setSelectedColor(color) {
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        selectedColor: color,
      })),
    )
  }

  function selectDay(dayId) {
    setActiveDayId(dayId)
    resetRange()
    setSelectedStickerId(null)
    setPendingStickerSrc(null)
  }

  /**
   * Adds the next open weekday, or a blank custom-named day once every
   * weekday is already in use — one button covers both cases.
   */
  function addDay(weekdayId = availableWeekdays[0]?.id) {
    if (days.length >= MAX_DAYS) return
    if (!weekdayId) {
      addCustomDay('')
      return
    }
    if (usedWeekdays.has(weekdayId)) return

    // New tabs start with whatever palette you were just using, so you
    // don't have to re-pick a theme every time you add a day.
    const next = createEmptyDay(weekdayId, '', themeId, selectedColor)
    setDays((prev) => [...prev, next])
    selectDay(next.id)
  }

  /** Add a day tab that isn't tied to a weekday — user picks its name. */
  function addCustomDay(label = '') {
    if (days.length >= MAX_DAYS) return

    const trimmed = label.trim().slice(0, MAX_CUSTOM_DAY_LABEL_LENGTH)
    const next = createEmptyDay(
      null,
      trimmed || DEFAULT_CUSTOM_DAY_LABEL,
      themeId,
      selectedColor,
    )
    setDays((prev) => [...prev, next])
    selectDay(next.id)
  }

  function renameDay(dayId, label) {
    const trimmed =
      typeof label === 'string'
        ? label.slice(0, MAX_CUSTOM_DAY_LABEL_LENGTH)
        : ''
    setDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, label: trimmed } : day)),
    )
  }

  function removeDay(dayId) {
    if (days.length <= 1) return

    setDays((prev) => {
      const next = prev.filter((day) => day.id !== dayId)
      if (activeDayId === dayId) {
        setActiveDayId(next[0].id)
      }
      return next
    })
    setWallpaperPlacements((prev) => prev.filter((item) => item.dayId !== dayId))
    if (selectedWallpaperDayId === dayId) setSelectedWallpaperDayId(null)
    resetRange()
    setSelectedStickerId(null)
    setPendingStickerSrc(null)
  }

  function setDayWeekday(dayId, weekdayId) {
    const current = days.find((day) => day.id === dayId)
    if (!current) return

    // Switching to "custom" — free the weekday and keep/seed a label.
    if (weekdayId == null) {
      setDays((prev) =>
        prev.map((day) =>
          day.id === dayId
            ? {
                ...day,
                weekdayId: null,
                label: day.label?.trim() ? day.label : DEFAULT_CUSTOM_DAY_LABEL,
              }
            : day,
        ),
      )
      return
    }

    if (usedWeekdays.has(weekdayId) && current.weekdayId !== weekdayId) {
      return
    }

    setDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, weekdayId } : day)),
    )
  }

  function removeBlockAtHour(hour) {
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        blocks: eraseHourSlot(day.blocks, hour),
      })),
    )
  }

  function handleResizeBlockEdge(blockId, edge, time) {
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        blocks: resizeBlockEdge(day.blocks, blockId, edge, time),
      })),
    )
  }

  function addLibraryStickers(files, categoryId = activeCategoryId) {
    const list = [...files]
    list.forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        const src = reader.result
        const item = {
          id: createStickerId('lib'),
          src,
          name: file.name,
        }

        setStickerCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? { ...category, stickers: [...category.stickers, item] }
              : category,
          ),
        )
        setTool(TOOLS.sticker)
      }
      reader.readAsDataURL(file)
    })
  }

  function removeLibraryItem(stickerId, categoryId = activeCategoryId) {
    setStickerCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category
        const target = category.stickers.find((item) => item.id === stickerId)
        if (target && pendingStickerSrc === target.src) {
          setPendingStickerSrc(null)
        }
        return {
          ...category,
          stickers: category.stickers.filter((item) => item.id !== stickerId),
        }
      }),
    )
  }

  function addStickerCategory(name = '') {
    const label = typeof name === 'string' ? name : ''
    const id = createStickerId('cat')
    setStickerCategories((prev) => [
      ...prev,
      { id, name: label, stickers: [] },
    ])
    setActiveCategoryId(id)
  }

  function removeStickerCategory(categoryId) {
    if (stickerCategories.length <= 1) return

    setStickerCategories((prev) => {
      const next = prev.filter((category) => category.id !== categoryId)
      if (activeCategoryId === categoryId) {
        setActiveCategoryId(next[0].id)
      }
      return next
    })
  }

  function renameStickerCategory(categoryId, name) {
    setStickerCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, name } : category,
      ),
    )
  }

  function placeSticker(nx, ny, src = pendingStickerSrc) {
    if (!src) return

    const next = {
      id: createStickerId(),
      src,
      nx,
      ny,
      sizeRatio: DEFAULT_STICKER_SIZE_RATIO,
    }

    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        stickers: [...day.stickers, next],
      })),
    )
    setSelectedStickerId(next.id)
    // One placement per drag/select — must pull again to place another
    setPendingStickerSrc(null)
  }

  function moveSticker(id, nx, ny) {
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        stickers: day.stickers.map((sticker) =>
          sticker.id === id
            ? {
                ...sticker,
                nx: Math.min(1, Math.max(0, nx)),
                ny: Math.min(1, Math.max(0, ny)),
              }
            : sticker,
        ),
      })),
    )
  }

  function resizeSticker(id, sizeRatio) {
    const clamped = Math.min(
      MAX_STICKER_SIZE_RATIO,
      Math.max(MIN_STICKER_SIZE_RATIO, sizeRatio),
    )
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        stickers: day.stickers.map((sticker) =>
          sticker.id === id ? { ...sticker, sizeRatio: clamped } : sticker,
        ),
      })),
    )
  }

  function resizeBackground(nextSize) {
    setBackgroundSize(Math.max(MIN_BACKGROUND_SIZE, Math.round(nextSize)))
  }

  function setMode(nextMode) {
    setAppMode(nextMode)
    resetRange()
    setPendingStickerSrc(null)
    setSelectedStickerId(null)
    setSelectedWallpaperDayId(null)
    if (
      nextMode === APP_MODES.wallpaper &&
      wallpaperPlacements.length === 0 &&
      days[0]
    ) {
      setWallpaperPlacements(autoLayoutWallpaper([days[0].id], artboardAspect))
    }
  }

  function setArtboardPreset(presetId) {
    const nextId = resolveArtboardPresetId(presetId)
    setArtboardPresetId(nextId)
    const nextAspect = resolveArtboardAspect(
      nextId,
      customAspectW,
      customAspectH,
    )
    setWallpaperPlacements((prev) => {
      const ids = prev.map((item) => item.dayId)
      if (ids.length === 0) return prev
      return autoLayoutWallpaper(ids, nextAspect)
    })
  }

  function setCustomAspect(nextW, nextH) {
    const w = clampAspectSide(nextW, customAspectW)
    const h = clampAspectSide(nextH, customAspectH)
    setCustomAspectW(w)
    setCustomAspectH(h)
    setArtboardPresetId('custom')
    const nextAspect = resolveArtboardAspect('custom', w, h)
    setWallpaperPlacements((prev) => {
      const ids = prev.map((item) => item.dayId)
      if (ids.length === 0) return prev
      return autoLayoutWallpaper(ids, nextAspect)
    })
  }

  function toggleWallpaperDay(dayId) {
    setWallpaperPlacements((prev) => {
      const exists = prev.some((item) => item.dayId === dayId)
      if (exists) {
        return prev.filter((item) => item.dayId !== dayId)
      }
      const nextIds = [...prev.map((item) => item.dayId), dayId]
      return autoLayoutWallpaper(nextIds, artboardAspect)
    })
    setSelectedWallpaperDayId(dayId)
  }

  function autoArrangeWallpaper() {
    setWallpaperPlacements((prev) => {
      const ids = prev.map((item) => item.dayId)
      if (ids.length === 0 && days[0]) {
        return autoLayoutWallpaper([days[0].id], artboardAspect)
      }
      return autoLayoutWallpaper(ids, artboardAspect)
    })
  }

  function moveWallpaperPlacement(dayId, nx, ny, boardAspect = artboardAspect) {
    setWallpaperPlacements((prev) =>
      prev.map((item) => {
        if (item.dayId !== dayId) return item
        return clampPlacement({ ...item, nx, ny }, boardAspect)
      }),
    )
  }

  function bringWallpaperToFront(dayId) {
    setWallpaperPlacements((prev) => {
      const target = prev.find((item) => item.dayId === dayId)
      if (!target) return prev
      return [...prev.filter((item) => item.dayId !== dayId), target]
    })
  }

  function resizeWallpaperPlacement(dayId, sizeRatio, boardAspect = artboardAspect) {
    setWallpaperPlacements((prev) =>
      prev.map((item) => {
        if (item.dayId !== dayId) return item
        return clampPlacement({ ...item, sizeRatio }, boardAspect)
      }),
    )
  }

  function removeSticker(id) {
    setDays((prev) =>
      updateActiveDay(prev, resolvedActiveDayId, (day) => ({
        ...day,
        stickers: day.stickers.filter((sticker) => sticker.id !== id),
      })),
    )
    if (selectedStickerId === id) setSelectedStickerId(null)
  }

  function handleHourClick(hour) {
    if (tool === TOOLS.sticker) return
    if (hour == null) return

    if (tool === TOOLS.paint) {
      setDays((prev) =>
        updateActiveDay(prev, resolvedActiveDayId, (day) => ({
          ...day,
          blocks: paintHourSlot(day.blocks, hour, selectedColor),
        })),
      )
    }
  }

  /** Double-click a painted hour in paint mode to clear it. */
  function handleHourDoubleClick(hour) {
    if (tool !== TOOLS.paint) return
    if (hour == null) return
    removeBlockAtHour(hour)
  }

  function handleHourHover(hour) {
    if (tool !== TOOLS.paint) {
      setHoverHour(null)
      return
    }
    setHoverHour(hour)
  }

  const previewRange =
    tool === TOOLS.paint && hoverHour != null && !edgeHover
      ? { startHour: hoverHour, endHour: (hoverHour + 1) % HOURS_PER_DAY }
      : null

  return {
    days,
    activeDay,
    activeDayId: resolvedActiveDayId,
    selectDay,
    addDay,
    addCustomDay,
    renameDay,
    removeDay,
    setDayWeekday,
    availableWeekdays,
    blocks: activeDay.blocks,
    stickers: activeDay.stickers,
    title,
    setTitle,
    themeId,
    theme,
    themes: Object.values(COLOR_THEMES),
    changeTheme,
    tool,
    setTool: setToolAndReset,
    selectedColor,
    setSelectedColor,
    rangeStart,
    previewRange,
    handleHourClick,
    handleHourDoubleClick,
    handleHourHover,
    handleResizeBlockEdge,
    edgeHover,
    setEdgeHover,
    resetRange,
    uiHidden,
    toggleUiHidden: () => setUiHidden((v) => !v),
    customBackgroundSrc,
    setCustomBackground,
    clearCustomBackground,
    backgroundOpacity,
    setBackgroundOpacity,
    backgroundSize,
    resizeBackground,
    appMode,
    setMode,
    artboardPresetId,
    artboardAspect,
    customAspectW,
    customAspectH,
    setArtboardPreset,
    setCustomAspect,
    wallpaperPlacements,
    selectedWallpaperDayId,
    setSelectedWallpaperDayId,
    toggleWallpaperDay,
    autoArrangeWallpaper,
    moveWallpaperPlacement,
    bringWallpaperToFront,
    resizeWallpaperPlacement,
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
    saveProjectFile,
    loadProjectFromFile,
    resetProject,
  }
}
