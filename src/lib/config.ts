import { useSyncExternalStore } from 'react'

export const CONFIG_KEY = 'openrouter-config'
export const CONFIG_CHANGED_EVENT = 'henro:config-changed'

export type OpenRouterConfig = {
  apiKey: string
  model?: string
  branchCount?: number
  systemPrompt?: string
}

export function readConfig(): OpenRouterConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return { apiKey: '' }
    const parsed = JSON.parse(raw) as Partial<OpenRouterConfig>
    return { apiKey: parsed.apiKey || '', ...parsed }
  } catch {
    return { apiKey: '' }
  }
}

export function writeConfig(next: Partial<OpenRouterConfig>) {
  const merged = { ...readConfig(), ...next }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged))
  window.dispatchEvent(new Event(CONFIG_CHANGED_EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(CONFIG_CHANGED_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(CONFIG_CHANGED_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

function getSnapshot() {
  return readConfig().apiKey.trim().length > 0
}

export function useHasApiKey() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
