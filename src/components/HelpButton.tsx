import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TRANSITION } from '../lib/motion'

type Shortcut = {
  keys: string[]
  description: string
}

type Section = {
  title: string
  items: Shortcut[]
}

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

const SECTIONS: Section[] = [
  {
    title: 'Hidden gestures',
    items: [
      { keys: ['Double-click canvas'], description: 'Add a new node at the cursor' },
      { keys: ['Double-click node'], description: 'Expand a node with a custom AI prompt' },
      { keys: ['Double-click node', 'drag'], description: 'Pull a connection from a node — drop on another to link, on empty space to spawn a new one' },
      { keys: ['Drag onto node'], description: 'Merge two nodes together' },
      { keys: ['Shift', 'click'], description: 'Add or remove a node from selection' },
      { keys: ['Click empty', 'drag'], description: 'Rubber-band select multiple nodes' },
      { keys: ['Space', 'drag'], description: 'Pan the canvas from anywhere' },
    ],
  },
  {
    title: 'Shortcuts',
    items: [
      { keys: [`${MOD}`, 'Z'], description: 'Undo' },
      { keys: [`${MOD}`, 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Backspace'], description: 'Delete selected nodes or connections' },
    ],
  },
]

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-5.5 h-5.5 px-1.75 rounded-md bg-surface-soft text-ink text-caption font-medium leading-none align-middle">
      {children}
    </span>
  )
}

export function HelpButton() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 left-6 z-40 flex flex-col-reverse gap-2.5 items-start"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Help and shortcuts"
        title="Help and shortcuts"
        className={`w-7 h-7 flex items-center justify-center rounded-full text-ui font-semibold transition-colors ${
          open
            ? 'bg-ink text-white'
            : 'bg-white text-ink hover:bg-chip'
        }`}
      >
        ?
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="help-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={TRANSITION.base}
            className="bg-white rounded-card p-3.5 w-[340px] max-h-[70vh] overflow-y-auto flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-ui font-medium text-ink">
                How to use henro
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink/40 hover:text-ink text-button leading-none"
              >
                ×
              </button>
            </div>

            {SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-2">
                <div className="text-caption uppercase tracking-[0.06em] text-ink/50">
                  {section.title}
                </div>
                <ul className="flex flex-col gap-2.5">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="text-body text-ink/70 leading-[1.7] pl-1.5"
                    >
                      <span className="-ml-1.5">
                        {item.keys.map((k, j) => (
                          <span key={j}>
                            <Key>{k}</Key>
                            {j < item.keys.length - 1 && (
                              <span className="text-ink/30 text-caption mx-0.75">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                      <span className="ml-2">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
