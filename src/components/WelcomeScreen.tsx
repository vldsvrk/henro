import { useState } from 'react'
import { motion } from 'framer-motion'
import { writeConfig } from '../lib/config'

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
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-[13px] p-[24px] w-full max-w-md flex flex-col gap-[14px]"
      >
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[20px] font-semibold text-ink tracking-[-0.01em]">
            Welcome to Henro
          </h1>
          <p className="text-[14px] text-ink/60 leading-[1.5]">
            Paste your OpenRouter API key to start brainstorming. Your key
            stays in this browser — nothing is sent anywhere else.
          </p>
        </div>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-ink/70 hover:text-ink underline underline-offset-2 self-start"
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
          className="text-[14px] bg-surface-soft rounded-[8px] px-[12px] py-[10px] w-full outline-none text-ink placeholder:text-ink/40"
        />

        <button
          onClick={save}
          disabled={!key.trim()}
          className="text-[14px] font-medium bg-ink text-white rounded-[8px] px-[16px] py-[10px] self-end hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Save
        </button>
      </motion.div>
    </div>
  )
}
