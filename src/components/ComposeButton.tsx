import { useBrainstormStore } from '../store'

export function ComposeButton() {
  const compose = useBrainstormStore((s) => s.compose)
  const composeResult = useBrainstormStore((s) => s.composeResult)
  const clearComposeResult = useBrainstormStore((s) => s.clearComposeResult)
  const isLoading = useBrainstormStore((s) => s.isLoading)
  const nodeCount = useBrainstormStore(
    (s) => Object.values(s.nodes).filter((n) => n.status === 'active').length,
  )

  if (nodeCount < 2 && !composeResult) return null

  return (
    <>
      <button
        onClick={compose}
        disabled={isLoading === 'compose'}
        className="fixed bottom-6 right-6 px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 text-sm disabled:opacity-50 z-40"
      >
        {isLoading === 'compose' ? 'Composing...' : 'Compose'}
      </button>

      {composeResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white border border-neutral-300 rounded-lg p-6 max-w-lg w-full mx-4">
            <pre className="whitespace-pre-wrap text-sm mb-4">
              {composeResult}
            </pre>
            <button
              onClick={clearComposeResult}
              className="px-3 py-1 border border-neutral-300 rounded text-sm hover:bg-neutral-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
