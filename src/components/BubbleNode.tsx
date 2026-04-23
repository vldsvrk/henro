import { useRef, useCallback, useState, useEffect, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import { useBrainstormStore } from '../store'
import type { NodeData } from '../store'
import { CloseIcon } from './icons'

const MERGE_DISTANCE = 60
const DOUBLE_CLICK_MS = 350
const DRAG_THRESHOLD = 5
const NODE_WIDTH = 180

export function BubbleNode({ node }: { node: NodeData }) {
  const expandNode = useBrainstormStore((s) => s.expandNode)
  const steerPrompt = useBrainstormStore((s) => s.steerPrompt)
  const setSteerPrompt = useBrainstormStore((s) => s.setSteerPrompt)
  const dismissNode = useBrainstormStore((s) => s.dismissNode)
  const moveNode = useBrainstormStore((s) => s.moveNode)
  const moveNodes = useBrainstormStore((s) => s.moveNodes)
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
  const mergeAnim = useBrainstormStore((s) => s.mergeAnim)
  const setNodeSize = useBrainstormStore((s) => s.setNodeSize)
  const setDraggedNode = useBrainstormStore((s) => s.setDraggedNode)
  const setPendingNodePosition = useBrainstormStore((s) => s.setPendingNodePosition)
  const setPendingConnectionSource = useBrainstormStore((s) => s.setPendingConnectionSource)
  const seedNodeId = useBrainstormStore((s) => s.seedNodeId)
  const isSeed = node.id === seedNodeId
  const [morphDone, setMorphDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMorphDone(true), 500)
    return () => clearTimeout(t)
  }, [])
  const useLayoutId = isSeed && !morphDone

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
  const groupStarts = useRef<Record<string, { x: number; y: number }> | null>(null)

  const textRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [fullH, setFullH] = useState(0)
  const [applyClamp, setApplyClamp] = useState(!expanded)

  const COLLAPSED_MAX = 67.2 // 4 lines × 12px × 1.4 line-height
  const isClamped = fullH > COLLAPSED_MAX + 1

  // Measure the natural (unclamped) text height from an invisible clone
  // so we always have the expand target and a reliable signal for the
  // pill, regardless of what the visible span is doing.
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const measure = () => setFullH(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Expand: drop the clamp immediately so height can grow into the text.
  // Collapse: keep the text unclamped while the container shrinks, then
  // re-clamp once the animation is done so the ellipsis doesn't snap in early.
  useEffect(() => {
    if (expanded) {
      setApplyClamp(false)
      return
    }
    const t = setTimeout(() => setApplyClamp(true), 220)
    return () => clearTimeout(t)
  }, [expanded])

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

      const state = useBrainstormStore.getState()
      const sel = state.selectedNodeIds
      if (!e.shiftKey && sel.length > 1 && sel.includes(node.id)) {
        const starts: Record<string, { x: number; y: number }> = {}
        for (const id of sel) {
          const n = state.nodes[id]
          if (n && n.status === 'active') {
            starts[id] = { x: n.position.x, y: n.position.y }
          }
        }
        groupStarts.current = starts
      } else {
        groupStarts.current = null
      }

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
        if (groupStarts.current) {
          const updates: Record<string, { x: number; y: number }> = {}
          for (const [id, start] of Object.entries(groupStarts.current)) {
            updates[id] = { x: start.x + dx, y: start.y + dy }
          }
          moveNodes(updates)
          setMergeTarget(null)
        } else {
          const newPos = {
            x: nodeStart.current.x + dx,
            y: nodeStart.current.y + dy,
          }
          moveNode(node.id, newPos)

          const candidate = findMergeCandidate(newPos)
          setMergeTarget(candidate?.id ?? null)
        }
      }
    },
    [viewport, moveNode, moveNodes, node.id, findMergeCandidate, setMergeTarget, setConnectionDrag, screenToCanvas, setDraggedNode],
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

    if (mergeTarget && !groupStarts.current) {
      mergeNodes(node.id, mergeTarget)
    }
    setMergeTarget(null)
    isSecondPress.current = false
    groupStarts.current = null
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

  // Keep node size in sync with the rendered bubble, including during
  // framer height animations (which don't trigger React re-renders).
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w && h) setNodeSize(node.id, w, h)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [node.id, setNodeSize])

  const draggedNodeId = useBrainstormStore((s) => s.draggedNodeId)
  const isExpandLoading = isLoading === node.id
  const isMergeHighlight = mergeTarget === node.id
  const isSelected = selectedNodeId === node.id || selectedNodeIds.includes(node.id)
  const isConnectionTarget =
    connectionDrag && connectionDrag.sourceId !== node.id && isMergeHighlight
  const isBeingDragged = draggedNodeId === node.id

  const isMergePlaceholder = mergeAnim?.placeholderId === node.id

  const outerStyle: React.CSSProperties = {
    left: Math.round(node.position.x),
    top: Math.round(node.position.y),
    transform: 'translate(-50%, 0) translateZ(0)',
    width: NODE_WIDTH,
    zIndex: isDragging.current ? 10 : 1,
    willChange: 'left, top',
    ...(isMergePlaceholder ? { pointerEvents: 'none' as const } : {}),
  }

  // During morph: shell morphs via layoutId. Text crossfades in separately
  // so it never inherits the shell's FLIP scale (which caused stretch).
  if (useLayoutId) {
    return (
      <div className="absolute select-none" style={outerStyle}>
        <motion.div
          layoutId="seed-shell"
          className="bg-white rounded-[15px] px-[15px] py-[11px]"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="text-[12px] leading-[1.4] break-words block"
          >
            {node.text}
          </motion.span>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="absolute select-none group"
      style={outerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <motion.div
        ref={elRef}
        initial={isSeed ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: isBeingDragged ? 1.05 : 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={`
          relative rounded-[15px] px-[15px] py-[11px] cursor-pointer text-ink bg-white
          ${isBeingDragged ? 'shadow-[0_6px_18px_rgba(0,0,0,0.08)]' : ''}
          ${
            isConnectionTarget || isMergeHighlight || isSelected
              ? 'outline outline-[1.5px] outline-select'
              : node.origin === 'ai'
                ? 'outline outline-[1px] outline-ai'
                : ''
          }
          ${isExpandLoading || isMergePlaceholder ? 'shimmer-outline' : ''}
        `}
      >
        <div
          className="overflow-hidden transition-[max-height] duration-[220ms] ease-out"
          style={{
            maxHeight: expanded ? fullH || 1000 : COLLAPSED_MAX,
          }}
        >
          <span
            ref={textRef}
            className={`text-[12px] leading-[1.4] break-words ${
              applyClamp ? 'line-clamp-4' : 'block'
            } ${isMergePlaceholder && !node.text ? 'text-ink/50 italic' : ''}`}
          >
            {node.text || (isMergePlaceholder ? 'Merging ideas…' : '')}
          </span>
        </div>
        <span
          ref={measureRef}
          aria-hidden
          className="absolute left-[15px] right-[15px] top-[11px] invisible pointer-events-none text-[12px] leading-[1.4] break-words block"
        >
          {node.text}
        </span>
        {!isExpandLoading && !isMergePlaceholder && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDismiss}
            className="absolute -top-5 -right-5 w-[25px] h-[25px] rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-ink/30 hover:text-ink transition-[opacity,color]"
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        )}
      </motion.div>
      {(isClamped || expanded) && !isExpandLoading && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleToggleExpand}
          className={`group/pill absolute left-1/2 -translate-x-1/2 top-full flex items-center justify-center px-4 py-[8px] transition-opacity ${
            expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <span
            className={`block h-[4px] rounded-[7px] bg-line-neutral group-hover/pill:bg-ink/50 transition-all ${
              expanded ? 'w-[60px]' : 'w-[29px]'
            }`}
          />
        </button>
      )}
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
      className="mt-[10px] w-full px-3 py-2 text-[12px] rounded-[10px] outline-none bg-white text-ink placeholder:text-ink/40"
    />
  )
}
