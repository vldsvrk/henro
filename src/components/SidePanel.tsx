import { useBrainstormStore } from '../store'

export function SidePanel() {
  const selectedNodeId = useBrainstormStore((s) => s.selectedNodeId)
  const nodes = useBrainstormStore((s) => s.nodes)
  const selectNode = useBrainstormStore((s) => s.selectNode)
  const updateNodeText = useBrainstormStore((s) => s.updateNodeText)
  const dismissNode = useBrainstormStore((s) => s.dismissNode)
  const expandNode = useBrainstormStore((s) => s.expandNode)

  if (!selectedNodeId) return null
  const node = nodes[selectedNodeId]
  if (!node || node.status !== 'active') return null

  const hasActiveChildren = node.childIds.some(
    (id) => nodes[id]?.status === 'active',
  )

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-neutral-200 z-30 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <span className="text-sm text-neutral-500">
          {node.origin === 'ai' ? 'AI generated' : 'Your thought'}
        </span>
        <button
          onClick={() => selectNode(null)}
          className="text-neutral-400 hover:text-neutral-600 text-lg"
        >
          ×
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        <textarea
          value={node.text}
          onChange={(e) => updateNodeText(selectedNodeId, e.target.value)}
          className="w-full p-2 text-sm border border-neutral-300 rounded-lg resize-none outline-none focus:border-neutral-500"
          rows={4}
        />

        <div className="flex flex-col gap-2">
          {!hasActiveChildren && (
            <button
              onClick={() => expandNode(selectedNodeId)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Expand
            </button>
          )}
          <button
            onClick={() => {
              dismissNode(selectedNodeId)
              selectNode(null)
            }}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg text-red-500 hover:bg-red-50"
          >
            Dismiss
          </button>
        </div>

        <div className="text-xs text-neutral-400 mt-auto">
          Depth: {node.depth} · {node.childIds.length} children
        </div>
      </div>
    </div>
  )
}
