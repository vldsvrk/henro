# Henro

Brainstorming canvas that expands your ideas with AI.

Type a seed. Branch it. Steer each branch with a lens — *scrappy indie*, *VC pitch*, *pessimist*, whatever. Merge two ideas into one. Compose the whole board into a summary.

**[henro.space](https://henro.space)** · No accounts · Your OpenRouter key · Everything stays in your browser.

<!-- TODO: add a screenshot or demo GIF here. Drop a file at /public/demo.png and reference it. -->
<!-- ![Henro canvas](public/demo.png) -->

## Why

AI chats end up as linear walls of text. You scroll forever, half of it is fluff, and the idea you wanted is gone.

Ideas aren't linear. Chats are. That's the whole problem.

Henro puts brainstorming on a canvas where branches fan out, ideas merge, and context stays visible.

## How it works

- **Seed** — type an idea
- **Branch** — AI expands a node into N sub-ideas (configurable, 1–10)
- **Steer** — every expansion takes an optional lens so branches go where you want
- **Merge** — drag two nodes together; AI writes the combined idea
- **Compose** — synthesize everything active into a summary
- **Context-aware prompts** — AI sees what's directly connected to each node, not just a flat bag of text

## Stack

- Vite + React 19 + TypeScript
- Zustand for state (`persist` middleware, per-project localStorage keys)
- Tailwind 4
- Framer Motion
- OpenRouter for inference (BYOK)

No backend. No accounts. No database. Everything is localStorage.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the app, paste your OpenRouter key into Settings, and start branching. Get a key at [openrouter.ai/keys](https://openrouter.ai/keys).

## Env flags

Copy `.env.example` to `.env.local` if you want either flag.

| Flag | Effect |
|---|---|
| `VITE_HENRO_DEBUG=true` | Logs every AI prompt + response to the browser console (collapsed groups) |

API keys are **not** read from env — the app is BYOK-only, keys live in localStorage. The env flag is only for developer debugging.

## Deploy

Static build, any host. Includes config for Cloudflare Pages:

```bash
pnpm build
```

- `dist/` is the deploy output
- `public/_redirects` → SPA fallback (works on Cloudflare Pages + Netlify)
- `public/_headers` → security headers (HSTS, nosniff, frame-ancestors, referrer-policy)

## Architecture

```
src/
├── App.tsx              – tri-state gate: WelcomeScreen → SeedInput → Canvas
├── main.tsx             – ErrorBoundary wrapper
├── store.ts             – single Zustand store, persist middleware, project slice
├── components/
│   ├── Canvas.tsx       – pan/zoom, marquee select
│   ├── BubbleNode.tsx   – draggable node, merge animation, expand
│   ├── Connections.tsx  – SVG edges
│   ├── SidePanel.tsx    – node detail (on selection)
│   ├── ComposeButton.tsx– summary modal
│   ├── Settings.tsx     – BYOK + model + branch stepper
│   ├── ProjectSwitcher.tsx
│   ├── WelcomeScreen.tsx
│   ├── Toaster.tsx / ErrorBoundary.tsx
│   └── icons.tsx
├── lib/
│   ├── ai.ts            – OpenRouter chat + retry + debug logging
│   ├── prompts.ts       – system-prompt presets
│   ├── errors.ts        – AiError class + classifier
│   ├── toast.ts         – tiny toast store
│   ├── persistence.ts   – custom Zustand StateStorage adapter (split per-project keys)
│   ├── config.ts        – BYOK config read/write + useHasApiKey
│   ├── layout.ts        – child-node position math
│   ├── physics.ts       – overlap resolution
│   └── usePhysics.ts    – settle-after-drag hook
└── index.css            – Tailwind theme + prose-compose + scrollbar-soft
```

**Persistence schema:**
- `henro:projects:index` — project metadata list + current ID
- `henro:project:<id>` — one key per project (nodes, connections, viewport, seed, composeResult)
- `openrouter-config` — BYOK config (apiKey, model, branchCount, systemPrompt)

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Small fixes and UI polish: open a PR.

Bigger changes (new features, architectural shifts): open an issue first so we can align before you spend time.

## License

MIT — see [LICENSE](LICENSE).

## Author

Built by [@vldsvrk](https://twitter.com/vldsvrk). Follow along for updates.
