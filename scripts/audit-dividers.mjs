/**
 * Dev audit: how visible is each divider stroke against BOTH fills it separates?
 * Reports the worst-case WCAG contrast ratio per theme.
 */
import { COLOR_THEMES, PLANNER_STYLE } from '../src/constants/planner.js'
import { dividerColorForBoundary, parseHex } from '../src/utils/color.js'

function luminance(hex) {
  const { r, g, b } = parseHex(hex)
  const chan = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

for (const theme of Object.values(COLOR_THEMES)) {
  const rows = []
  for (const left of theme.colors) {
    for (const right of theme.colors) {
      if (left === right) continue
      const line = dividerColorForBoundary(left, right, {
        satDelta: PLANNER_STYLE.dividerSatDelta,
        minContrast: PLANNER_STYLE.dividerMinContrast,
      })
      const worst = Math.min(contrast(line, left), contrast(line, right))
      rows.push({ left, right, line, worst })
    }
  }
  rows.sort((a, b) => a.worst - b.worst)
  console.log(`\n=== ${theme.id} (${rows.length} pairs) ===`)
  console.log(
    `worst ${rows[0].worst.toFixed(2)} | median ${rows[Math.floor(rows.length / 2)].worst.toFixed(2)}`,
  )
  for (const row of rows.slice(0, 5)) {
    console.log(
      `  ${row.left} | ${row.right} -> ${row.line}  contrast ${row.worst.toFixed(2)}`,
    )
  }
}
