import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBrainstormStore } from '../store'
import type { NodeData } from '../store'
import { LINE, STROKE } from '../lib/tokens'

function centerY(node: NodeData) {
  return node.position.y + (node.size.h || 60) / 2
}

function endpointColor(node: NodeData, isEndpointSelected: boolean) {
  if (isEndpointSelected) return LINE.select
  return node.origin === 'ai' ? LINE.ai : LINE.default
}

const ConnectionLine = memo(function ConnectionLine({
  aId,
  bId,
}: {
  aId: string
  bId: string
}) {
  // Each line subscribes only to its two endpoints. When an unrelated node
  // moves, this line skips re-rendering entirely.
  const a = useBrainstormStore((s) => s.nodes[aId])
  const b = useBrainstormStore((s) => s.nodes[bId])
  const selectConnection = useBrainstormStore((s) => s.selectConnection)
  const isSelected = useBrainstormStore((s) =>
    s.selectedConnectionIds.some(
      ([x, y]) => (x === aId && y === bId) || (x === bId && y === aId),
    ),
  )
  const isEndpointASelected = useBrainstormStore((s) =>
    s.selectedNodeIds.includes(aId),
  )
  const isEndpointBSelected = useBrainstormStore((s) =>
    s.selectedNodeIds.includes(bId),
  )

  if (!a || !b || a.status !== 'active' || b.status !== 'active') return null

  const x1 = a.position.x
  const y1 = centerY(a)
  const x2 = b.position.x
  const y2 = centerY(b)

  const gradId = `grad-${aId}-${bId}`
  const aColor = endpointColor(a, isEndpointASelected)
  const bColor = endpointColor(b, isEndpointBSelected)
  const needsGradient = !isSelected && aColor !== bColor

  let strokeColor: string
  if (isSelected) {
    strokeColor = LINE.select
  } else if (needsGradient) {
    strokeColor = `url(#${gradId})`
  } else {
    strokeColor = aColor
  }

  return (
    <g>
      {needsGradient && (
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          >
            <stop offset="20%" stopColor={aColor} />
            {((aColor === LINE.select && bColor === LINE.ai) ||
              (aColor === LINE.ai && bColor === LINE.select)) && (
              <stop offset="55%" stopColor={LINE.blend} />
            )}
            <stop offset="90%" stopColor={bColor} />
          </linearGradient>
        </defs>
      )}
      {/* Fat invisible hit area */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={STROKE.hit}
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          selectConnection([aId, bId])
        }}
      />
      {/* Visible line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={isSelected ? STROKE.selected : STROKE.default}
        className="pointer-events-none"
      />
    </g>
  )
})

function DragPreview() {
  const drag = useBrainstormStore((s) => s.connectionDrag)
  const sourceId = drag?.sourceId
  const source = useBrainstormStore((s) => (sourceId ? s.nodes[sourceId] : null))
  if (!drag || !source) return null
  return (
    <line
      x1={source.position.x}
      y1={centerY(source)}
      x2={drag.point.x}
      y2={drag.point.y}
      stroke={LINE.default}
      strokeWidth={STROKE.default}
      strokeDasharray="6 4"
      className="pointer-events-none"
    />
  )
}

function PendingPreview() {
  const sourceId = useBrainstormStore((s) => s.pendingConnectionSource)
  const point = useBrainstormStore((s) => s.pendingNodePosition)
  const source = useBrainstormStore((s) => (sourceId ? s.nodes[sourceId] : null))
  if (!source || !point) return null
  return (
    <line
      x1={source.position.x}
      y1={centerY(source)}
      x2={point.x}
      y2={point.y}
      stroke={LINE.default}
      strokeWidth={STROKE.default}
      strokeDasharray="6 4"
      className="pointer-events-none"
    />
  )
}

export function Connections() {
  // Compute the topology as flat "a|b" strings so useShallow's element-wise
  // comparison can short-circuit when the set of connections is unchanged
  // (every move otherwise allocates fresh tuples and fails ref-equality).
  // Position updates are handled by each ConnectionLine's own subscriptions.
  const pairKeys = useBrainstormStore(
    useShallow((s) => {
      const out: string[] = []
      for (const id in s.nodes) {
        const n = s.nodes[id]
        if (n.status !== 'active' || !n.parentId) continue
        const p = s.nodes[n.parentId]
        if (!p || p.status !== 'active') continue
        out.push(`${n.parentId}|${n.id}`)
      }
      for (const [a, b] of s.connections) {
        const na = s.nodes[a]
        const nb = s.nodes[b]
        if (!na || !nb || na.status !== 'active' || nb.status !== 'active') continue
        out.push(`${a}|${b}`)
      }
      return out
    }),
  )

  return (
    <svg
      className="absolute"
      style={{ left: 0, top: 0, width: 1, height: 1, overflow: 'visible' }}
    >
      {pairKeys.map((key) => {
        const [a, b] = key.split('|')
        return <ConnectionLine key={key} aId={a} bId={b} />
      })}
      <DragPreview />
      <PendingPreview />
    </svg>
  )
}
