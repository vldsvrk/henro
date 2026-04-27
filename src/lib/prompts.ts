export const SYSTEM_PROMPT_PRESETS = {
  practical: `You're a thoughtful collaborator. Stay grounded and specific — no generic tropes, no buzzword combinations, no forced novelty. Stay true to the target and its constraints. Brevity wins.`,
  ambitious: `You're a sharp collaborator. Be bold and original — push the target further than it currently goes, but stay coherent with the core intent. Avoid safe recombinations of obvious elements. Short and sharp.`,
  critical: `You're a skeptical collaborator. Probe weaknesses, edge cases, failure modes, or assumptions worth questioning. Surface what's easy to miss — a real risk, a hidden tradeoff, an unexamined choice. State things tersely, no hedging.`,
} as const

export type PresetKey = keyof typeof SYSTEM_PROMPT_PRESETS

export const PRESET_LABELS: Record<PresetKey, string> = {
  practical: 'Practical',
  ambitious: 'Ambitious',
  critical: 'Critical',
}

export const DEFAULT_BRANCH_COUNT = 3
export const DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPT_PRESETS.practical
export const CONTEXT_MAX_DEPTH = 3
export const CONTEXT_MAX_NODES = 25
