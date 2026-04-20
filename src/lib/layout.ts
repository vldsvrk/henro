export type Position = { x: number; y: number }
export type NodeBox = { x: number; y: number; w: number; h: number }

const RADIUS = 160
const PADDING = 24 // extra gap between node edges
const DEFAULT_W = 180 // matches NODE_WIDTH in BubbleNode
const DEFAULT_H = 60  // typical height with wrapped text

export function computeChildPositions(
  parent: Position,
  grandparent: Position | null,
  count: number,
  occupied: NodeBox[] = [],
): Position[] {
  if (count === 0) return []

  let baseAngle: number
  if (grandparent) {
    baseAngle = Math.atan2(parent.y - grandparent.y, parent.x - grandparent.x)
  } else {
    baseAngle = -Math.PI / 2
  }

  const spread = count === 1 ? 0 : Math.PI * 0.7
  const positions: Position[] = []

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5
    const angle = baseAngle + t * spread
    const candidate = {
      x: parent.x + RADIUS * Math.cos(angle),
      y: parent.y + RADIUS * Math.sin(angle),
    }

    // Treat already-placed siblings as occupied too
    const allOccupied = [
      ...occupied,
      ...positions.map((p) => ({ x: p.x, y: p.y, w: DEFAULT_W, h: DEFAULT_H })),
    ]

    const resolved = findFreeSpot(candidate, parent, angle, allOccupied)
    positions.push(resolved)
  }

  return positions
}

function findFreeSpot(
  ideal: Position,
  parent: Position,
  angle: number,
  occupied: NodeBox[],
): Position {
  const newBox = { w: DEFAULT_W, h: DEFAULT_H }

  if (!overlapsAny(ideal, newBox, occupied)) return ideal

  // Generate a dense set of candidate positions varying both radius and angle,
  // then pick the one closest to the ideal spot that isn't occupied. This
  // avoids the failure mode where we pushed far along a blocked direction
  // before trying a small angular nudge that would have fit right next door.
  const RADII = [
    RADIUS,
    RADIUS + 40,
    RADIUS + 80,
    RADIUS + 130,
    RADIUS + 190,
    RADIUS + 260,
    RADIUS + 340,
  ]
  const ANGLE_OFFSETS = [
    0,
    Math.PI / 18, -Math.PI / 18,
    Math.PI / 12, -Math.PI / 12,
    Math.PI / 8, -Math.PI / 8,
    Math.PI / 6, -Math.PI / 6,
    Math.PI / 4, -Math.PI / 4,
    Math.PI / 3, -Math.PI / 3,
    Math.PI / 2.2, -Math.PI / 2.2,
    Math.PI / 1.6, -Math.PI / 1.6,
    Math.PI,
  ]

  const candidates: Position[] = []
  for (const r of RADII) {
    for (const da of ANGLE_OFFSETS) {
      const a = angle + da
      candidates.push({
        x: parent.x + r * Math.cos(a),
        y: parent.y + r * Math.sin(a),
      })
    }
  }

  candidates.sort(
    (a, b) =>
      Math.hypot(a.x - ideal.x, a.y - ideal.y) -
      Math.hypot(b.x - ideal.x, b.y - ideal.y),
  )

  for (const c of candidates) {
    if (!overlapsAny(c, newBox, occupied)) return c
  }

  // Fallback: far out along original angle
  return {
    x: parent.x + 600 * Math.cos(angle),
    y: parent.y + 600 * Math.sin(angle),
  }
}

function overlapsAny(
  pos: Position,
  size: { w: number; h: number },
  occupied: NodeBox[],
): boolean {
  const hw = size.w / 2 + PADDING
  const hh = size.h / 2 + PADDING

  return occupied.some((o) => {
    const ohw = (o.w || DEFAULT_W) / 2 + PADDING
    const ohh = (o.h || DEFAULT_H) / 2 + PADDING

    return (
      Math.abs(pos.x - o.x) < hw + ohw &&
      Math.abs(pos.y - o.y) < hh + ohh
    )
  })
}
