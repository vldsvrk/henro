/**
 * Post-drag overlap resolution for the brainstorm canvas.
 *
 * After a node is dropped, pushes apart any overlapping nodes using
 * AABB collision detection.  Converges in a few frames, then stops.
 */

import type { Position } from './layout'

const OVERLAP_PAD = 16
const DEFAULT_W = 200
const DEFAULT_H = 60

/**
 * Push overlapping nodes apart (AABB, axis of least penetration).
 * Returns position updates, or null if nothing overlaps.
 */
export function resolveOverlaps(
  nodes: { id: string; position: Position; size: { w: number; h: number } }[],
): Record<string, Position> | null {
  const n = nodes.length
  if (n < 2) return null

  const px = new Float64Array(n)
  const py = new Float64Array(n)
  let any = false

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = a.position.x - b.position.x
      const dy = a.position.y - b.position.y

      const hx = ((a.size.w || DEFAULT_W) + (b.size.w || DEFAULT_W)) / 2 + OVERLAP_PAD
      const hy = ((a.size.h || DEFAULT_H) + (b.size.h || DEFAULT_H)) / 2 + OVERLAP_PAD
      const ax = Math.abs(dx)
      const ay = Math.abs(dy)

      if (ax >= hx || ay >= hy) continue
      any = true

      const ox = hx - ax
      const oy = hy - ay

      if (ox < oy) {
        const push = ox * 0.3
        const s = dx >= 0 ? 1 : -1
        px[i] += s * push
        px[j] -= s * push
      } else {
        const push = oy * 0.3
        const s = dy >= 0 ? 1 : -1
        py[i] += s * push
        py[j] -= s * push
      }
    }
  }

  if (!any) return null

  const out: Record<string, Position> = {}
  for (let i = 0; i < n; i++) {
    if (px[i] !== 0 || py[i] !== 0) {
      out[nodes[i].id] = {
        x: nodes[i].position.x + px[i],
        y: nodes[i].position.y + py[i],
      }
    }
  }
  return out
}
