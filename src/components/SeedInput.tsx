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
        className="text-lg px-6 py-4 rounded-full outline-none bg-white text-ink placeholder:text-ink/40 w-[28rem] max-w-[80vw]"
        autoFocus
      />
    </form>
  )
}
