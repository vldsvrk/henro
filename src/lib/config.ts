import { useSyncExternalStore } from 'react'

export const CONFIG_KEY = 'openrouter-config'

export type OpenRouterConfig = {
  apiKey: string
  model?: string
  branchCount?: number
  systemPrompt?: string
}

const ENV_API_KEY =
  (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) || ''

export function readConfig(): OpenRouterConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return { apiKey: ENV_API_KEY }
    const parsed = JSON.parse(raw) as Partial<OpenRouterConfig>
    return { ...parsed, apiKey: parsed.apiKey || ENV_API_KEY }
  } catch {
    return { apiKey: ENV_API_KEY }
  }
}

const listeners = new Set<() => void>()

export function writeConfig(next: Partial<OpenRouterConfig>) {
  const merged = { ...readConfig(), ...next }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged))
  listeners.forEach((cb) => cb())
}

/** Loose shape check for OpenRouter keys — they're `sk-or-...` followed by
 * a long base64/hex blob. Lenient on purpose: we only want to catch obvious
 * mistakes (random words, half-pasted strings), not gatekeep real keys. */
export function looksLikeOpenRouterKey(key: string): boolean {
  return /^sk-or-[a-zA-Z0-9_-]{20,}$/.test(key.trim())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  // Cross-tab updates: localStorage 'storage' event fires in *other* tabs.
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONFIG_KEY) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot() {
  return readConfig().apiKey.trim().length > 0
}

export function useHasApiKey() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
