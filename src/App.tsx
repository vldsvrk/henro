import { useEffect } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { useBrainstormStore } from './store'
import { usePhysics } from './lib/usePhysics'
import { useHasApiKey } from './lib/config'
import { Canvas } from './components/Canvas'
import { Connections } from './components/Connections'
import { BubbleNode } from './components/BubbleNode'
import { SeedInput } from './components/SeedInput'
import { NodeInput } from './components/NodeInput'
import { ComposeButton } from './components/ComposeButton'
import { Settings } from './components/Settings'
import { SidePanel } from './components/SidePanel'
import { SelectionCount } from './components/SelectionCount'
import { Toaster } from './components/Toaster'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ProjectSwitcher } from './components/ProjectSwitcher'
import { HelpButton } from './components/HelpButton'

function App() {
  usePhysics()
  const hasApiKey = useHasApiKey()
  const nodes = useBrainstormStore((s) => s.nodes)
  const deleteSelection = useBrainstormStore((s) => s.deleteSelection)
  const undo = useBrainstormStore((s) => s.undo)
  const redo = useBrainstormStore((s) => s.redo)
  const hasSeed = Object.keys(nodes).length > 0
  const activeNodes = Object.values(nodes).filter((n) => n.status === 'active')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName
      const isTextField =
        tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable

      if (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) {
        if (isTextField) return
        e.preventDefault()
        deleteSelection()
        return
      }

      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z') {
        if (isTextField) return
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (key === 'y') {
        if (isTextField) return
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteSelection, undo, redo])

  return (
    <div className="w-screen h-screen bg-canvas text-ink">
      <LayoutGroup>
        {!hasApiKey && <WelcomeScreen />}
        {hasApiKey && (
          <>
            <AnimatePresence>
              {!hasSeed && <SeedInput key="seed-input" />}
            </AnimatePresence>
            {hasSeed && (
              <>
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
                <SidePanel />
                <SelectionCount />
              </>
            )}
            <ProjectSwitcher />
            <Settings />
            <HelpButton />
          </>
        )}
      </LayoutGroup>
      <Toaster />
    </div>
  )
}

export default App
