import {
  DEFAULT_PLANNER_TITLE,
  DEFAULT_STICKER_CATEGORY_ID,
  DEFAULT_THEME_ID,
  MAX_DAYS,
  WEEKDAYS,
  createEmptyStickerLibrary,
  getTheme,
} from '../constants/planner'
import { createEmptyDay, createInitialWeek } from './canvasGeometry'

export const PLANNER_STORAGE_KEY = 'routine-maker-project-v1'
const LEGACY_STORAGE_KEY = 'nemo-planner-project-v1'
export const PLANNER_FILE_VERSION = 1

/**
 * Build a serializable project snapshot from live app state.
 */
export function serializeProject(state) {
  return {
    version: PLANNER_FILE_VERSION,
    savedAt: new Date().toISOString(),
    title: state.title ?? DEFAULT_PLANNER_TITLE,
    themeId: state.themeId ?? DEFAULT_THEME_ID,
    selectedColor: state.selectedColor ?? null,
    customBackgroundSrc: state.customBackgroundSrc ?? null,
    canvasSize:
      typeof state.canvasSize === 'number' ? state.canvasSize : null,
    activeDayId: state.activeDayId ?? null,
    activeCategoryId: state.activeCategoryId ?? DEFAULT_STICKER_CATEGORY_ID,
    days: Array.isArray(state.days) ? state.days : createInitialWeek(),
    stickerCategories: Array.isArray(state.stickerCategories)
      ? state.stickerCategories
      : createEmptyStickerLibrary(),
  }
}

function sanitizeDay(raw, fallbackWeekdayId = 'mon') {
  const weekdayIds = new Set(WEEKDAYS.map((day) => day.id))
  const weekdayId = weekdayIds.has(raw?.weekdayId)
    ? raw.weekdayId
    : fallbackWeekdayId

  return {
    id: typeof raw?.id === 'string' ? raw.id : createEmptyDay(weekdayId).id,
    weekdayId,
    blocks: Array.isArray(raw?.blocks)
      ? raw.blocks
          .filter(
            (block) =>
              block &&
              typeof block.startHour === 'number' &&
              typeof block.endHour === 'number' &&
              typeof block.color === 'string',
          )
          .map((block) => ({
            id: block.id,
            startHour: block.startHour,
            endHour: block.endHour,
            color: block.color,
          }))
      : [],
    stickers: Array.isArray(raw?.stickers)
      ? raw.stickers
          .filter(
            (sticker) =>
              sticker &&
              typeof sticker.src === 'string' &&
              typeof sticker.nx === 'number' &&
              typeof sticker.ny === 'number',
          )
          .map((sticker) => ({
            id: sticker.id,
            src: sticker.src,
            nx: sticker.nx,
            ny: sticker.ny,
            sizeRatio:
              typeof sticker.sizeRatio === 'number' ? sticker.sizeRatio : 0.09,
          }))
      : [],
  }
}

/**
 * Validate + normalize a loaded project into app state fields.
 */
export function parseProject(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project file')
  }

  const themeId =
    typeof raw.themeId === 'string'
      ? getTheme(raw.themeId).id
      : DEFAULT_THEME_ID
  const theme = getTheme(themeId)

  let days = Array.isArray(raw.days)
    ? raw.days.slice(0, MAX_DAYS).map((day, index) =>
        sanitizeDay(day, WEEKDAYS[index % WEEKDAYS.length].id),
      )
    : createInitialWeek()

  if (days.length === 0) days = createInitialWeek()

  // Ensure unique weekdays when possible
  const used = new Set()
  days = days.map((day, index) => {
    if (!used.has(day.weekdayId)) {
      used.add(day.weekdayId)
      return day
    }
    const fallback =
      WEEKDAYS.find((weekday) => !used.has(weekday.id))?.id ??
      WEEKDAYS[index % WEEKDAYS.length].id
    used.add(fallback)
    return { ...day, weekdayId: fallback }
  })

  const stickerCategories = Array.isArray(raw.stickerCategories)
    ? raw.stickerCategories.map((category, index) => ({
        id:
          typeof category?.id === 'string'
            ? category.id
            : `cat-restored-${index}`,
        name: typeof category?.name === 'string' ? category.name : '',
        stickers: Array.isArray(category?.stickers)
          ? category.stickers
              .filter((item) => item && typeof item.src === 'string')
              .map((item, stickerIndex) => ({
                id:
                  typeof item.id === 'string'
                    ? item.id
                    : `lib-restored-${index}-${stickerIndex}`,
                src: item.src,
                name: typeof item.name === 'string' ? item.name : 'sticker',
              }))
          : [],
      }))
    : createEmptyStickerLibrary()

  const safeCategories =
    stickerCategories.length > 0
      ? stickerCategories
      : createEmptyStickerLibrary()

  const activeDayId = days.some((day) => day.id === raw.activeDayId)
    ? raw.activeDayId
    : days[0].id

  const activeCategoryId = safeCategories.some(
    (category) => category.id === raw.activeCategoryId,
  )
    ? raw.activeCategoryId
    : safeCategories[0].id

  const selectedColor =
    typeof raw.selectedColor === 'string' &&
    theme.colors.includes(raw.selectedColor)
      ? raw.selectedColor
      : theme.colors[0]

  return {
    title: typeof raw.title === 'string' ? raw.title : DEFAULT_PLANNER_TITLE,
    themeId,
    selectedColor,
    customBackgroundSrc:
      typeof raw.customBackgroundSrc === 'string'
        ? raw.customBackgroundSrc
        : null,
    canvasSize:
      typeof raw.canvasSize === 'number' && Number.isFinite(raw.canvasSize)
        ? raw.canvasSize
        : null,
    days,
    activeDayId,
    stickerCategories: safeCategories,
    activeCategoryId,
  }
}

export function saveProjectToLocalStorage(project) {
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(project))
    return { ok: true }
  } catch (error) {
    return { ok: false, error }
  }
}

export function loadProjectFromLocalStorage() {
  try {
    const raw =
      localStorage.getItem(PLANNER_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    return parseProject(JSON.parse(raw))
  } catch {
    return null
  }
}

export function downloadProjectFile(project, filename) {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  anchor.href = url
  anchor.download = filename || `루틴메이커-${stamp}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function readProjectFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        resolve(parseProject(parsed))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'))
    reader.readAsText(file)
  })
}
