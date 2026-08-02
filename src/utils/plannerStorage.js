import {
  APP_MODES,
  DEFAULT_CUSTOM_ASPECT_H,
  DEFAULT_CUSTOM_ASPECT_W,
  DEFAULT_CUSTOM_DAY_LABEL,
  DEFAULT_PLANNER_TITLE,
  DEFAULT_STICKER_CATEGORY_ID,
  DEFAULT_THEME_ID,
  MAX_CUSTOM_DAY_LABEL_LENGTH,
  MAX_DAYS,
  WEEKDAYS,
  clampAspectSide,
  createEmptyStickerLibrary,
  getTheme,
  resolveArtboardPresetId,
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
    customBackgroundSrc: state.customBackgroundSrc ?? null,
    backgroundSize:
      typeof state.backgroundSize === 'number'
        ? state.backgroundSize
        : typeof state.canvasSize === 'number'
          ? state.canvasSize
          : null,
    backgroundOpacity:
      typeof state.backgroundOpacity === 'number' ? state.backgroundOpacity : 1,
    appMode: state.appMode ?? APP_MODES.edit,
    artboardPresetId: resolveArtboardPresetId(state.artboardPresetId),
    customAspectW: clampAspectSide(
      state.customAspectW,
      DEFAULT_CUSTOM_ASPECT_W,
    ),
    customAspectH: clampAspectSide(
      state.customAspectH,
      DEFAULT_CUSTOM_ASPECT_H,
    ),
    wallpaperPlacements: Array.isArray(state.wallpaperPlacements)
      ? state.wallpaperPlacements
      : [],
    activeDayId: state.activeDayId ?? null,
    activeCategoryId: state.activeCategoryId ?? DEFAULT_STICKER_CATEGORY_ID,
    days: Array.isArray(state.days) ? state.days : createInitialWeek(),
    stickerCategories: Array.isArray(state.stickerCategories)
      ? state.stickerCategories
      : createEmptyStickerLibrary(),
  }
}

function sanitizeWallpaperPlacements(raw, days) {
  const dayIds = new Set(days.map((day) => day.id))
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.dayId === 'string' &&
        dayIds.has(item.dayId) &&
        typeof item.nx === 'number' &&
        typeof item.ny === 'number' &&
        typeof item.sizeRatio === 'number',
    )
    .map((item) => ({
      dayId: item.dayId,
      nx: item.nx,
      ny: item.ny,
      sizeRatio: item.sizeRatio,
    }))
}

function sanitizeDay(
  raw,
  fallbackWeekdayId = 'mon',
  // Legacy saves (pre-per-day palettes) kept theme/color at the project's
  // top level — fall back to those so old files still restore correctly.
  legacyThemeId = DEFAULT_THEME_ID,
  legacySelectedColor = null,
) {
  const weekdayIds = new Set(WEEKDAYS.map((day) => day.id))
  // `weekdayId: null` (explicit) means a free-form custom-named day.
  const isCustom = raw?.weekdayId === null && typeof raw?.label === 'string'
  const weekdayId = isCustom
    ? null
    : weekdayIds.has(raw?.weekdayId)
      ? raw.weekdayId
      : fallbackWeekdayId
  const label = isCustom
    ? raw.label.trim().slice(0, MAX_CUSTOM_DAY_LABEL_LENGTH) ||
      DEFAULT_CUSTOM_DAY_LABEL
    : ''

  const themeId = getTheme(
    typeof raw?.themeId === 'string' ? raw.themeId : legacyThemeId,
  ).id
  const theme = getTheme(themeId)
  const rawSelectedColor =
    typeof raw?.selectedColor === 'string' ? raw.selectedColor : legacySelectedColor
  const selectedColor = theme.colors.includes(rawSelectedColor)
    ? rawSelectedColor
    : theme.colors[0]

  return {
    id: typeof raw?.id === 'string' ? raw.id : createEmptyDay(weekdayId).id,
    weekdayId,
    label,
    themeId,
    selectedColor,
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

  // Legacy (pre-per-day palette) saves kept theme/color at this top level —
  // used only as a fallback for days that don't carry their own yet.
  const legacyThemeId =
    typeof raw.themeId === 'string' ? getTheme(raw.themeId).id : DEFAULT_THEME_ID
  const legacySelectedColor =
    typeof raw.selectedColor === 'string' ? raw.selectedColor : null

  let days = Array.isArray(raw.days)
    ? raw.days.slice(0, MAX_DAYS).map((day, index) =>
        sanitizeDay(
          day,
          WEEKDAYS[index % WEEKDAYS.length].id,
          legacyThemeId,
          legacySelectedColor,
        ),
      )
    : createInitialWeek()

  if (days.length === 0) days = createInitialWeek()

  // Ensure unique weekdays when possible (custom-named days are exempt).
  const used = new Set()
  days = days.map((day) => {
    if (day.weekdayId == null) return day
    if (!used.has(day.weekdayId)) {
      used.add(day.weekdayId)
      return day
    }
    const fallback =
      WEEKDAYS.find((weekday) => !used.has(weekday.id))?.id ?? null
    if (fallback == null) {
      // No free weekday left — keep it as a custom-named day instead.
      return {
        ...day,
        weekdayId: null,
        label: DEFAULT_CUSTOM_DAY_LABEL,
      }
    }
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

  return {
    title: typeof raw.title === 'string' ? raw.title : DEFAULT_PLANNER_TITLE,
    customBackgroundSrc:
      typeof raw.customBackgroundSrc === 'string'
        ? raw.customBackgroundSrc
        : null,
    backgroundSize: (() => {
      const value =
        typeof raw.backgroundSize === 'number'
          ? raw.backgroundSize
          : typeof raw.canvasSize === 'number'
            ? raw.canvasSize
            : null
      return value != null && Number.isFinite(value) ? value : null
    })(),
    backgroundOpacity:
      typeof raw.backgroundOpacity === 'number'
        ? Math.min(1, Math.max(0, raw.backgroundOpacity))
        : 1,
    appMode: raw.appMode === APP_MODES.wallpaper ? APP_MODES.wallpaper : APP_MODES.edit,
    artboardPresetId: resolveArtboardPresetId(raw.artboardPresetId),
    customAspectW: clampAspectSide(
      raw.artboardPresetId === 'print' && raw.customAspectW == null
        ? 210
        : raw.customAspectW,
      DEFAULT_CUSTOM_ASPECT_W,
    ),
    customAspectH: clampAspectSide(
      raw.artboardPresetId === 'print' && raw.customAspectH == null
        ? 297
        : raw.customAspectH,
      DEFAULT_CUSTOM_ASPECT_H,
    ),
    wallpaperPlacements: sanitizeWallpaperPlacements(
      raw.wallpaperPlacements,
      days,
    ),
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
