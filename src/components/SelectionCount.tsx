import { AnimatePresence, motion } from 'framer-motion'
import { useBrainstormStore } from '../store'
import { TRANSITION } from '../lib/motion'

export function SelectionCount() {
  const selectedNodeIds = useBrainstormStore((s) => s.selectedNodeIds)
  const selectNode = useBrainstormStore((s) => s.selectNode)
  const deleteSelection = useBrainstormStore((s) => s.deleteSelection)

  const visible = selectedNodeIds.length > 1

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={TRANSITION.fast}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 p-0.5 bg-white rounded-control"
        >
          <span className="px-3.75 text-body text-ink/80">
            {selectedNodeIds.length} selected
          </span>
          <button
            onClick={() => selectNode(null)}
            className="px-2.5 py-1.25 text-body font-medium bg-chip rounded-lg text-ink hover:bg-chip-hover transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => deleteSelection()}
            className="px-2.5 py-1.25 text-body font-medium bg-danger-soft rounded-lg text-danger hover:brightness-95 transition-colors"
          >
            Delete
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
