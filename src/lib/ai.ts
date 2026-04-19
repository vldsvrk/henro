import { DEFAULT_BRANCH_COUNT, DEFAULT_SYSTEM_PROMPT } from './prompts'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function getConfig() {
  const stored = localStorage.getItem('openrouter-config')
  let parsed: Record<string, unknown> = {}
  if (stored) {
    try {
      parsed = JSON.parse(stored)
    } catch {}
  }
  const branchCountRaw = Number(parsed.branchCount)
  const systemPrompt =
    typeof parsed.systemPrompt === 'string' && parsed.systemPrompt.trim()
      ? parsed.systemPrompt
      : DEFAULT_SYSTEM_PROMPT
  return {
    apiKey:
      (parsed.apiKey as string) || import.meta.env.VITE_OPENROUTER_API_KEY || '',
    model: (parsed.model as string) || 'google/gemini-3-flash-preview',
    branchCount:
      Number.isFinite(branchCountRaw) && branchCountRaw > 0
        ? Math.min(10, Math.floor(branchCountRaw))
        : DEFAULT_BRANCH_COUNT,
    systemPrompt,
  }
}

async function chat(
  messages: { role: string; content: string }[],
  label = 'chat',
): Promise<string> {
  const { apiKey, model } = getConfig()

  if (!apiKey) {
    throw new Error('OpenRouter API key not set. Add it in Settings.')
  }

  console.groupCollapsed(`[AI] ${label}`)
  console.log('model:', model)
  messages.forEach((m) => console.log(`${m.role}:\n${m.content}`))

  const maxRetries = 3
  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Henor Brainstorm',
        },
        body: JSON.stringify({ model, messages }),
      })

      if (res.status === 429 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
        await new Promise((r) => setTimeout(r, wait))
        continue
      }

      if (!res.ok) {
        const err = await res.text()
        console.error('error:', res.status, err)
        throw new Error(`OpenRouter error ${res.status}: ${err}`)
      }

      const data = await res.json()
      const content = data.choices[0].message.content
      console.log('response:', content)
      return content
    }

    throw new Error('Rate limited after retries. Try again in a moment.')
  } finally {
    console.groupEnd()
  }
}

export async function generateBranches(
  text: string,
  contextNodes: string[],
  steer?: string,
): Promise<string[]> {
  const { branchCount, systemPrompt } = getConfig()

  const trimmedSteer = steer?.trim()
  const lensStr = trimmedSteer ? `\nLens: ${trimmedSteer}.` : ''
  const contextStr =
    contextNodes.length > 0
      ? `\n\nRelated context (background — do not repeat, do not branch from these):\n${contextNodes.map((n) => `- ${n}`).join('\n')}`
      : ''

  const system = `${systemPrompt}\n\nReturn ONLY a JSON array of ${branchCount} strings. No markdown, no explanation.`
  const user = `Target to branch from: "${text}"${lensStr}${contextStr}\n\nReturn ${branchCount} new ideas branching from the target, as a JSON array of strings. Stay grounded in the direction the brainstorm is heading.`

  const raw = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    'generateBranches',
  )

  try {
    const parsed = JSON.parse(raw.trim())
    if (Array.isArray(parsed) && parsed.length >= 1) {
      return parsed.slice(0, branchCount).map(String)
    }
  } catch {
    // Fallback: split by newlines, strip numbering
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^\d+[.)]\s*/, '').trim())
      .filter(Boolean)
    if (lines.length >= 1) return lines.slice(0, branchCount)
  }

  return Array.from(
    { length: branchCount },
    (_, i) => `${text} — variation ${String.fromCharCode(65 + i)}`,
  )
}

export async function mergeIdeas(a: string, b: string): Promise<string> {
  return chat(
    [
      {
        role: 'system',
        content:
          'You merge two ideas into one concise synthesis. Return ONLY the merged idea, 1-2 sentences max.',
      },
      {
        role: 'user',
        content: `Merge these ideas:\n1. ${a}\n2. ${b}`,
      },
    ],
    'mergeIdeas',
  )
}

export async function compose(texts: string[]): Promise<string> {
  return chat(
    [
      {
        role: 'system',
        content:
          'You synthesize multiple brainstorm ideas into a coherent summary. Be concise but comprehensive.',
      },
      {
        role: 'user',
        content: `Synthesize these brainstorm ideas into a coherent summary:\n\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
      },
    ],
    'compose',
  )
}
