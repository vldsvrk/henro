/**
 * Theme tokens for non-CSS contexts (SVG attributes, canvas).
 *
 * Reads from the live CSS custom properties defined in `@theme` in
 * src/index.css — that file is the single source of truth. Change the
 * CSS variable, this follows automatically.
 *
 * Fallbacks only fire in non-browser contexts (SSR, tests).
 */

function readVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/** Stroke colors for SVG `<line>` and `<stop>` elements in Connections. */
export const LINE = {
  default: readVar('--color-line-neutral', '#D5D5D5'),
  select: readVar('--color-select', '#8FD9ED'),
  ai: readVar('--color-ai', '#FDA5D5'),
  blend: readVar('--color-line-blend', '#C8ABDD'),
}

/** Stroke widths for SVG connection lines. */
export const STROKE = {
  default: 1.5,
  selected: 2,
  hit: 12,
} as const
