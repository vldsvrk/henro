import { useState, useCallback } from 'react'
import { useBrainstormStore } from '../store'

export function NodeInput() {
  const [text, setText] = useState('')
  const pendingNodePosition = useBrainstormStore((s) => s.pendingNodePosition)
  const pendingConnectionSource = useBrainstormStore((s) => s.pendingConnectionSource)
  const addUserNode = useBrainstormStore((s) => s.addUserNode)
  const setPendingNodePosition = useBrainstormStore(
    (s) => s.setPendingNodePosition,
  )
  const setPendingConnectionSource = useBrainstormStore(
    (s) => s.setPendingConnectionSource,
  )
  const viewport = useBrainstormStore((s) => s.viewport)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (text.trim() && pendingNodePosition) {
        addUserNode(text.trim(), pendingNodePosition, pendingConnectionSource ?? undefined)
        setText('')
      }
    },
    [text, pendingNodePosition, pendingConnectionSource, addUserNode],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingNodePosition(null)
        setPendingConnectionSource(null)
        setText('')
      }
    },
    [setPendingNodePosition, setPendingConnectionSource],
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
            addUserNode(text.trim(), pendingNodePosition, pendingConnectionSource ?? undefined)
          }
          setPendingNodePosition(null)
          setPendingConnectionSource(null)
          setText('')
        }}
        placeholder="Your thought..."
        className="px-3.75 py-2.75 text-body rounded-bubble outline-none bg-white text-ink placeholder:text-ink/40 w-[180px]"
        autoFocus
      />
    </form>
  )
}
