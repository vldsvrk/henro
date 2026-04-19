import { useRef, useCallback, useEffect } from 'react'
import { useBrainstormStore } from '../store'
import { resolveOverlaps } from './physics'

/**
 * Runs overlap resolution for a few frames after a drag ends.
 * Mount once (e.g. in App).  No springs, no oscillation — just pushes
 * overlapping nodes apart then stops.
 */
export function usePhysics() {
  const rafId = useRef(0)
  const running = useRef(false)
  const framesLeft = useRef(0)

  const loop = useCallback(() => {
    const state = useBrainstormStore.getState()
    const active = Object.values(state.nodes).filter((n) => n.status === 'active')

    const updates = resolveOverlaps(active)
    if (updates) state.moveNodes(updates)

    framesLeft.current--

    if (updates && framesLeft.current > 0) {
      rafId.current = requestAnimationFrame(loop)
    } else {
      running.current = false
    }
  }, [])

  const settle = useCallback(() => {
    if (running.current) return
    running.current = true
    framesLeft.current = 20
    rafId.current = requestAnimationFrame(loop)
  }, [loop])

  // Trigger settling when drag ends
  useEffect(() => {
    let prev: string | null = null
    const unsub = useBrainstormStore.subscribe((state) => {
      const cur = state.draggedNodeId
      if (!cur && prev) settle()
      prev = cur
    })
    return () => {
      unsub()
      cancelAnimationFrame(rafId.current)
      running.current = false
    }
  }, [settle])
}
