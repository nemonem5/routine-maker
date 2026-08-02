import { useEffect, useRef, useState } from 'react'
import {
  COLOR_THEMES,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_PLANNER_TITLE,
  DEFAULT_STICKER_CATEGORY_ID,
  DEFAULT_STICKER_SIZE_RATIO,
  DEFAULT_THEME_ID,
  HOURS_PER_DAY,
  MAX_CANVAS_SIZE,
  MAX_DAYS,
  MAX_STICKER_SIZE_RATIO,
  MIN_CANVAS_SIZE,
  MIN_STICKER_SIZE_RATIO,
  TOOLS,
  WEEKDAYS,
  createEmptyStickerLibrary,
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

function updateActiveDay(days, activeDayId, updater) {
  return days.map((day) => (day.id === activeDayId ? updater(day) : day))
}

function createDefaultLiveState() {
  const days = createInitialWeek()
  const theme = getTheme(DEFAULT_THEME_ID)
  return {
    days,
    activeDayId: days[0].id,
    title: DEFAULT_PLANNER_TITLE,
    themeId: DEFAULT_THEME_ID,
    selectedColor: theme.colors[0],
    customBackgroundSrc: null,
    canvasSize: DEFAULT_CANVAS_SIZE,
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
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  const theme = getTheme(themeId)
  const [tool, setTool] = useState(TOOLS.paint)
  const [selectedColor, setSelectedColor] = useState(theme.colors[0])
  const [rangeStart, setRangeStart] = useState(null)
  const [hoverHour, setHoverHour] = useState(null)
  const [edgeHover, setEdgeHover] = useState(false)
  const [uiHidden, setUiHidden] = useState(false)
  const [customBackgroundSrc, setCustomBackgroundSrc] = useState(null)
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS_SIZE)

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
    setThemeId(project.themeId)
    setSelectedColor(project.selectedColor)
    setCustomBackgroundSrc(project.customBackgroundSrc)
    if (typeof project.canvasSize === 'number') {
      setCanvasSize(
        Math.min(MAX_CANVAS_SIZE, Math.max(MIN_CANVAS_SIZE, project.canvasSize)),
      )
    }
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
      themeId,
      selectedColor,
      customBackgroundSrc,
      canvasSize,
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
    themeId,
    selectedColor,
    customBackgroundSrc,
    canvasSize,
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
    setTool(nextTool)
    resetRange()
    if (nextTool !== TOOLS.sticker) {
      setPendingStickerSrc(null)
    }
    if (nextTool !== TOOLS.sticker && nextTool !== TOOLS.erase) {
      setSelectedStickerId(null)
    }
  }

  function setCustomBackground(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setCustomBackgroundSrc(reader.result)
    reader.readAsDataURL(file)
  }

  function clearCustomBackground() {
    setCustomBackgroundSrc(null)
  }

  function changeTheme(nextThemeId) {
    const next = getTheme(nextThemeId)
    setThemeId(next.id)
    setSelectedColor((prev) =>
      next.colors.includes(prev) ? prev : next.colors[0],
    )
    resetRange()
  }

  function selectDay(dayId) {
    setActiveDayId(dayId)
    resetRange()
    setSelectedStickerId(null)
    setPendingStickerSrc(null)
  }

  function addDay(weekdayId = availableWeekdays[0]?.id) {
    if (days.length >= MAX_DAYS || !weekdayId) return
    if (usedWeekdays.has(weekdayId)) return

    const next = createEmptyDay(weekdayId)
    setDays((prev) => [...prev, next])
    selectDay(next.id)
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
    resetRange()
    setSelectedStickerId(null)
    setPendingStickerSrc(null)
  }

  function setDayWeekday(dayId, weekdayId) {
    if (usedWeekdays.has(weekdayId) && activeDay?.weekdayId !== weekdayId) {
      return
    }

    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, weekdayId } : day,
      ),
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

  function resizeCanvas(nextSize) {
    setCanvasSize(
      Math.min(MAX_CANVAS_SIZE, Math.max(MIN_CANVAS_SIZE, Math.round(nextSize))),
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

    if (tool === TOOLS.erase) {
      removeBlockAtHour(hour)
      return
    }

    if (tool === TOOLS.paint) {
      setDays((prev) =>
        updateActiveDay(prev, resolvedActiveDayId, (day) => ({
          ...day,
          blocks: paintHourSlot(day.blocks, hour, selectedColor),
        })),
      )
    }
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
    canvasSize,
    resizeCanvas,
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
