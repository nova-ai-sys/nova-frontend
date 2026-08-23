# NOVA Frontend

> The web UI for NOVA — and its only interface.

A React 19 + TypeScript + Vite app: the chat, the live multi-agent run diagram,
memory and RAG panels, the scheduler, connected services, host metrics, and the
documentation reader.

It runs **on your own machine**, against the API in
[nova-api](https://github.com/nova-ai-sys/nova-api) on `localhost:8000`. It is
never deployed and there is no login — NOVA is single-user by design.

| Repository | What it is |
|------------|------------|
| **nova-frontend** (this one) | The web UI |
| [nova-api](https://github.com/nova-ai-sys/nova-api) | The agent and the REST API |
| [nova-docs](https://github.com/nova-ai-sys/nova-docs) | The documentation |
| [nova-landing](https://github.com/nova-ai-sys/nova-landing) | The public site, nova.robyn.es |

## Quick start

Start [nova-api](https://github.com/nova-ai-sys/nova-api) first — the UI has
nothing to talk to otherwise. Then:

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

In development the Vite server proxies `/api` to `http://localhost:8000`, so
the browser sees a single origin and CORS never enters the picture. To point at
an API somewhere else, set `VITE_API_URL` — see `.env.example`.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server on port 5173, with the API proxy |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the built app |
| `npm run lint` | ESLint |

## Layout

```
src/
├── pages/ChatPage.tsx      # The app itself
├── pages/DocsPage.tsx      # Documentation reader (shell only — see below)
├── components/
│   ├── chat/               # Messages, composer, live A2A run diagram, tokens
│   ├── connections/        # Google / Microsoft / GitHub OAuth panel
│   ├── intelligence/       # Memory and knowledge base
│   ├── scheduler/          # Automations
│   ├── system/             # Host CPU / RAM / GPU dock
│   ├── docs/               # Markdown renderer for documentation pages
│   └── layout/             # Sidebar, header, modals
├── hooks/                  # useChat, useConnections, useDocs, useTheme, …
└── lib/                    # API client, types, i18n, utilities
```

## Documentation

`src/pages/DocsPage.tsx` holds no documentation — it is a shell. The pages come
from [nova-docs](https://github.com/nova-ai-sys/nova-docs) as a JSON bundle:

- `public/docs-bundle.json` ships with the build and always works offline.
- Set `VITE_DOCS_BUNDLE_URL` to the published bundle and the docs update
  without updating NOVA, falling back to the local copy when the network is
  gone.

To edit documentation, edit `nova-docs`. Nothing in this repository is the
source of any page.

## Talking to the API

Every call goes through `src/lib/api.ts`, which prefixes `VITE_API_URL`. There
are no auth headers: the API has no authentication, because it listens on your
own machine. If you put this UI in front of an API reachable by anyone else,
that is a decision you have to secure yourself.
