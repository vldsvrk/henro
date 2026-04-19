import { create } from 'zustand'
import { computeChildPositions, type Position, type NodeBox } from './lib/layout'
import { generateBranches, mergeIdeas, compose as composeAI } from './lib/ai'
import { CONTEXT_MAX_DEPTH, CONTEXT_MAX_NODES } from './lib/prompts'

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
  steer?: string
}

export type SteerPrompt = {
  nodeId: string
  defaultValue: string
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
  selectedConnectionIds: Array<[string, string]>
  connectionDrag: { sourceId: string; point: Position } | null
  connections: [string, string][]
  draggedNodeId: string | null
  steerPrompt: SteerPrompt | null
  pendingConnectionSource: string | null

  setPendingConnectionSource: (id: string | null) => void
  setSteerPrompt: (prompt: SteerPrompt | null) => void
  addConnection: (id1: string, id2: string) => void
  removeConnection: (id1: string, id2: string) => void
  setNodeSize: (id: string, w: number, h: number) => void
  selectNode: (id: string | null) => void
  toggleNodeSelected: (id: string) => void
  selectConnection: (conn: [string, string] | null) => void
  selectInRect: (rect: { x: number; y: number; w: number; h: number }) => void
  deleteSelection: () => void
  setConnectionDrag: (drag: { sourceId: string; point: Position } | null) => void
  updateNodeText: (id: string, text: string) => void
  setSeed: (text: string) => void
  expandNode: (id: string, steer?: string) => Promise<void>
  dismissNode: (id: string) => void
  mergeNodes: (id1: string, id2: string) => Promise<void>
  addUserNode: (text: string, position: Position, connectFromId?: string) => void
  moveNode: (id: string, position: Position) => void
  moveNodes: (updates: Record<string, Position>) => void
  setDraggedNode: (id: string | null) => void
  setMergeTarget: (id: string | null) => void
  setPendingNodePosition: (position: Position | null) => void
  compose: () => Promise<void>
  clearComposeResult: () => void
  pan: (dx: number, dy: number) => void
  zoom: (delta: number, center: Position) => void
}

function getContextNodes(
  nodes: Record<string, NodeData>,
  connections: [string, string][],
  startId: string,
  maxDepth: number = CONTEXT_MAX_DEPTH,
  maxNodes: number = CONTEXT_MAX_NODES,
): string[] {
  // Unified adjacency — treat parent-child and user-drawn connections equally.
  const adj = new Map<string, Set<string>>()
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set())
    if (!adj.has(b)) adj.set(b, new Set())
    adj.get(a)!.add(b)
    adj.get(b)!.add(a)
  }
  for (const id of Object.keys(nodes)) {
    const n = nodes[id]
    if (n.status !== 'active') continue
    if (n.parentId && nodes[n.parentId]?.status === 'active') {
      link(n.id, n.parentId)
    }
  }
  for (const [a, b] of connections) {
    if (nodes[a]?.status === 'active' && nodes[b]?.status === 'active') {
      link(a, b)
    }
  }

  // BFS outward from the target; closest first.
  const visited = new Set<string>([startId])
  const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }]
  const result: string[] = []
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    if (depth >= maxDepth) continue
    const neighbors = adj.get(id)
    if (!neighbors) continue
    for (const nid of neighbors) {
      if (visited.has(nid)) continue
      visited.add(nid)
      const text = nodes[nid]?.text
      if (text) {
        result.push(text)
        if (result.length >= maxNodes) return result
      }
      queue.push({ id: nid, depth: depth + 1 })
    }
  }
  return result
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
  selectedConnectionIds: [],
  connectionDrag: null,
  connections: [],
  draggedNodeId: null,
  steerPrompt: null,
  pendingConnectionSource: null,

  setPendingConnectionSource: (id) => set({ pendingConnectionSource: id }),
  setSteerPrompt: (prompt) => set({ steerPrompt: prompt }),
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
  selectNode: (id) => set({ selectedNodeId: id, selectedNodeIds: id ? [id] : [], selectedConnectionIds: [] }),
  toggleNodeSelected: (id) =>
    set((s) => {
      const has = s.selectedNodeIds.includes(id)
      const nextIds = has
        ? s.selectedNodeIds.filter((x) => x !== id)
        : [...s.selectedNodeIds, id]
      return {
        selectedNodeIds: nextIds,
        selectedNodeId: nextIds.length === 1 ? nextIds[0] : null,
        selectedConnectionIds: [],
      }
    }),
  selectConnection: (conn) =>
    set({
      selectedConnectionIds: conn ? [conn] : [],
      selectedNodeId: null,
      selectedNodeIds: [],
    }),
  selectInRect: (rect) =>
    set((s) => {
      const activeNodes = Object.values(s.nodes).filter((n) => n.status === 'active')
      const ids = activeNodes
        .filter(
          (n) =>
            n.position.x >= rect.x &&
            n.position.x <= rect.x + rect.w &&
            n.position.y >= rect.y &&
            n.position.y <= rect.y + rect.h,
        )
        .map((n) => n.id)
      const idSet = new Set(ids)

      const connIds: Array<[string, string]> = []
      for (const id of ids) {
        const n = s.nodes[id]
        if (n.parentId && idSet.has(n.parentId)) {
          connIds.push([n.parentId, id])
        }
      }
      for (const [a, b] of s.connections) {
        if (idSet.has(a) && idSet.has(b)) {
          connIds.push([a, b])
        }
      }
      return {
        selectedNodeIds: ids,
        selectedNodeId: ids.length === 1 ? ids[0] : null,
        selectedConnectionIds: connIds,
      }
    }),
  deleteSelection: () =>
    set((s) => {
      const hasConns = s.selectedConnectionIds.length > 0
      const hasNodes = s.selectedNodeIds.length > 0
      if (!hasConns && !hasNodes) return s

      const newNodes = { ...s.nodes }
      let newConnections = s.connections

      // Delete selected connections (parent-child or user-drawn)
      if (hasConns) {
        const userConnsToRemove = new Set<string>()
        for (const [a, b] of s.selectedConnectionIds) {
          const nodeA = newNodes[a]
          const nodeB = newNodes[b]
          if (!nodeA || !nodeB) continue
          if (nodeB.parentId === a) {
            newNodes[b] = { ...nodeB, parentId: null }
            newNodes[a] = {
              ...nodeA,
              childIds: nodeA.childIds.filter((c) => c !== b),
            }
          } else if (nodeA.parentId === b) {
            newNodes[a] = { ...nodeA, parentId: null }
            newNodes[b] = {
              ...nodeB,
              childIds: nodeB.childIds.filter((c) => c !== a),
            }
          } else {
            userConnsToRemove.add(`${a}|${b}`)
            userConnsToRemove.add(`${b}|${a}`)
          }
        }
        if (userConnsToRemove.size > 0) {
          newConnections = newConnections.filter(
            ([x, y]) =>
              !userConnsToRemove.has(`${x}|${y}`) &&
              !userConnsToRemove.has(`${y}|${x}`),
          )
        }
      }

      // Delete selected nodes (no cascade — children survive as orphans)
      if (hasNodes) {
        const deletingSet = new Set(s.selectedNodeIds)
        s.selectedNodeIds.forEach((nodeId) => {
          const node = newNodes[nodeId]
          if (!node) return
          // Orphan children not also being deleted
          node.childIds.forEach((childId) => {
            if (!deletingSet.has(childId) && newNodes[childId])
              newNodes[childId] = { ...newNodes[childId], parentId: null }
          })
          // Remove from parent's childIds
          if (node.parentId && !deletingSet.has(node.parentId) && newNodes[node.parentId]) {
            const parent = newNodes[node.parentId]
            newNodes[node.parentId] = { ...parent, childIds: parent.childIds.filter((c) => c !== nodeId) }
          }
          newNodes[nodeId] = { ...node, status: 'dismissed', childIds: [] }
        })
      }

      return {
        nodes: newNodes,
        connections: newConnections,
        selectedNodeId: null,
        selectedNodeIds: [],
        selectedConnectionIds: [],
      }
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

  expandNode: async (id, steer) => {
    const state = get()
    const node = state.nodes[id]
    if (!node || state.isLoading) return

    set({ isLoading: id, steerPrompt: null })

    try {
      const contextNodes = getContextNodes(state.nodes, state.connections, id)
      const branches = await generateBranches(node.text, contextNodes, steer)

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

      const trimmedSteer = steer?.trim()
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
        steer: trimmedSteer || undefined,
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
      const node = newNodes[id]
      if (!node) return s
      // Orphan children (keep them alive, just detach)
      node.childIds.forEach((childId) => {
        if (newNodes[childId]) newNodes[childId] = { ...newNodes[childId], parentId: null }
      })
      // Remove from parent's childIds
      if (node.parentId && newNodes[node.parentId]) {
        const parent = newNodes[node.parentId]
        newNodes[node.parentId] = { ...parent, childIds: parent.childIds.filter((c) => c !== id) }
      }
      newNodes[id] = { ...node, status: 'dismissed', childIds: [] }
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

  addUserNode: (text, position, connectFromId) => {
    const id = crypto.randomUUID()
    set((s) => {
      const newConnections =
        connectFromId && s.nodes[connectFromId]
          ? ([...s.connections, [connectFromId, id]] as [string, string][])
          : s.connections
      return {
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
        connections: newConnections,
        pendingNodePosition: null,
        pendingConnectionSource: null,
      }
    })
  },

  moveNode: (id, position) => {
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: { ...s.nodes[id], position },
      },
    }))
  },

  moveNodes: (updates) =>
    set((s) => {
      const newNodes = { ...s.nodes }
      for (const [id, pos] of Object.entries(updates)) {
        if (newNodes[id]) {
          newNodes[id] = { ...newNodes[id], position: pos }
        }
      }
      return { nodes: newNodes }
    }),

  setDraggedNode: (id) => set({ draggedNodeId: id }),

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
