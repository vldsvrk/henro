import { useBrainstormStore } from '../store'
import type { NodeData } from '../store'

function centerY(node: NodeData) {
  return node.position.y + (node.size.h || 60) / 2
}

function ConnectionLine({
  id1,
  id2,
  x1,
  y1,
  x2,
  y2,
  color,
  isSelected,
}: {
  id1: string
  id2: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  isSelected: boolean
}) {
  const selectConnection = useBrainstormStore((s) => s.selectConnection)

  return (
    <g>
      {/* Fat invisible hit area */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={12}
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          selectConnection([id1, id2])
        }}
      />
      {/* Visible line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isSelected ? '#3b82f6' : color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        className="pointer-events-none"
      />
    </g>
  )
}

export function Connections() {
  const nodes = useBrainstormStore((s) => s.nodes)
  const connectionDrag = useBrainstormStore((s) => s.connectionDrag)
  const connections = useBrainstormStore((s) => s.connections)
  const selectedConnectionIds = useBrainstormStore((s) => s.selectedConnectionIds)
  const active = Object.values(nodes).filter((n) => n.status === 'active')

  const isConnSelected = (a: string, b: string) =>
    selectedConnectionIds.some(
      ([x, y]) => (x === a && y === b) || (x === b && y === a),
    )

  return (
    <svg
      className="absolute"
      style={{ left: 0, top: 0, width: 1, height: 1, overflow: 'visible' }}
    >
      {/* Parent-child connections */}
      {active.map((node) => {
        if (!node.parentId) return null
        const parent = nodes[node.parentId]
        if (!parent || parent.status !== 'active') return null

        return (
          <ConnectionLine
            key={`${parent.id}-${node.id}`}
            id1={parent.id}
            id2={node.id}
            x1={parent.position.x}
            y1={centerY(parent)}
            x2={node.position.x}
            y2={centerY(node)}
            color="#ccc"
            isSelected={isConnSelected(parent.id, node.id)}
          />
        )
      })}
      {/* User-created connections */}
      {connections.map(([id1, id2]) => {
        const n1 = nodes[id1]
        const n2 = nodes[id2]
        if (!n1 || !n2 || n1.status !== 'active' || n2.status !== 'active')
          return null

        return (
          <ConnectionLine
            key={`conn-${id1}-${id2}`}
            id1={id1}
            id2={id2}
            x1={n1.position.x}
            y1={centerY(n1)}
            x2={n2.position.x}
            y2={centerY(n2)}
            color="#999"
            isSelected={isConnSelected(id1, id2)}
          />
        )
      })}
      {/* Drag preview */}
      {connectionDrag && nodes[connectionDrag.sourceId] && (
        <line
          x1={nodes[connectionDrag.sourceId].position.x}
          y1={centerY(nodes[connectionDrag.sourceId])}
          x2={connectionDrag.point.x}
          y2={connectionDrag.point.y}
          stroke="#999"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          className="pointer-events-none"
        />
      )}
    </svg>
  )
}
