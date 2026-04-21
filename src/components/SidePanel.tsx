import { AnimatePresence, motion } from 'framer-motion'
import { useBrainstormStore } from '../store'
import { BranchIcon, PromptIcon } from './icons'

export function SidePanel() {
  const selectedNodeId = useBrainstormStore((s) => s.selectedNodeId)
  const selectedNodeIds = useBrainstormStore((s) => s.selectedNodeIds)
  const nodes = useBrainstormStore((s) => s.nodes)
  const updateNodeText = useBrainstormStore((s) => s.updateNodeText)
  const dismissNode = useBrainstormStore((s) => s.dismissNode)
  const selectNode = useBrainstormStore((s) => s.selectNode)
  const setSteerPrompt = useBrainstormStore((s) => s.setSteerPrompt)

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
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed top-0 right-0 h-screen w-96 p-4 z-30 flex items-stretch pointer-events-none"
        >
      <div className="flex-1 bg-white rounded-[13px] flex flex-col p-[10px] gap-[10px] overflow-hidden pointer-events-auto">
        <div className="flex items-center justify-between px-[20px] py-[15px]">
          <span className="text-sm text-ink/60">
            {isAI ? 'AI Response' : 'Your Thought'}
          </span>
          <div className="flex items-center gap-[10px] text-[12px] text-ink/60">
            <span>Depth: {node.depth}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-ink/40" />
            <span>Children: {activeChildCount}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="flex flex-col gap-4">
            <div className="px-[10px]">
              <textarea
                value={node.text}
                onChange={(e) => updateNodeText(node.id, e.target.value)}
                className="w-full min-h-[139px] max-h-[50vh] p-[15px_20px] text-[15px] font-medium bg-surface-soft rounded-[14px] resize-none outline-none text-ink leading-[1.4] overflow-y-auto [field-sizing:content]"
                rows={4}
              />
            </div>

            {isAI && (
              <div className="flex flex-col">
                {parent && (
                  <div className="flex items-center gap-[5px] px-[20px] py-2 flex-wrap">
                    <BranchIcon className="text-ink/40 shrink-0" />
                    <span className="text-[14px] text-ink/60">
                      Branched from:
                    </span>
                    <span className="text-[14px] font-medium text-ink">
                      {parent.text}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-[5px] px-[20px] py-2">
                  <PromptIcon className="text-ink/40 shrink-0" />
                  <span className="text-[14px] text-ink/60">Prompt:</span>
                  <span className="text-[14px] font-medium text-ink">
                    {node.steer ?? 'brainstorm ideas'}
                  </span>
                </div>
                {parent && (
                  <button
                    onClick={() => {
                      selectNode(parent.id)
                      setSteerPrompt({
                        nodeId: parent.id,
                        defaultValue: node.steer ?? 'brainstorm ideas',
                      })
                    }}
                    className="self-start ml-[20px] mt-[8px] text-[12px] text-ink/60 hover:text-ink underline underline-offset-2"
                  >
                    Re-branch with different lens
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-[10px] pt-[10px]">
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
              className="flex-1 px-[16px] py-[8px] text-[14px] font-medium bg-chip rounded-[8px] text-ink hover:bg-[#eee] transition-colors"
            >
              Expand
            </button>
            <button
              onClick={() => {
                dismissNode(node.id)
                selectNode(null)
              }}
              className="flex-1 px-[16px] py-[8px] text-[14px] font-medium bg-danger-soft rounded-[8px] text-danger hover:brightness-95 transition-colors"
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
