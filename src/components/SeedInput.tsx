import { useState } from 'react'
import { motion } from 'framer-motion'
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
      <motion.div
        layoutId="seed-shell"
        className="bg-white rounded-full px-6 py-4 w-[28rem] max-w-[80vw]"
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.input
          exit={{ opacity: 0 }}
          transition={{ duration: 0 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="text-lg outline-none bg-transparent text-ink placeholder:text-ink/40 w-full"
          autoFocus
        />
      </motion.div>
    </form>
  )
}
