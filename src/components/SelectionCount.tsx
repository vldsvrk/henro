import { AnimatePresence, motion } from 'framer-motion'
import { useBrainstormStore } from '../store'

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
          transition={{ duration: 0.15 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 bg-white border border-neutral-300 rounded-full shadow-md"
        >
          <span className="text-sm text-neutral-700">
            {selectedNodeIds.length} selected
          </span>
          <span className="w-px h-4 bg-neutral-200" />
          <button
            onClick={() => selectNode(null)}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            Clear
          </button>
          <button
            onClick={() => deleteSelection()}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
