import { useBrainstormStore } from '../store'

export function ComposeButton() {
  const compose = useBrainstormStore((s) => s.compose)
  const composeResult = useBrainstormStore((s) => s.composeResult)
  const clearComposeResult = useBrainstormStore((s) => s.clearComposeResult)
  const isLoading = useBrainstormStore((s) => s.isLoading)
  const nodeCount = useBrainstormStore(
    (s) => Object.values(s.nodes).filter((n) => n.status === 'active').length,
  )
  const hasSelection = useBrainstormStore((s) => s.selectedNodeId !== null)

  if (!composeResult && (nodeCount < 2 || hasSelection)) return null

  return (
    <>
      {!hasSelection && nodeCount >= 2 && (
        <button
          onClick={compose}
          disabled={isLoading === 'compose'}
          className="fixed bottom-6 right-6 px-[16px] py-[8px] rounded-[8px] bg-chip hover:bg-[#eee] text-[14px] font-medium text-ink disabled:opacity-50 z-40 transition-colors"
        >
          {isLoading === 'compose' ? 'Composing...' : 'Compose'}
        </button>
      )}

      {composeResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white rounded-[13px] p-6 max-w-lg w-full mx-4">
            <pre className="whitespace-pre-wrap text-[14px] text-ink leading-[1.5] mb-4">
              {composeResult}
            </pre>
            <button
              onClick={clearComposeResult}
              className="px-[16px] py-[8px] rounded-[8px] bg-chip hover:bg-[#eee] text-[14px] font-medium text-ink transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
