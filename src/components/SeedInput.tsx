import { useState } from 'react'
import { useBrainstormStore } from '../store'

export function SeedInput() {
  const [text, setText] = useState('')
  const setSeed = useBrainstormStore((s) => s.setSeed)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      setSeed(text.trim())
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute inset-0 flex items-center justify-center"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        className="text-lg px-4 py-2 border border-neutral-300 rounded-lg outline-none focus:border-neutral-500"
        autoFocus
      />
    </form>
  )
}
