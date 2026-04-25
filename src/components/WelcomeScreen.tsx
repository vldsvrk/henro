import { useState } from 'react'
import { motion } from 'framer-motion'
import { writeConfig } from '../lib/config'
import { DURATION, EASE } from '../lib/motion'

export function WelcomeScreen() {
  const [key, setKey] = useState('')

  const save = () => {
    const trimmed = key.trim()
    if (!trimmed) return
    writeConfig({ apiKey: trimmed })
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.medium, ease: EASE.out }}
        className="bg-white rounded-card p-6 w-full max-w-md flex flex-col gap-3.5"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-display font-semibold text-ink tracking-[-0.01em]">
            Welcome to Henro
          </h1>
          <p className="text-button text-ink/60 leading-[1.5]">
            Paste your OpenRouter API key to start brainstorming. Your key
            stays in this browser — nothing is sent anywhere else.
          </p>
        </div>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ui text-ink/70 hover:text-ink underline underline-offset-2 self-start"
        >
          Get a key →
        </a>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
          }}
          placeholder="sk-or-..."
          autoFocus
          className="text-button bg-surface-soft rounded-lg px-3 py-2.5 w-full outline-none text-ink placeholder:text-ink/40"
        />

        <button
          onClick={save}
          disabled={!key.trim()}
          className="text-button font-medium bg-ink text-white rounded-lg px-4 py-2.5 self-end hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Save
        </button>
      </motion.div>
    </div>
  )
}
