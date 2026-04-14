import { create } from 'zustand'
import { computeChildPositions, type Position, type NodeBox } from './lib/layout'
import { generateBranches, mergeIdeas, compose as composeAI } from './lib/ai'

export type NodeData = {
  id: string
  text: string
  parentId: string | null
  childIds: string[]
  position: Position
  size: { w: number; h: number }
  status: 'active' | 'dismissed'
  origin: 'user' | 'ai'
  depth: number
}

interface BrainstormStore {
  nodes: Record<string, NodeData>
  viewport: { x: number; y: number; zoom: number }
  isLoading: string | null
  mergeTarget: string | null
  composeResult: string | null
  pendingNodePosition: Position | null
  selectedNodeId: string | null
  selectedNodeIds: string[]
  selectedConnection: [string, string] | null
  connectionDrag: { sourceId: string; point: Position } | null
  connections: [string, string][]

  addConnection: (id1: string, id2: string) => void
  removeConnection: (id1: string, id2: string) => void
  setNodeSize: (id: string, w: number, h: number) => void
  selectNode: (id: string | null) => void
  selectConnection: (conn: [string, string] | null) => void
  selectNodesInRect: (rect: { x: number; y: number; w: number; h: number }) => void
  deleteSelection: () => void
  setConnectionDrag: (drag: { sourceId: string; point: Position } | null) => void
  updateNodeText: (id: string, text: string) => void
  setSeed: (text: string) => void
  expandNode: (id: string) => Promise<void>
  dismissNode: (id: string) => void
  mergeNodes: (id1: string, id2: string) => Promise<void>
  addUserNode: (text: string, position: Position) => void
  moveNode: (id: string, position: Position) => void
  setMergeTarget: (id: string | null) => void
  setPendingNodePosition: (position: Position | null) => void
  compose: () => Promise<void>
  clearComposeResult: () => void
  pan: (dx: number, dy: number) => void
  zoom: (delta: number, center: Position) => void
}

function getAncestorTexts(
  nodes: Record<string, NodeData>,
  id: string,
): string[] {
  const texts: string[] = []
  let current = nodes[id]
  while (current) {
    texts.unshift(current.text)
    current = current.parentId ? nodes[current.parentId] : undefined!
  }
  return texts
}

function getConnectedTexts(
  nodes: Record<string, NodeData>,
  connections: [string, string][],
  id: string,
): string[] {
  const connectedIds = new Set<string>()
  // User-created connections
  for (const [a, b] of connections) {
    if (a === id) connectedIds.add(b)
    if (b === id) connectedIds.add(a)
  }
  // Direct children (already linked but conceptually connected)
  const node = nodes[id]
  if (node) {
    for (const childId of node.childIds) {
      if (nodes[childId]?.status === 'active') connectedIds.add(childId)
    }
  }
  return [...connectedIds]
    .map((cid) => nodes[cid]?.text)
    .filter((t): t is string => !!t)
}

export const useBrainstormStore = create<BrainstormStore>((set, get) => ({
  nodes: {},
  viewport: { x: 0, y: 0, zoom: 1 },
  isLoading: null,
  mergeTarget: null,
  composeResult: null,
  pendingNodePosition: null,
  selectedNodeId: null,
  selectedNodeIds: [],
  selectedConnection: null,
  connectionDrag: null,
  connections: [],

  addConnection: (id1, id2) =>
    set((s) => {
      const exists = s.connections.some(
        ([a, b]) => (a === id1 && b === id2) || (a === id2 && b === id1),
      )
      if (exists) return s
      return { connections: [...s.connections, [id1, id2]] }
    }),
  removeConnection: (id1, id2) =>
    set((s) => ({
      connections: s.connections.filter(
        ([a, b]) => !(a === id1 && b === id2) && !(a === id2 && b === id1),
      ),
    })),
  selectNode: (id) => set({ selectedNodeId: id, selectedNodeIds: id ? [id] : [], selectedConnection: null }),
  selectConnection: (conn) => set({ selectedConnection: conn, selectedNodeId: null, selectedNodeIds: [] }),
  selectNodesInRect: (rect) =>
    set((s) => {
      const ids = Object.values(s.nodes)
        .filter((n) => {
          if (n.status !== 'active') return false
          return (
            n.position.x >= rect.x &&
            n.position.x <= rect.x + rect.w &&
            n.position.y >= rect.y &&
            n.position.y <= rect.y + rect.h
          )
        })
        .map((n) => n.id)
      return { selectedNodeIds: ids, selectedNodeId: ids.length === 1 ? ids[0] : null, selectedConnection: null }
    }),
  deleteSelection: () =>
    set((s) => {
      // Delete selected connection (user-created or parent-child)
      if (s.selectedConnection) {
        const [a, b] = s.selectedConnection

        // Check if it's a parent-child connection
        const nodeA = s.nodes[a]
        const nodeB = s.nodes[b]
        const isParentChild =
          (nodeA && nodeB && nodeA.parentId === b) ||
          (nodeA && nodeB && nodeB.parentId === a)

        if (isParentChild) {
          const newNodes = { ...s.nodes }
          // Sever the parent-child link
          if (nodeB.parentId === a) {
            newNodes[b] = { ...nodeB, parentId: null }
            newNodes[a] = { ...nodeA, childIds: nodeA.childIds.filter((c) => c !== b) }
          } else {
            newNodes[a] = { ...nodeA, parentId: null }
            newNodes[b] = { ...nodeB, childIds: nodeB.childIds.filter((c) => c !== a) }
          }
          return { nodes: newNodes, selectedConnection: null }
        }

        // User-created connection
        return {
          connections: s.connections.filter(
            ([x, y]) => !(x === a && y === b) && !(x === b && y === a),
          ),
          selectedConnection: null,
        }
      }
      // Delete selected nodes
      if (s.selectedNodeIds.length > 0) {
        const newNodes = { ...s.nodes }
        const dismiss = (nodeId: string) => {
          const n = newNodes[nodeId]
          if (!n) return
          newNodes[nodeId] = { ...n, status: 'dismissed' }
          n.childIds.forEach(dismiss)
        }
        s.selectedNodeIds.forEach(dismiss)
        return { nodes: newNodes, selectedNodeId: null, selectedNodeIds: [] }
      }
      return s
    }),
  setConnectionDrag: (drag) => set({ connectionDrag: drag }),
  updateNodeText: (id, text) =>
    set((s) => ({
      nodes: { ...s.nodes, [id]: { ...s.nodes[id], text } },
    })),
  setNodeSize: (id, w, h) =>
    set((s) => ({
      nodes: { ...s.nodes, [id]: { ...s.nodes[id], size: { w, h } } },
    })),

  setSeed: (text) => {
    const id = crypto.randomUUID()
    set({
      nodes: {
        [id]: {
          id,
          text,
          parentId: null,
          childIds: [],
          position: { x: 0, y: 0 },
          size: { w: 0, h: 0 },
          status: 'active',
          origin: 'user',
          depth: 0,
        },
      },
    })
  },

  expandNode: async (id) => {
    const state = get()
    const node = state.nodes[id]
    if (!node || state.isLoading) return

    set({ isLoading: id })

    try {
      const context = getAncestorTexts(state.nodes, id)
      const connectedTexts = getConnectedTexts(state.nodes, state.connections, id)
      const branches = await generateBranches(node.text, context, connectedTexts)

      const grandparent = node.parentId ? state.nodes[node.parentId] : null
      const occupied: NodeBox[] = Object.values(get().nodes)
        .filter((n) => n.status === 'active')
        .map((n) => ({ x: n.position.x, y: n.position.y, w: n.size.w, h: n.size.h }))
      const positions = computeChildPositions(
        node.position,
        grandparent?.position ?? null,
        branches.length,
        occupied,
      )

      const children: NodeData[] = branches.map((text, i) => ({
        id: crypto.randomUUID(),
        text,
        parentId: id,
        childIds: [],
        position: positions[i],
        size: { w: 0, h: 0 },
        status: 'active',
        origin: 'ai' as const,
        depth: node.depth + 1,
      }))

      set((s) => {
        const newNodes = { ...s.nodes }
        children.forEach((child) => {
          newNodes[child.id] = child
        })
        newNodes[id] = {
          ...newNodes[id],
          childIds: [...newNodes[id].childIds, ...children.map((c) => c.id)],
        }
        return { nodes: newNodes, isLoading: null }
      })
    } catch (err) {
      console.error('expandNode failed:', err)
      set({ isLoading: null })
      alert(err instanceof Error ? err.message : 'Failed to generate branches')
    }
  },

  dismissNode: (id) => {
    set((s) => {
      const newNodes = { ...s.nodes }
      const dismiss = (nodeId: string) => {
        const n = newNodes[nodeId]
        if (!n) return
        newNodes[nodeId] = { ...n, status: 'dismissed' }
        n.childIds.forEach(dismiss)
      }
      dismiss(id)
      return { nodes: newNodes }
    })
  },

  mergeNodes: async (id1, id2) => {
    const state = get()
    const node1 = state.nodes[id1]
    const node2 = state.nodes[id2]
    if (!node1 || !node2 || state.isLoading) return

    set({ isLoading: 'merge' })

    try {
      const mergedText = await mergeIdeas(node1.text, node2.text)

      const position: Position = {
        x: (node1.position.x + node2.position.x) / 2,
        y: (node1.position.y + node2.position.y) / 2,
      }

      const mergedNode: NodeData = {
        id: crypto.randomUUID(),
        text: mergedText,
        parentId: null,
        childIds: [],
        position,
        size: { w: 0, h: 0 },
        status: 'active',
        origin: 'ai',
        depth: Math.min(node1.depth, node2.depth),
      }

      set((s) => {
        const newNodes = { ...s.nodes }
        newNodes[id1] = { ...newNodes[id1], status: 'dismissed' }
        newNodes[id2] = { ...newNodes[id2], status: 'dismissed' }
        newNodes[mergedNode.id] = mergedNode
        return { nodes: newNodes, isLoading: null, mergeTarget: null }
      })
    } catch (err) {
      console.error('mergeNodes failed:', err)
      set({ isLoading: null, mergeTarget: null })
      alert(err instanceof Error ? err.message : 'Failed to merge ideas')
    }
  },

  addUserNode: (text, position) => {
    const id = crypto.randomUUID()
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: {
          id,
          text,
          parentId: null,
          childIds: [],
          position,
          size: { w: 0, h: 0 },
          status: 'active',
          origin: 'user',
          depth: 0,
        },
      },
      pendingNodePosition: null,
    }))
  },

  moveNode: (id, position) => {
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: { ...s.nodes[id], position },
      },
    }))
  },

  setMergeTarget: (id) => set({ mergeTarget: id }),
  setPendingNodePosition: (position) =>
    set({ pendingNodePosition: position }),

  compose: async () => {
    const state = get()
    if (state.isLoading) return

    const activeTexts = Object.values(state.nodes)
      .filter((n) => n.status === 'active')
      .map((n) => n.text)

    if (activeTexts.length === 0) return

    set({ isLoading: 'compose' })
    try {
      const result = await composeAI(activeTexts)
      set({ composeResult: result, isLoading: null })
    } catch (err) {
      console.error('compose failed:', err)
      set({ isLoading: null })
      alert(err instanceof Error ? err.message : 'Failed to compose')
    }
  },

  clearComposeResult: () => set({ composeResult: null }),

  pan: (dx, dy) => {
    set((s) => ({
      viewport: {
        ...s.viewport,
        x: s.viewport.x + dx,
        y: s.viewport.y + dy,
      },
    }))
  },

  zoom: (delta, center) => {
    set((s) => {
      const oldZoom = s.viewport.zoom
      const newZoom = Math.max(0.3, Math.min(2.5, oldZoom + delta))
      const scale = newZoom / oldZoom

      // Zoom toward cursor
      const originX = center.x - window.innerWidth / 2
      const originY = center.y - window.innerHeight / 2
      const newX = originX - (originX - s.viewport.x) * scale
      const newY = originY - (originY - s.viewport.y) * scale

      return { viewport: { x: newX, y: newY, zoom: newZoom } }
    })
  },
}))
