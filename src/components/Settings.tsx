import { useState, useEffect } from 'react'
import {
  SYSTEM_PROMPT_PRESETS,
  PRESET_LABELS,
  DEFAULT_BRANCH_COUNT,
  DEFAULT_SYSTEM_PROMPT,
  type PresetKey,
} from '../lib/prompts'

const CONFIG_KEY = 'openrouter-config'
const DEFAULT_MODEL = 'google/gemini-3-flash-preview'

function loadConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {
    apiKey: '',
    model: DEFAULT_MODEL,
    branchCount: DEFAULT_BRANCH_COUNT,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  }
}

export function Settings() {
  const [showAI, setShowAI] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [branchCount, setBranchCount] = useState(DEFAULT_BRANCH_COUNT)
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT)

  useEffect(() => {
    const c = loadConfig()
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
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ apiKey, model, branchCount, systemPrompt }),
    )
    setShowAI(false)
  }

  function loadPreset(key: PresetKey) {
    setSystemPrompt(SYSTEM_PROMPT_PRESETS[key])
  }

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 items-end">
      <button
        onClick={() => setShowAI(!showAI)}
        className={`px-2 py-1 text-xs border rounded ${
          showAI
            ? 'border-neutral-800 bg-neutral-800 text-white'
            : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100'
        }`}
      >
        AI
      </button>

      {showAI && (
        <div className="bg-white border border-neutral-300 rounded-lg p-3 shadow-lg w-80 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
          <label className="text-xs text-neutral-500">OpenRouter API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
            className="text-sm border border-neutral-300 rounded px-2 py-1 w-full"
          />

          <label className="text-xs text-neutral-500">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="google/gemini-3-flash-preview"
            className="text-sm border border-neutral-300 rounded px-2 py-1 w-full"
          />

          <label className="text-xs text-neutral-500">Branches per expansion</label>
          <input
            type="number"
            min={1}
            max={10}
            value={branchCount}
            onChange={(e) => {
              const n = Number(e.target.value)
              setBranchCount(
                Number.isFinite(n) && n > 0
                  ? Math.min(10, Math.max(1, Math.floor(n)))
                  : DEFAULT_BRANCH_COUNT,
              )
            }}
            className="text-sm border border-neutral-300 rounded px-2 py-1 w-24"
          />

          <label className="text-xs text-neutral-500 mt-1">System prompt</label>
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(SYSTEM_PROMPT_PRESETS) as PresetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => loadPreset(key)}
                className="text-xs px-2 py-1 border border-neutral-300 rounded hover:bg-neutral-100"
              >
                {PRESET_LABELS[key]}
              </button>
            ))}
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="text-xs border border-neutral-300 rounded px-2 py-1 w-full resize-none leading-relaxed"
          />

          <button
            onClick={saveConfig}
            className="text-xs bg-neutral-800 text-white rounded px-3 py-1 self-end hover:bg-neutral-700 mt-1"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
