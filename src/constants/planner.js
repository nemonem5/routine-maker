/** Number of hour slots on the circular planner (full day). */
export const HOURS_PER_DAY = 24

/** Angle of one hour slot in radians. */
export const SLOT_ANGLE = (Math.PI * 2) / HOURS_PER_DAY

/**
 * Visual proportions relative to the outer radius.
 * Keep these centralized so stickers / fills can share the same geometry later.
 */
export const PLANNER_GEOMETRY = {
  /** Padding from canvas edge to outer ring (more margin → larger bg square around circle). */
  paddingRatio: 0.28,
  /** Filled disk — 0 means no hollow center. */
  innerRadiusRatio: 0,
  /** Hour labels sit outside the ring (relative to outer radius). */
  labelRadiusRatio: 1.12,
  /** Divider inset from center as a fraction of outer radius (visual hub). */
  dividerHubRatio: 0.02,
}

/**
 * All px-based values below are tuned for a canvas drawn at `PLANNER_SIZE`.
 * `drawPlanner` scales them by `size / PLANNER_SIZE` so the circle keeps the
 * same proportions whether it's the small wallpaper-board preview, the main
 * editor, or a multi-thousand-pixel PNG export tile.
 */
export const PLANNER_STYLE = {
  ringFill: '#ffffff',
  strokeWidth: 1.25,
  /** Never let the outer ring fall under a device pixel once the stage is
   *  rendered small (e.g. a narrow window) — same idea as dividerMinWidth. */
  strokeMinWidth: 1,
  dividerWidth: 1.4,
  /** Never let the stroke fall under a device pixel once the stage is scaled. */
  dividerMinWidth: 1,
  /** Color-boundary dividers: a quiet step from the fill itself. */
  dividerSatDelta: 3,
  /** Luminance contrast a boundary stroke must clear against BOTH fills. */
  dividerMinContrast: 1.35,
  /** Softer target where a fill meets the bare disk — it's only an outline. */
  dividerEdgeMinContrast: 1.2,
  /** Empty-hour grid rays (both sides unpainted). */
  emptyDividerColor: 'rgba(44, 42, 38, 0.14)',
  /** Hour labels relative to page background. */
  labelLightDelta: -24,
  labelSatDelta: 4,
  labelFontSize: 13,
  /** Never shrink below this so small board thumbnails stay legible. */
  labelMinFontPx: 8,
  labelFontWeight: 500,
  labelFontFamily: '"Segoe UI", system-ui, sans-serif',
  previewAlpha: 0.45,
}

/**
 * Paint palettes (UI order): red → teal → blue → pastel → mono.
 * Each has 12 colors. `accent` fills the sparkle preview icon.
 * The darkest swatch in each list is kept a touch lighter than
 * `ringStroke` so no fill can ever read as darker than the outline.
 */
export const COLOR_THEMES = {
  red: {
    id: 'red',
    label: '붉은색',
    pageBackground: '#f7f2f0',
    ringStroke: '#5b272c',
    accent: '#845451',
    colors: [
      '#ebe6dc',
      '#d8d3c4',
      '#c4c1b8',
      '#bea8a1',
      '#9d8a85',
      '#a16966',
      '#a05457',
      '#9f444d',
      '#9a373d',
      '#823d3f',
      '#7a3336',
      '#5c493f',
    ],
  },
  teal: {
    id: 'teal',
    label: '청록색',
    pageBackground: '#eef6f4',
    ringStroke: '#15625e',
    accent: '#4e9f90',
    colors: [
      '#e8f3ef',
      '#d4e7e1',
      '#b2cec2',
      '#7dac9e',
      '#68aa9e',
      '#53a999',
      '#3aafa3',
      '#24b4ae',
      '#23a39c',
      '#05a7b0',
      '#029ca0',
      '#067f8b',
    ],
  },
  blue: {
    id: 'blue',
    label: '푸른색',
    pageBackground: '#eef2f8',
    ringStroke: '#2e3e6d',
    accent: '#7087bb',
    colors: [
      '#f2f6fc',
      '#e5edfa',
      '#bbd0ed',
      '#a2b7e4',
      '#b2cddf',
      '#94a9be',
      '#7087bb',
      '#5866a4',
      '#4b609f',
      '#405698',
      '#326395',
      '#2d4d87',
    ],
  },
  pastel: {
    id: 'pastel',
    label: '파스텔',
    pageBackground: '#fbf8f4',
    ringStroke: '#c9a8b0',
    accent: '#f7d5de',
    colors: [
      '#fffcf8',
      '#f2f2f4',
      '#e7f9f9',
      '#d7eff4',
      '#c9e5f1',
      '#f7d5de',
      '#fef7b4',
      '#f0e0c8',
      '#e8d4ea',
      '#d4e6d8',
      '#dccbc0',
      '#d2c2b8',
    ],
  },
  mono: {
    id: 'mono',
    label: '무채색',
    pageBackground: '#f2f2f0',
    ringStroke: '#302f33',
    accent: '#7f8895',
    colors: [
      '#f4f4f2',
      '#e8e9eb',
      '#c2c7cf',
      '#bec0c2',
      '#9ea7b3',
      '#8f9295',
      '#7f8895',
      '#636d79',
      '#505761',
      '#4e4c53',
      '#46434a',
      '#413b41',
    ],
  },
}

/** Map legacy palette ids from older saved projects. */
const THEME_ALIASES = {
  dusk: 'blue',
  blush: 'pastel',
  tide: 'teal',
}

export const DEFAULT_THEME_ID = 'red'
export const DEFAULT_PLANNER_TITLE = ''
/** Total day tabs allowed (7 weekdays + custom-named days). */
export const MAX_DAYS = 14
export const MAX_CUSTOM_DAY_LABEL_LENGTH = 12
export const DEFAULT_CUSTOM_DAY_LABEL = '이름없음'

export const WEEKDAYS = [
  { id: 'mon', label: 'mon' },
  { id: 'tue', label: 'tue' },
  { id: 'wed', label: 'wed' },
  { id: 'thu', label: 'thu' },
  { id: 'fri', label: 'fri' },
  { id: 'sat', label: 'sat' },
  { id: 'sun', label: 'sun' },
]

/** Placed sticker width as a fraction of the canvas size. */
export const DEFAULT_STICKER_SIZE_RATIO = 0.09
export const MIN_STICKER_SIZE_RATIO = 0.04
export const MAX_STICKER_SIZE_RATIO = 0.45
/** Default rotation for newly placed stickers, in degrees. */
export const DEFAULT_STICKER_ROTATION = 0

/**
 * Rotate-handle geometry, tuned for PLANNER_SIZE — both the drawing code and
 * the hit-test code import these so the visible handle and its clickable
 * area always agree, whatever the canvas is scaled to.
 */
export const STICKER_ROTATE_HANDLE_GAP = 18
export const STICKER_ROTATE_HANDLE_RADIUS = 6

/** Fixed planner (circle) canvas size in CSS px. */
export const PLANNER_SIZE = 560

/** Background square size (independent of the circle). */
export const DEFAULT_BACKGROUND_SIZE = 560
export const MIN_BACKGROUND_SIZE = 560
/** @deprecated kept for older saves — migrated to backgroundSize */
export const DEFAULT_CANVAS_SIZE = DEFAULT_BACKGROUND_SIZE
export const MIN_CANVAS_SIZE = MIN_BACKGROUND_SIZE
export const MAX_CANVAS_SIZE = 1400

export const DEFAULT_STICKER_CATEGORY_ID = 'general'

export function createEmptyStickerLibrary() {
  return [
    {
      id: DEFAULT_STICKER_CATEGORY_ID,
      name: '',
      stickers: [],
    },
  ]
}

export const TOOLS = {
  paint: 'paint',
  sticker: 'sticker',
  /** @deprecated Cleared via double-click in paint mode; kept for old sessions. */
  erase: 'erase',
}

/** Editor vs composition/export board. */
export const APP_MODES = {
  edit: 'edit',
  wallpaper: 'wallpaper',
}

/**
 * Composition artboard presets (aspect only).
 * Preview fits the viewport; PNG export uses a high long-edge resolution.
 * `custom` uses customAspectW / customAspectH instead of a fixed aspect.
 */
export const ARTBOARD_PRESETS = {
  // Galaxy S10 panel: 1440x3040 (19:9).
  phone: { id: 'phone', label: '세로', aspect: 1440 / 3040 },
  desktop: { id: 'desktop', label: '와이드', aspect: 16 / 9 },
  square: { id: 'square', label: '정사각', aspect: 1 },
  custom: { id: 'custom', label: '지정', aspect: null },
}

export const DEFAULT_ARTBOARD_PRESET = 'desktop'
export const DEFAULT_CUSTOM_ASPECT_W = 4
export const DEFAULT_CUSTOM_ASPECT_H = 3
export const MIN_ASPECT_SIDE = 1
export const MAX_ASPECT_SIDE = 99
export const ARTBOARD_PREVIEW_MAX = 780
/** Longer edge of exported PNG in pixels. */
export const WALLPAPER_EXPORT_LONG_EDGE = 3000

/** @deprecated use ARTBOARD_PRESETS.phone.aspect */
export const WALLPAPER_ASPECT = ARTBOARD_PRESETS.phone.aspect
export const WALLPAPER_MAX_HEIGHT = ARTBOARD_PREVIEW_MAX
export const WALLPAPER_DEFAULT_CIRCLE_RATIO = 0.42
export const WALLPAPER_MIN_CIRCLE_RATIO = 0.18
export const WALLPAPER_MAX_CIRCLE_RATIO = 0.72

export function clampAspectSide(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(MAX_ASPECT_SIDE, Math.max(MIN_ASPECT_SIDE, Math.round(n)))
}

export function resolveArtboardPresetId(id) {
  if (id === 'print') return 'custom'
  return ARTBOARD_PRESETS[id] ? id : DEFAULT_ARTBOARD_PRESET
}

export function getArtboardPreset(id) {
  return ARTBOARD_PRESETS[resolveArtboardPresetId(id)]
}

/** width / height ratio for the active artboard. */
export function resolveArtboardAspect(presetId, customW, customH) {
  const id = resolveArtboardPresetId(presetId)
  if (id === 'custom') {
    const w = clampAspectSide(customW, DEFAULT_CUSTOM_ASPECT_W)
    const h = clampAspectSide(customH, DEFAULT_CUSTOM_ASPECT_H)
    return w / h
  }
  return ARTBOARD_PRESETS[id].aspect
}
export function getTheme(themeId) {
  const resolved = THEME_ALIASES[themeId] ?? themeId
  return COLOR_THEMES[resolved] ?? COLOR_THEMES[DEFAULT_THEME_ID]
}

export function getWeekday(weekdayId) {
  return WEEKDAYS.find((day) => day.id === weekdayId) ?? WEEKDAYS[0]
}
