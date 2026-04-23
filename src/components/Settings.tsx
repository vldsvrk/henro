import { useState, useEffect } from 'react'
import { useBrainstormStore } from '../store'
import {
  SYSTEM_PROMPT_PRESETS,
  PRESET_LABELS,
  DEFAULT_BRANCH_COUNT,
  DEFAULT_SYSTEM_PROMPT,
  type PresetKey,
} from '../lib/prompts'
import { readConfig, writeConfig } from '../lib/config'
import { BranchIcon } from './icons'

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5'

export function Settings() {
  const [showAI, setShowAI] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [branchCount, setBranchCount] = useState(DEFAULT_BRANCH_COUNT)
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT)

  useEffect(() => {
    const c = readConfig()
    setApiKey(c.apiKey || '')
    setModel(c.model || DEFAULT_MODEL)
    const n = Number(c.branchCount)
    setBranchCount(Number.isFinite(n) && n > 0 ? n : DEFAULT_BRANCH_COUNT)
    setSystemPrompt(
      typeof c.systemPrompt === 'string' && c.systemPrompt.trim()
        ? c.systemPrompt
        : DEFAULT_SYSTEM_PROMPT,
    )
  }, [])

  function saveConfig() {
    writeConfig({ apiKey, model, branchCount, systemPrompt })
    setShowAI(false)
  }

  function adjustBranch(delta: number) {
    const next = Math.min(10, Math.max(1, branchCount + delta))
    if (next === branchCount) return
    setBranchCount(next)
    writeConfig({ branchCount: next })
  }

  function loadPreset(key: PresetKey) {
    setSystemPrompt(SYSTEM_PROMPT_PRESETS[key])
  }

  const hasSelection = useBrainstormStore((s) => s.selectedNodeId !== null)
  const [hidden, setHidden] = useState(hasSelection)
  useEffect(() => {
    if (hasSelection) {
      setHidden(true)
      return
    }
    const t = setTimeout(() => setHidden(false), 200)
    return () => clearTimeout(t)
  }, [hasSelection])
  if (hidden) return null

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center h-[28px] bg-white rounded-[10px] px-[4px]"
          title="Branches per expansion"
        >
          <button
            onClick={() => adjustBranch(-1)}
            disabled={branchCount <= 1}
            aria-label="Decrease branches"
            className="w-[22px] h-[22px] flex items-center justify-center text-ink/70 hover:text-ink disabled:opacity-30 transition-colors text-[14px] leading-none"
          >
            −
          </button>
          <span className="flex items-center gap-[4px] px-[4px] text-[12px] font-medium text-ink min-w-[26px] justify-center">
            <BranchIcon className="w-[11px] h-[11px] text-ink/50" />
            {branchCount}
          </span>
          <button
            onClick={() => adjustBranch(1)}
            disabled={branchCount >= 10}
            aria-label="Increase branches"
            className="w-[22px] h-[22px] flex items-center justify-center text-ink/70 hover:text-ink disabled:opacity-30 transition-colors text-[14px] leading-none"
          >
            +
          </button>
        </div>
        <button
          onClick={() => setShowAI(!showAI)}
          className={`h-[28px] px-[14px] text-[12px] font-medium rounded-[10px] transition-colors ${
            showAI
              ? 'bg-ink text-white'
              : 'bg-white text-ink hover:bg-chip'
          }`}
        >
          AI
        </button>
      </div>

      {showAI && (
        <div className="bg-white rounded-[13px] p-[14px] w-[320px] flex flex-col gap-[10px] max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <label className="text-[12px] text-ink/60">OpenRouter API Key</label>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-ink/50 hover:text-ink underline underline-offset-2"
            >
              Get a key →
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
            className="text-[13px] bg-surface-soft rounded-[8px] px-[12px] py-[8px] w-full outline-none text-ink placeholder:text-ink/40"
          />

          <label className="text-[12px] text-ink/60">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="anthropic/claude-sonnet-4.5"
            className="text-[13px] bg-surface-soft rounded-[8px] px-[12px] py-[8px] w-full outline-none text-ink placeholder:text-ink/40"
          />

          <label className="text-[12px] text-ink/60 mt-[4px]">System prompt</label>
          <div className="flex gap-[6px] flex-wrap">
            {(Object.keys(SYSTEM_PROMPT_PRESETS) as PresetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => loadPreset(key)}
                className="text-[12px] px-[10px] py-[5px] bg-chip rounded-[8px] text-ink hover:bg-[#eee] transition-colors"
              >
                {PRESET_LABELS[key]}
              </button>
            ))}
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="text-[12px] bg-surface-soft rounded-[8px] px-[12px] py-[8px] w-full outline-none resize-none text-ink leading-[1.5]"
          />

          <button
            onClick={saveConfig}
            className="text-[13px] font-medium bg-ink text-white rounded-[8px] px-[16px] py-[8px] self-end hover:opacity-90 mt-[4px] transition-opacity"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
