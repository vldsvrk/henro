import { useBrainstormStore } from '../store'
import type { NodeData } from '../store'

const LINE_SELECT = '#6BDEB9'
const LINE_AI = '#FDA5D5'
const LINE_DEFAULT = '#D5D5D5'

function centerY(node: NodeData) {
  return node.position.y + (node.size.h || 60) / 2
}

function ConnectionLine({
  a,
  b,
  isSelected,
}: {
  a: NodeData
  b: NodeData
  isSelected: boolean
}) {
  const selectConnection = useBrainstormStore((s) => s.selectConnection)

  const x1 = a.position.x
  const y1 = centerY(a)
  const x2 = b.position.x
  const y2 = centerY(b)

  const mixed = a.origin !== b.origin
  const gradId = `grad-${a.id}-${b.id}`

  let strokeColor: string
  if (isSelected) {
    strokeColor = LINE_SELECT
  } else if (mixed) {
    strokeColor = `url(#${gradId})`
  } else if (a.origin === 'ai') {
    strokeColor = LINE_AI
  } else {
    strokeColor = LINE_DEFAULT
  }

  // Gradient direction: user end → AI end
  const userEnd = a.origin === 'user' ? a : b
  const aiEnd = a.origin === 'ai' ? a : b

  return (
    <g>
      {mixed && !isSelected && (
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={userEnd.position.x}
            y1={centerY(userEnd)}
            x2={aiEnd.position.x}
            y2={centerY(aiEnd)}
          >
            <stop offset="0%" stopColor={LINE_DEFAULT} />
            <stop offset="100%" stopColor={LINE_AI} />
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
        strokeWidth={12}
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          selectConnection([a.id, b.id])
        }}
      />
      {/* Visible line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : 1.5}
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
            a={parent}
            b={node}
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
            a={n1}
            b={n2}
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
          stroke={LINE_DEFAULT}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          className="pointer-events-none"
        />
      )}
    </svg>
  )
}
