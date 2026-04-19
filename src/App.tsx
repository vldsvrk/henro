import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useBrainstormStore } from './store'
import { usePhysics } from './lib/usePhysics'
import { Canvas } from './components/Canvas'
import { Connections } from './components/Connections'
import { BubbleNode } from './components/BubbleNode'
import { SeedInput } from './components/SeedInput'
import { NodeInput } from './components/NodeInput'
import { ComposeButton } from './components/ComposeButton'
import { Settings } from './components/Settings'
import { SidePanel } from './components/SidePanel'
import { SelectionCount } from './components/SelectionCount'

function App() {
  usePhysics()
  const nodes = useBrainstormStore((s) => s.nodes)
  const deleteSelection = useBrainstormStore((s) => s.deleteSelection)
  const hasSeed = Object.keys(nodes).length > 0
  const activeNodes = Object.values(nodes).filter((n) => n.status === 'active')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        deleteSelection()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteSelection])

  if (!hasSeed) {
    return (
      <div className="w-screen h-screen bg-neutral-50">
        <SeedInput />
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-neutral-50">
      <Canvas>
        <Connections />
        <AnimatePresence>
          {activeNodes.map((node) => (
            <BubbleNode key={node.id} node={node} />
          ))}
        </AnimatePresence>
      </Canvas>
      <NodeInput />
      <ComposeButton />
      <Settings />
      <SidePanel />
      <SelectionCount />
    </div>
  )
}

export default App
