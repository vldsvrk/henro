/**
 * Design token mirrors for non-Tailwind contexts (SVG attributes, canvas,
 * JS-computed styles). Tailwind `@theme` tokens in src/index.css are the
 * source of truth — these constants must mirror them exactly.
 *
 * Keep both files in sync when adjusting values.
 */

/** Stroke colors for SVG `<line>` and `<stop>` elements in Connections. */
export const LINE = {
  /** --color-line-neutral */
  default: '#D5D5D5',
  /** --color-select */
  select: '#8FD9ED',
  /** --color-ai */
  ai: '#FDA5D5',
  /** --color-line-blend — perceptual midpoint for select↔ai gradient */
  blend: '#C8ABDD',
} as const

/** Stroke widths for SVG connection lines. */
export const STROKE = {
  default: 1.5,
  selected: 2,
  hit: 12,
} as const
