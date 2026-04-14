export type Position = { x: number; y: number }
export type NodeBox = { x: number; y: number; w: number; h: number }

const RADIUS = 160
const PADDING = 24 // extra gap between node edges
const DEFAULT_W = 200 // matches NODE_WIDTH in BubbleNode
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
  pos: Position,
  parent: Position,
  angle: number,
  occupied: NodeBox[],
): Position {
  const newBox = { w: DEFAULT_W, h: DEFAULT_H }

  // Try original position first
  if (!overlapsAny(pos, newBox, occupied)) return pos

  // Strategy 1: push outward along same angle
  for (let step = 1; step <= 8; step++) {
    const r = RADIUS + step * 70
    const candidate = {
      x: parent.x + r * Math.cos(angle),
      y: parent.y + r * Math.sin(angle),
    }
    if (!overlapsAny(candidate, newBox, occupied)) return candidate
  }

  // Strategy 2: spiral outward — try multiple angles at increasing radii
  for (let ring = 1; ring <= 6; ring++) {
    const r = RADIUS + ring * 80
    const steps = 8 + ring * 4
    for (let s = 0; s < steps; s++) {
      // Alternate left/right of base angle
      const offset = (Math.floor(s / 2) + 1) * (s % 2 === 0 ? 1 : -1)
      const a = angle + (offset * Math.PI * 2) / steps
      const candidate = {
        x: parent.x + r * Math.cos(a),
        y: parent.y + r * Math.sin(a),
      }
      if (!overlapsAny(candidate, newBox, occupied)) return candidate
    }
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
