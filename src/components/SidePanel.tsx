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
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed top-0 right-0 h-screen w-[320px] p-3 z-30 flex items-stretch pointer-events-none"
        >
      <div className="flex-1 bg-white rounded-[12px] flex flex-col p-[8px] gap-[8px] overflow-hidden pointer-events-auto">
        <div className="flex items-center justify-between px-[14px] py-[10px]">
          <span className="text-[12px] text-ink/60">
            {isAI ? 'AI Response' : 'Your Thought'}
          </span>
          <div className="flex items-center gap-[8px] text-[11px] text-ink/60">
            <span>Depth: {node.depth}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-ink/40" />
            <span>Children: {activeChildCount}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="flex flex-col gap-[12px]">
            <div className="px-[8px]">
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
                className="w-full min-h-[110px] max-h-[50vh] p-[12px_14px] text-[13px] font-medium bg-surface-soft rounded-[10px] resize-none outline-none text-ink leading-[1.4] overflow-y-auto [field-sizing:content]"
                rows={4}
              />
            </div>

            {isAI && (
              <div className="flex flex-col">
                {parent && (
                  <p className="px-[14px] py-[5px] text-[12px] leading-[1.5] text-ink break-words">
                    <BranchIcon className="inline-block w-[12px] h-[12px] text-ink/40 mr-[6px] align-[-2px]" />
                    <span className="text-ink/60">Branched from: </span>
                    <span className="font-medium">{parent.text}</span>
                  </p>
                )}
                <p className="px-[14px] py-[5px] text-[12px] leading-[1.5] text-ink break-words">
                  <PromptIcon className="inline-block w-[12px] h-[12px] text-ink/40 mr-[6px] align-[-2px]" />
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
                    className="self-start ml-[14px] mt-[6px] text-[11px] text-ink/60 hover:text-ink underline underline-offset-2"
                  >
                    Re-branch with different lens
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-[8px] pt-[8px]">
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
              className="flex-1 px-[14px] py-[7px] text-[13px] font-medium bg-chip rounded-[8px] text-ink hover:bg-[#eee] transition-colors"
            >
              Expand
            </button>
            <button
              onClick={() => {
                dismissNode(node.id)
                selectNode(null)
              }}
              className="flex-1 px-[14px] py-[7px] text-[13px] font-medium bg-danger-soft rounded-[8px] text-danger hover:brightness-95 transition-colors"
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
