import { DEFAULT_BRANCH_COUNT, DEFAULT_SYSTEM_PROMPT } from './prompts'
import { AiError } from './errors'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const RETRY_WALL_CLOCK_MS = 20_000
const NAMING_MODEL = 'anthropic/claude-haiku-4.5'
const DEBUG = import.meta.env.VITE_HENRO_DEBUG === 'true'

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
    apiKey: (parsed.apiKey as string) || '',
    model: (parsed.model as string) || 'anthropic/claude-sonnet-4.5',
    branchCount:
      Number.isFinite(branchCountRaw) && branchCountRaw > 0
        ? Math.min(10, Math.floor(branchCountRaw))
        : DEFAULT_BRANCH_COUNT,
    systemPrompt,
  }
}

async function chat(
  messages: { role: string; content: string }[],
  modelOverride?: string,
  label = 'chat',
): Promise<string> {
  const { apiKey, model: configModel } = getConfig()
  const model = modelOverride || configModel

  if (!apiKey) {
    throw new AiError('no-key', 'OpenRouter API key not set.')
  }

  if (DEBUG) {
    console.groupCollapsed(`%c[AI] ${label}`, 'color:#CA372C;font-weight:500')
    console.log('model:', model)
    messages.forEach((m) =>
      console.log(`%c${m.role}:`, 'color:#888', `\n${m.content}`),
    )
  }

  const maxRetries = 3
  const startedAt = Date.now()

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let res: Response
      try {
        res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Henro',
          },
          body: JSON.stringify({ model, messages }),
        })
      } catch (err) {
        throw new AiError(
          'network',
          err instanceof Error ? err.message : 'Network request failed',
        )
      }

      if (res.status === 429 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt + 1) * 1000 // 2s, 4s, 8s
        if (Date.now() - startedAt + wait > RETRY_WALL_CLOCK_MS) break
        await new Promise((r) => setTimeout(r, wait))
        continue
      }

      if (res.status === 401 || res.status === 403) {
        throw new AiError('auth', 'Invalid API key.', res.status)
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error('OpenRouter error', res.status, body)
        throw new AiError(
          'unknown',
          `OpenRouter error ${res.status}: ${body || res.statusText}`,
          res.status,
        )
      }

      const data = await res.json()
      const content = data.choices[0].message.content as string
      if (DEBUG) console.log('%cresponse:', 'color:#6BDEB9', `\n${content}`)
      return content
    }

    throw new AiError('rate-limit', 'Rate limited. Try again in a moment.', 429)
  } finally {
    if (DEBUG) console.groupEnd()
  }
}

export async function generateBranches(
  text: string,
  directContext: string[],
  widerContext: string[],
  steer?: string,
): Promise<string[]> {
  const { branchCount, systemPrompt } = getConfig()

  const trimmedSteer = steer?.trim()
  const lensStr = trimmedSteer ? `\nLens: ${trimmedSteer}.` : ''
  const directStr =
    directContext.length > 0
      ? `\n\nDirectly connected to the target (parent/siblings/linked — the target is a sub-idea of these; stay consistent with them):\n${directContext.map((n) => `- ${n}`).join('\n')}`
      : ''
  const widerStr =
    widerContext.length > 0
      ? `\n\nWider context (background — do not repeat, do not branch from these):\n${widerContext.map((n) => `- ${n}`).join('\n')}`
      : ''

  const system = `${systemPrompt}\n\nReturn ONLY a JSON array of ${branchCount} strings. No markdown, no explanation.`
  const user = `Target to branch from: "${text}"${lensStr}${directStr}${widerStr}\n\nReturn ${branchCount} new ideas as a JSON array of strings. Each idea: ≤15 words. Name the concept; skip the rationale, benefits, and qualifiers. Stay grounded in the direction the brainstorm is heading.`

  const raw = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    undefined,
    'branches',
  )

  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```\s*$/, '')
    .trim()

  try {
    const parsed = JSON.parse(stripped)
    if (Array.isArray(parsed) && parsed.length >= 1) {
      return parsed.slice(0, branchCount).map(String)
    }
  } catch {
    // Fallback: split by newlines, strip numbering and stray quotes/brackets
    const lines = stripped
      .split('\n')
      .map((l) =>
        l
          .replace(/^\d+[.)]\s*/, '')
          .replace(/^[\s"'\[,]+|[\s"',\]]+$/g, '')
          .trim(),
      )
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
    undefined,
    'merge',
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
    undefined,
    'compose',
  )
}

export async function generateProjectName(seed: string): Promise<string> {
  const raw = await chat(
    [
      {
        role: 'system',
        content:
          'You name brainstorm projects. Given a seed idea, reply with a 2-4 word title in Title Case. No quotes, no trailing punctuation, no explanation. Output only the title.',
      },
      {
        role: 'user',
        content: `Seed: ${seed}`,
      },
    ],
    NAMING_MODEL,
    'project-name',
  )

  return raw
    .trim()
    .replace(/^["'`*_]+|["'`*_.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .split(/\s+/)
    .slice(0, 6)
    .join(' ')
    .slice(0, 48)
}
