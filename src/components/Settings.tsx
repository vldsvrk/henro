import { useState, useEffect } from 'react'

function loadConfig() {
  try {
    const stored = localStorage.getItem('openrouter-config')
    if (stored) return JSON.parse(stored)
  } catch {}
  return { apiKey: '', model: 'google/gemini-3-flash-preview' }
}

export function Settings() {
  const [showAI, setShowAI] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('google/gemini-3-flash-preview')

  useEffect(() => {
    const config = loadConfig()
    setApiKey(config.apiKey)
    setModel(config.model)
  }, [])

  function saveConfig() {
    localStorage.setItem('openrouter-config', JSON.stringify({ apiKey, model }))
    setShowAI(false)
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
        <div className="bg-white border border-neutral-300 rounded-lg p-3 shadow-lg w-72 flex flex-col gap-2">
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
          <button
            onClick={saveConfig}
            className="text-xs bg-neutral-800 text-white rounded px-3 py-1 self-end hover:bg-neutral-700"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
