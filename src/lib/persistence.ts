import type { StateStorage } from 'zustand/middleware'

const INDEX_KEY = 'henro:projects:index'
const PROJECT_PREFIX = 'henro:project:'
const SCHEMA_VERSION = 1

export type ProjectMeta = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

type PersistedIndex = {
  version: number
  currentId: string | null
  projects: ProjectMeta[]
}

type PersistedProject = {
  version: number
  nodes: unknown
  connections: unknown
  viewport: unknown
  seedNodeId: unknown
  composeResult?: unknown
}

function readIndex(): PersistedIndex | null {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedIndex
  } catch {
    return null
  }
}

function readProject(id: string): PersistedProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_PREFIX + id)
    if (!raw) return null
    return JSON.parse(raw) as PersistedProject
  } catch {
    return null
  }
}

export const henroStorage: StateStorage = {
  getItem: (_name) => {
    const index = readIndex()
    if (!index) return null
    const currentId = index.currentId
    const project = currentId ? readProject(currentId) : null

    const state = {
      nodes: project?.nodes ?? {},
      connections: project?.connections ?? [],
      viewport: project?.viewport ?? { x: 0, y: 0, zoom: 1 },
      seedNodeId: project?.seedNodeId ?? null,
      composeResult: project?.composeResult ?? null,
      currentProjectId: currentId,
      projectsIndex: index.projects ?? [],
    }

    return JSON.stringify({ state, version: SCHEMA_VERSION })
  },

  setItem: (_, value) => {
    let parsed: { state?: Record<string, unknown> }
    try {
      parsed = JSON.parse(value) as { state?: Record<string, unknown> }
    } catch {
      return
    }
    const s = parsed.state
    if (!s) return

    const currentId = (s.currentProjectId as string | null) ?? null
    const projectsIndex = (s.projectsIndex as ProjectMeta[]) ?? []

    const nextIndex: PersistedIndex = {
      version: SCHEMA_VERSION,
      currentId,
      projects: projectsIndex,
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(nextIndex))

    if (currentId) {
      const nextProject: PersistedProject = {
        version: SCHEMA_VERSION,
        nodes: s.nodes,
        connections: s.connections,
        viewport: s.viewport,
        seedNodeId: s.seedNodeId,
        composeResult: s.composeResult ?? null,
      }
      localStorage.setItem(
        PROJECT_PREFIX + currentId,
        JSON.stringify(nextProject),
      )
    }
  },

  removeItem: (_name) => {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k === INDEX_KEY || k.startsWith(PROJECT_PREFIX))) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  },
}

export function deleteProjectStorage(id: string) {
  localStorage.removeItem(PROJECT_PREFIX + id)
}

export type ProjectData = {
  nodes: unknown
  connections: unknown
  viewport: unknown
  seedNodeId: unknown
  composeResult: unknown
}

export function readProjectData(id: string): ProjectData | null {
  const p = readProject(id)
  if (!p) return null
  return {
    nodes: p.nodes,
    connections: p.connections,
    viewport: p.viewport,
    seedNodeId: p.seedNodeId,
    composeResult: p.composeResult ?? null,
  }
}
