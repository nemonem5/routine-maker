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
  let h = 0
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
