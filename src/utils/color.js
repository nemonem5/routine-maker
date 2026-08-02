/**
 * Color helpers for subtle divider strokes and future themes.
 */

export function parseHex(hex) {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw
  const n = Number.parseInt(full, 16)
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  }
}

export function rgbToHex(r, g, b) {
  const to = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function rgbToHsl(r, g, b) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6
  else if (max === gg) h = ((bb - rr) / d + 2) / 6
  else h = ((rr - gg) / d + 4) / 6

  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToRgb(h, s, l) {
  const hh = ((h % 360) + 360) % 360 / 360
  const ss = s / 100
  const ll = l / 100

  if (ss === 0) {
    const v = ll * 255
    return { r: v, g: v, b: v }
  }

  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  const hue2rgb = (t) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  return {
    r: hue2rgb(hh + 1 / 3) * 255,
    g: hue2rgb(hh) * 255,
    b: hue2rgb(hh - 1 / 3) * 255,
  }
}

/**
 * Barely-visible divider tint: slightly higher saturation, slightly lower lightness.
 */
export function subtleDividerColor(hex, { satDelta = 6, lightDelta = -5 } = {}) {
  const { r, g, b } = parseHex(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const nextS = Math.max(0, Math.min(100, s + satDelta))
  const nextL = Math.max(0, Math.min(100, l + lightDelta))
  const rgb = hslToRgb(h, nextS, nextL)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/** WCAG relative luminance — what the eye actually reads as "brightness". */
export function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex)
  const channel = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  )
}

export function contrastRatio(aHex, bHex) {
  const a = relativeLuminance(aHex)
  const b = relativeLuminance(bHex)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const toHex = (h, s, l) => {
  const rgb = hslToRgb(h, Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l)))
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * Divider stroke for a boundary between two painted colors.
 *
 * HSL lightness is NOT perceived brightness: nudging lightness down while
 * raising saturation can leave the stroke at the same apparent brightness as
 * the fill it sits on, so the line vanishes. This walks lightness away from
 * the two fills until the stroke clears `minContrast` against BOTH of them,
 * measured as a real luminance contrast ratio. It steps darker first (subtle,
 * ink-like) and only goes lighter when the fills are already near black.
 */
export function dividerColorForBoundary(
  leftHex,
  rightHex,
  { satDelta = 8, minContrast = 1.75 } = {},
) {
  const left = parseHex(leftHex)
  const right = parseHex(rightHex)
  const leftHsl = rgbToHsl(left.r, left.g, left.b)
  const rightHsl = rgbToHsl(right.r, right.g, right.b)

  const leftIsDarker = relativeLuminance(leftHex) <= relativeLuminance(rightHex)
  const darker = leftIsDarker ? leftHsl : rightHsl
  const lighter = leftIsDarker ? rightHsl : leftHsl

  const score = (hex) =>
    Math.min(contrastRatio(hex, leftHex), contrastRatio(hex, rightHex))

  let best = null
  const consider = (hex) => {
    const value = score(hex)
    if (!best || value > best.value) best = { hex, value }
    return value >= minContrast
  }

  for (let l = Math.round(darker.l); l >= 0; l -= 2) {
    const candidate = toHex(darker.h, darker.s + satDelta, l)
    if (consider(candidate)) return candidate
  }
  for (let l = Math.round(lighter.l); l <= 100; l += 2) {
    const candidate = toHex(lighter.h, lighter.s - satDelta, l)
    if (consider(candidate)) return candidate
  }

  return best.hex
}

/**
 * Text / label color derived from the page background so themes stay readable
 * when background customization arrives later.
 */
export function toneFromBackground(
  backgroundHex,
  { satDelta = 3, lightDelta = -16 } = {},
) {
  return subtleDividerColor(backgroundHex, { satDelta, lightDelta })
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
