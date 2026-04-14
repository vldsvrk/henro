import { useState, useCallback } from 'react'
import { useBrainstormStore } from '../store'

export function NodeInput() {
  const [text, setText] = useState('')
  const pendingNodePosition = useBrainstormStore((s) => s.pendingNodePosition)
  const addUserNode = useBrainstormStore((s) => s.addUserNode)
  const setPendingNodePosition = useBrainstormStore(
    (s) => s.setPendingNodePosition,
  )
  const viewport = useBrainstormStore((s) => s.viewport)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (text.trim() && pendingNodePosition) {
        addUserNode(text.trim(), pendingNodePosition)
        setText('')
      }
    },
    [text, pendingNodePosition, addUserNode],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingNodePosition(null)
        setText('')
      }
    },
    [setPendingNodePosition],
  )

  if (!pendingNodePosition) return null

  // Convert canvas coords to screen coords
  const screenX =
    pendingNodePosition.x * viewport.zoom + viewport.x + window.innerWidth / 2
  const screenY =
    pendingNodePosition.y * viewport.zoom + viewport.y + window.innerHeight / 2

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed z-50"
      style={{
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (text.trim() && pendingNodePosition) {
            addUserNode(text.trim(), pendingNodePosition)
          }
          setPendingNodePosition(null)
          setText('')
        }}
        placeholder="Your thought..."
        className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg outline-none focus:border-neutral-500"
        autoFocus
      />
    </form>
  )
}
