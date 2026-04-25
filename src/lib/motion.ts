/**
 * Motion tokens for Framer Motion (JS side).
 *
 * Mirrors `--ease-smooth` and the duration scale used in CSS.
 * Use these instead of hardcoding `duration: 0.18` / `ease: 'easeOut'`.
 */

/** Duration in seconds (Framer Motion expects seconds, not ms) */
export const DURATION = {
  /** 150ms — modal fade, snappy state changes */
  fast: 0.15,
  /** 180ms — most transitions: scale, fade, x/y movement */
  base: 0.18,
  /** 200ms — small UI shifts (count badges, layout settles) */
  medium: 0.2,
  /** 350ms — layout/morph animations (seed shell) */
  emphasized: 0.35,
} as const

/** Easings — readonly tuples are required for Framer's typings */
export const EASE = {
  /** Smooth out-curve for morphs (matches `--ease-smooth` in CSS) */
  smooth: [0.22, 1, 0.36, 1] as const,
  /** Strong out-curve for snappy popovers / dropdowns */
  snappy: [0.23, 1, 0.32, 1] as const,
  /** Standard ease-out string accepted by Framer */
  out: 'easeOut',
} as const

/**
 * Pre-built transition presets — pass directly to Framer's `transition` prop.
 *
 * @example
 * <motion.div transition={TRANSITION.base} />
 */
export const TRANSITION = {
  /** Default UI transition (180ms ease-out) */
  base: { duration: DURATION.base, ease: EASE.out },
  /** Fast modal-style fade (150ms) */
  fast: { duration: DURATION.fast },
  /** Snappy popovers / dropdowns (140ms with strong ease-out) */
  snappy: { duration: 0.14, ease: EASE.snappy },
  /** Smooth morph for layout transitions (350ms cubic-bezier) */
  morph: { duration: DURATION.emphasized, ease: EASE.smooth },
} as const
