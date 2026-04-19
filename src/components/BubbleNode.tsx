import { useRef, useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useBrainstormStore } from '../store'
import type { NodeData } from '../store'

const MERGE_DISTANCE = 60
const DOUBLE_CLICK_MS = 350
const DRAG_THRESHOLD = 5
const NODE_WIDTH = 200

export function BubbleNode({ node }: { node: NodeData }) {
  const expandNode = useBrainstormStore((s) => s.expandNode)
  const steerPrompt = useBrainstormStore((s) => s.steerPrompt)
  const setSteerPrompt = useBrainstormStore((s) => s.setSteerPrompt)
  const dismissNode = useBrainstormStore((s) => s.dismissNode)
  const moveNode = useBrainstormStore((s) => s.moveNode)
  const mergeNodes = useBrainstormStore((s) => s.mergeNodes)
  const setMergeTarget = useBrainstormStore((s) => s.setMergeTarget)
  const mergeTarget = useBrainstormStore((s) => s.mergeTarget)
  const selectNode = useBrainstormStore((s) => s.selectNode)
  const toggleNodeSelected = useBrainstormStore((s) => s.toggleNodeSelected)
  const selectedNodeId = useBrainstormStore((s) => s.selectedNodeId)
  const selectedNodeIds = useBrainstormStore((s) => s.selectedNodeIds)
  const setConnectionDrag = useBrainstormStore((s) => s.setConnectionDrag)
  const addConnection = useBrainstormStore((s) => s.addConnection)
  const connectionDrag = useBrainstormStore((s) => s.connectionDrag)
  const nodes = useBrainstormStore((s) => s.nodes)
  const viewport = useBrainstormStore((s) => s.viewport)
  const isLoading = useBrainstormStore((s) => s.isLoading)
  const setNodeSize = useBrainstormStore((s) => s.setNodeSize)
  const setDraggedNode = useBrainstormStore((s) => s.setDraggedNode)
  const setPendingNodePosition = useBrainstormStore((s) => s.setPendingNodePosition)
  const setPendingConnectionSource = useBrainstormStore((s) => s.setPendingConnectionSource)

  const elRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const nodeStart = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)
  const lastClickTime = useRef(0)
  const isSecondPress = useRef(false)
  const isConnectionDragging = useRef(false)
  const isShiftClick = useRef(false)

  const textRef = useRef<HTMLSpanElement>(null)
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    setIsClamped(el.scrollHeight > el.clientHeight)
  }, [node.text, expanded])

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - window.innerWidth / 2 - viewport.x) / viewport.zoom,
      y: (sy - window.innerHeight / 2 - viewport.y) / viewport.zoom,
    }),
    [viewport],
  )

  const findMergeCandidate = useCallback(
    (pos: { x: number; y: number }) => {
      return Object.values(nodes).find(
        (n) =>
          n.id !== node.id &&
          n.status === 'active' &&
          Math.hypot(n.position.x - pos.x, n.position.y - pos.y) <
            MERGE_DISTANCE,
      )
    },
    [nodes, node.id],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Let middle mouse pass through for canvas panning
      if (e.button === 1) return
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

      const now = Date.now()
      const timeSinceLastClick = now - lastClickTime.current

      isDragging.current = true
      hasMoved.current = false
      dragStart.current = { x: e.clientX, y: e.clientY }
      nodeStart.current = { x: node.position.x, y: node.position.y }
      isShiftClick.current = e.shiftKey

      if (!e.shiftKey && timeSinceLastClick < DOUBLE_CLICK_MS) {
        isSecondPress.current = true
      } else {
        isSecondPress.current = false
      }
      isConnectionDragging.current = false
    },
    [node.position],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return

      const dx = (e.clientX - dragStart.current.x) / viewport.zoom
      const dy = (e.clientY - dragStart.current.y) / viewport.zoom
      const moved = Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD

      if (!moved) return

      const justStarted = !hasMoved.current
      hasMoved.current = true

      if (isSecondPress.current) {
        isConnectionDragging.current = true
        const canvasPos = screenToCanvas(e.clientX, e.clientY)
        setConnectionDrag({ sourceId: node.id, point: canvasPos })

        const candidate = findMergeCandidate(canvasPos)
        setMergeTarget(candidate?.id ?? null)
      } else {
        if (justStarted) setDraggedNode(node.id)
        const newPos = {
          x: nodeStart.current.x + dx,
          y: nodeStart.current.y + dy,
        }
        moveNode(node.id, newPos)

        const candidate = findMergeCandidate(newPos)
        setMergeTarget(candidate?.id ?? null)
      }
    },
    [viewport, moveNode, node.id, findMergeCandidate, setMergeTarget, setConnectionDrag, screenToCanvas, setDraggedNode],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    if (hasMoved.current && !isConnectionDragging.current) {
      setDraggedNode(null)
    }

    if (isConnectionDragging.current) {
      if (mergeTarget) {
        addConnection(node.id, mergeTarget)
      } else if (connectionDrag) {
        // Drop on empty space → spawn a new connected node at release point
        setPendingNodePosition(connectionDrag.point)
        setPendingConnectionSource(node.id)
      }
      setConnectionDrag(null)
      setMergeTarget(null)
      isConnectionDragging.current = false
      isSecondPress.current = false
      return
    }

    if (!hasMoved.current) {
      if (isShiftClick.current) {
        toggleNodeSelected(node.id)
        isShiftClick.current = false
        lastClickTime.current = 0
      } else if (isSecondPress.current) {
        setSteerPrompt({ nodeId: node.id, defaultValue: 'brainstorm ideas' })
        isSecondPress.current = false
        lastClickTime.current = 0
      } else {
        selectNode(node.id)
        lastClickTime.current = Date.now()
      }
      return
    }

    if (mergeTarget) {
      mergeNodes(node.id, mergeTarget)
    }
    setMergeTarget(null)
    isSecondPress.current = false
  }, [setSteerPrompt, selectNode, toggleNodeSelected, mergeNodes, addConnection, mergeTarget, node.id, setMergeTarget, setConnectionDrag, setDraggedNode, connectionDrag, setPendingNodePosition, setPendingConnectionSource])

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dismissNode(node.id)
    },
    [dismissNode, node.id],
  )

  const handleToggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setExpanded((v) => !v)
    },
    [],
  )

  // Measure node size after render
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const { offsetWidth: w, offsetHeight: h } = el
    if (w && h && (w !== node.size.w || h !== node.size.h)) {
      setNodeSize(node.id, w, h)
    }
  })

  const isExpandLoading = isLoading === node.id
  const isMergeHighlight = mergeTarget === node.id
  const isSelected = selectedNodeId === node.id || selectedNodeIds.includes(node.id)
  const isConnectionTarget =
    connectionDrag && connectionDrag.sourceId !== node.id && isMergeHighlight

  return (
    <div
      ref={elRef}
      className="absolute select-none group"
      style={{
        left: Math.round(node.position.x),
        top: Math.round(node.position.y),
        transform: 'translate(-50%, 0) translateZ(0)',
        width: NODE_WIDTH,
        zIndex: isDragging.current ? 10 : 1,
        willChange: 'left, top',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`
          relative px-3 py-2 rounded-lg border cursor-pointer
          ${isConnectionTarget ? 'border-blue-400 bg-blue-50' : isMergeHighlight ? 'border-blue-400 bg-blue-50' : isSelected ? 'border-neutral-800 bg-white' : node.origin === 'ai' ? 'border-pink-300 bg-white' : 'border-neutral-300 bg-white'}
          ${isExpandLoading ? 'opacity-60' : ''}
        `}
      >
        <span
          ref={textRef}
          className="text-sm leading-snug break-words block"
          style={!expanded ? {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } : undefined}
        >
          {node.text}
        </span>
        {isExpandLoading && (
          <span className="ml-1 text-neutral-400 text-xs">...</span>
        )}
        {(isClamped || expanded) && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggleExpand}
            className="block text-xs text-neutral-400 hover:text-neutral-600 mt-1"
          >
            {expanded ? 'less' : 'more'}
          </button>
        )}
        {!isExpandLoading && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neutral-200 text-neutral-500 text-xs flex items-center justify-center hover:bg-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}
      </motion.div>
      {steerPrompt?.nodeId === node.id && (
        <SteerInput
          defaultValue={steerPrompt.defaultValue}
          onSubmit={(value) => expandNode(node.id, value)}
          onCancel={() => setSteerPrompt(null)}
        />
      )}
    </div>
  )
}

function SteerInput({
  defaultValue,
  onSubmit,
  onCancel,
}: {
  defaultValue: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSubmit(value)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      onBlur={onCancel}
      placeholder="branch on..."
      className="mt-2 w-full px-2 py-1 text-xs border border-neutral-400 rounded outline-none focus:border-neutral-700 bg-white shadow-sm"
    />
  )
}
