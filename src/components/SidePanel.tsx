import { AnimatePresence, motion } from 'framer-motion'
import { useBrainstormStore } from '../store'
import { BranchIcon, PromptIcon } from './icons'
import { TRANSITION } from '../lib/motion'

export function SidePanel() {
  const selectedNodeId = useBrainstormStore((s) => s.selectedNodeId)
  const selectedNodeIds = useBrainstormStore((s) => s.selectedNodeIds)
  const nodes = useBrainstormStore((s) => s.nodes)
  const updateNodeText = useBrainstormStore((s) => s.updateNodeText)
  const dismissNode = useBrainstormStore((s) => s.dismissNode)
  const selectNode = useBrainstormStore((s) => s.selectNode)
  const setSteerPrompt = useBrainstormStore((s) => s.setSteerPrompt)
  const beginTextEdit = useBrainstormStore((s) => s.beginTextEdit)
  const commitTextEdit = useBrainstormStore((s) => s.commitTextEdit)

  const node = selectedNodeId ? nodes[selectedNodeId] : null
  const visible = !!(
    node &&
    node.status === 'active' &&
    selectedNodeIds.length <= 1
  )

  const activeChildCount = node
    ? node.childIds.filter((id) => nodes[id]?.status === 'active').length
    : 0
  const hasActiveChildren = activeChildCount > 0
  const parent = node?.parentId ? nodes[node.parentId] : null
  const isAI = node?.origin === 'ai'

  return (
    <AnimatePresence>
      {visible && node && (
        <motion.div
          key="side-panel"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={TRANSITION.snappy}
          className="fixed top-0 right-0 h-screen w-[320px] p-3 z-30 flex items-stretch pointer-events-none"
        >
      <div className="flex-1 bg-white rounded-xl flex flex-col p-2 gap-2 overflow-hidden pointer-events-auto">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-body text-ink/60">
            {isAI ? 'AI Response' : 'Your Thought'}
          </span>
          <div className="flex items-center gap-2 text-caption text-ink/60">
            <span>Depth: {node.depth}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-ink/40" />
            <span>Children: {activeChildCount}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="flex flex-col gap-3">
            <div className="px-2">
              <textarea
                key={node.id}
                value={node.text}
                onFocus={() => beginTextEdit(node.id)}
                onBlur={commitTextEdit}
                onChange={(e) => updateNodeText(node.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    ;(e.target as HTMLTextAreaElement).blur()
                  }
                }}
                className="w-full min-h-[110px] max-h-[50vh] py-3 px-3.5 text-ui font-medium bg-surface-soft rounded-control resize-none outline-none text-ink leading-[1.4] overflow-y-auto [field-sizing:content]"
                rows={4}
              />
            </div>

            {isAI && (
              <div className="flex flex-col">
                {parent && (
                  <p className="px-3.5 py-1.25 text-body leading-[1.5] text-ink break-words">
                    <BranchIcon className="inline-block w-3 h-3 text-[#A5A6A6] mr-1.5 align-[-2px]" />
                    <span className="text-ink/60">Branched from: </span>
                    <span className="font-medium">{parent.text}</span>
                  </p>
                )}
                <p className="px-3.5 py-1.25 text-body leading-[1.5] text-ink break-words">
                  <PromptIcon className="inline-block w-3 h-3 text-[#A5A6A6] mr-1.5 align-[-2px]" />
                  <span className="text-ink/60">Prompt: </span>
                  <span className="font-medium">
                    {node.steer ?? 'brainstorm ideas'}
                  </span>
                </p>
                {parent && (
                  <button
                    onClick={() => {
                      selectNode(parent.id)
                      setSteerPrompt({
                        nodeId: parent.id,
                        defaultValue: node.steer ?? 'brainstorm ideas',
                      })
                    }}
                    className="self-start ml-3.5 mt-1.5 text-caption text-ink/60 hover:text-ink underline underline-offset-2"
                  >
                    Re-branch with different lens
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                if (hasActiveChildren) {
                  selectNode(null)
                } else {
                  setSteerPrompt({
                    nodeId: node.id,
                    defaultValue: 'brainstorm ideas',
                  })
                }
              }}
              className="flex-1 px-3.5 py-1.75 text-ui font-medium bg-chip rounded-lg text-ink hover:bg-chip-hover transition-colors"
            >
              Expand
            </button>
            <button
              onClick={() => {
                dismissNode(node.id)
                selectNode(null)
              }}
              className="flex-1 px-3.5 py-1.75 text-ui font-medium bg-danger-soft rounded-lg text-danger hover:brightness-95 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
