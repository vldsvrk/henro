# Contributing

Thanks for wanting to help. Henro is small and fast-moving — a few notes to keep it that way.

## Getting set up

```bash
pnpm install
pnpm dev
```

Paste your own OpenRouter key in Settings to use AI features. The app is BYOK by design.

For debugging prompts/responses, copy `.env.example` → `.env.local` and set `VITE_HENRO_DEBUG=true`.

## Before you open a PR

- `pnpm build` passes (runs `tsc -b` + Vite build)
- `pnpm lint` — new files shouldn't add errors. Pre-existing warnings in untouched files are fine.
- Keep changes scoped. One concern per PR.

## Code style

- TypeScript strict. No `any` unless you explain why in a comment.
- Prefer existing Tailwind theme tokens (`text-ink`, `bg-surface-soft`, `bg-chip`, `border-line-neutral`, etc.) over raw hex.
- New UI should match existing aesthetic — muted, unhurried, functional.
- Node bubbles on the canvas are **text-only**. Metadata about a node (origin, depth, lens used) goes in the side panel on selection — not as hover labels or inline tags on the bubble itself.

## State + persistence

The Zustand store is in `src/store.ts`. Only these fields persist per-project:

- `nodes`, `connections`, `viewport`, `seedNodeId`, `composeResult`

Everything else is ephemeral (selections, drag state, loading, modals). If you add persistent state, update `partialize` in the `persist` config **and** `PersistedProject` / `readProjectData` in `src/lib/persistence.ts`.

## AI prompts

Prompt templates live in `src/lib/ai.ts` and `src/lib/prompts.ts`. When you change a prompt, test it with debug mode on to see the full payload.

`chat()` accepts an optional `modelOverride` so you can use a cheap model for utility calls (see `generateProjectName`). Don't bill users' cheap calls to their primary model if a smaller one does the job.

## What kinds of PRs are welcome

- Bug fixes, performance, a11y
- UI polish consistent with the existing look
- Docs and README improvements
- Small features that fit the "canvas + AI, no backend" ethos

## What to open an issue for first

- New top-level features
- Adding a backend, accounts, or anything that breaks the BYOK / local-only story
- Changes to the persistence schema or storage keys
- New dependencies with non-trivial bundle cost

## License

By contributing you agree your contributions are licensed under the MIT License (same as the project).
