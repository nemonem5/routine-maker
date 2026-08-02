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

export const PLANNER_STYLE = {
  ringFill: '#ffffff',
  strokeWidth: 1.25,
  dividerWidth: 0.75,
  /** Softer same-color dividers: small sat bump, tiny darkening. */
  dividerSatDelta: 6,
  dividerLightDelta: -5,
  /** Hour labels relative to page background. */
  labelLightDelta: -24,
  labelSatDelta: 4,
  labelFont: '500 12px "Segoe UI", system-ui, sans-serif',
  previewAlpha: 0.45,
}

/**
 * Paint palettes (UI order): red → teal → blue → pastel → mono.
 * Each has 12 colors. `accent` fills the sparkle preview icon.
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
      '#845451',
      '#6e3a3c',
      '#5b272c',
      '#561f22',
      '#3c1c1d',
      '#301415',
      '#130f0d',
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
      '#4e9f90',
      '#2e8a80',
      '#187874',
      '#15625e',
      '#02494d',
      '#014749',
      '#022b2f',
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
      '#495589',
      '#3a4a7a',
      '#2e3e6d',
      '#152a3f',
      '#0e182a',
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
      '#d8c4b8',
      '#c8b4a8',
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
      '#464c55',
      '#302f33',
      '#1e1d20',
      '#141214',
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
export const MAX_DAYS = 7

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

/** Planner square size (CSS px). */
export const DEFAULT_CANVAS_SIZE = 640
export const MIN_CANVAS_SIZE = 280
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
  erase: 'erase',
  sticker: 'sticker',
}

export function getTheme(themeId) {
  const resolved = THEME_ALIASES[themeId] ?? themeId
  return COLOR_THEMES[resolved] ?? COLOR_THEMES[DEFAULT_THEME_ID]
}

export function getWeekday(weekdayId) {
  return WEEKDAYS.find((day) => day.id === weekdayId) ?? WEEKDAYS[0]
}
