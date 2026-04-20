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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-[2px] p-[2px] bg-white rounded-[10px]"
        >
          <span className="px-[15px] text-[12px] text-ink/80">
            {selectedNodeIds.length} selected
          </span>
          <button
            onClick={() => selectNode(null)}
            className="px-[10px] py-[5px] text-[12px] font-medium bg-chip rounded-[8px] text-ink hover:bg-[#eee] transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => deleteSelection()}
            className="px-[10px] py-[5px] text-[12px] font-medium bg-danger-soft rounded-[8px] text-danger hover:brightness-95 transition-colors"
          >
            Delete
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
