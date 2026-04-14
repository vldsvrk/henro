const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function getConfig() {
  const stored = localStorage.getItem('openrouter-config')
  if (stored) {
    const parsed = JSON.parse(stored)
    return {
      apiKey: parsed.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '',
      model: parsed.model || 'google/gemini-3-flash-preview',
    }
  }
  return {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    model: 'google/gemini-3-flash-preview',
  }
}

async function chat(
  messages: { role: string; content: string }[],
): Promise<string> {
  const { apiKey, model } = getConfig()

  if (!apiKey) {
    throw new Error('OpenRouter API key not set. Add it in Settings.')
  }

  const maxRetries = 3
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
      throw new Error(`OpenRouter error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return data.choices[0].message.content
  }

  throw new Error('Rate limited after retries. Try again in a moment.')
}

export async function generateBranches(
  text: string,
  context: string[],
  connectedTexts: string[] = [],
): Promise<string[]> {
  const contextStr =
    context.length > 1
      ? `\nContext path: ${context.join(' → ')}`
      : ''

  const connectedStr =
    connectedTexts.length > 0
      ? `\nRelated ideas: ${connectedTexts.join('; ')}`
      : ''

  const raw = await chat([
    {
      role: 'system',
      content:
        'You are a creative brainstorming assistant. Generate exactly 3 distinct, concise idea branches. Return ONLY a JSON array of 3 strings. No markdown, no explanation.',
    },
    {
      role: 'user',
      content: `Branch from this idea: "${text}"${contextStr}${connectedStr}\n\nReturn 3 diverse variations as a JSON array of strings.${connectedTexts.length > 0 ? ' Take the related ideas into account — generate branches that bridge or build on the connections.' : ''}`,
    },
  ])

  try {
    const parsed = JSON.parse(raw.trim())
    if (Array.isArray(parsed) && parsed.length >= 1) {
      return parsed.slice(0, 3).map(String)
    }
  } catch {
    // Fallback: split by newlines, strip numbering
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean)
    if (lines.length >= 1) return lines.slice(0, 3)
  }

  return [`${text} — variation A`, `${text} — variation B`, `${text} — variation C`]
}

export async function mergeIdeas(a: string, b: string): Promise<string> {
  return chat([
    {
      role: 'system',
      content:
        'You merge two ideas into one concise synthesis. Return ONLY the merged idea, 1-2 sentences max.',
    },
    {
      role: 'user',
      content: `Merge these ideas:\n1. ${a}\n2. ${b}`,
    },
  ])
}

export async function compose(texts: string[]): Promise<string> {
  return chat([
    {
      role: 'system',
      content:
        'You synthesize multiple brainstorm ideas into a coherent summary. Be concise but comprehensive.',
    },
    {
      role: 'user',
      content: `Synthesize these brainstorm ideas into a coherent summary:\n\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
    },
  ])
}
