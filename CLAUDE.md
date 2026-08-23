# NOVA Frontend — Claude Code Instructions

The web UI for NOVA, and its only interface. React 19 + TypeScript + Vite 7 +
Tailwind CSS 4.

It runs on the user's own machine against `nova-api` on `localhost:8000`. It is
never deployed. There is no authentication and no account system — NOVA is
single-user by design, and reintroducing a login is not a change to make
unasked.

## Layout

```
src/
├── App.tsx                 # Routes. Chat at /, docs at /docs/:slug (lazy)
├── main.tsx                # Providers: router, i18n, error boundary
├── pages/                  # ChatPage, DocsPage
├── components/
│   ├── chat/               # ChatArea, ChatInput, ChatMessage, AgentFlowLive, TokenCounter
│   ├── connections/        # OAuth panel and the provider setup wizard
│   ├── intelligence/       # Memory and knowledge base
│   ├── scheduler/          # Automations
│   ├── system/             # Host CPU / RAM / GPU dock
│   ├── docs/DocsMarkdown   # Markdown renderer for documentation pages
│   ├── ui/                 # Buttons, modals, toasts, markdown, mermaid, icons
│   └── layout/             # Sidebar, header, folder modal
├── hooks/                  # useChat, useConnections, useDocs, useTheme, useIsMobile, …
└── lib/                    # api.ts, types.ts, i18n.tsx, markdown.ts, utils
```

## Conventions

- TypeScript throughout, no `any` where a real type will do.
- Tailwind utility classes; the palette is `primary-*` (green) on `surface-*`
  (zinc), defined as tokens in `src/index.css`. Use the tokens, not literals.
- Every user-facing string goes through `useI18n()` / `t()` in `lib/i18n.tsx`.
  Both English and Spanish, or neither.
- Components are functions with typed props. Keep the file that owns a piece of
  state the one that renders it.

## API access

- Every request goes through `src/lib/api.ts`; nothing else calls `fetch` at an
  API path.
- `VITE_API_URL` prefixes every call and defaults to empty, which lets the Vite
  dev proxy handle `/api` on one origin.
- No `Authorization` headers. The API has none.
- Streaming responses arrive as SSE — see `useChat` for the event shapes, which
  must stay in step with `api/routes.py` in `nova-api`.

## Documentation

`pages/DocsPage.tsx` is a shell, not content. Pages come from the `nova-docs`
repository as a JSON bundle, loaded by `hooks/useDocs.ts`:

- `public/docs-bundle.json` is the copy that ships with the build.
- `VITE_DOCS_BUNDLE_URL` points at the published bundle, with the local copy as
  the offline fallback.

Never write documentation prose into this repository. That duplication is
exactly what the split removed.

## Commands

- `npm run dev` — dev server (port 5173, proxies `/api` to port 8000)
- `npm run build` — `tsc -b` then Vite build
- `npm run lint` — ESLint

## Working agreements

- Commits follow **Conventional Commits**; release-please handles versions and
  `CHANGELOG.md`, so never edit either by hand.
- **Write short commit messages.** One line saying what changed. Add a body
  only when the reason is not obvious, and keep it to a sentence or two.
- **No `Co-Authored-By` trailers** and no tool attribution in commit messages.
- **Never push unless asked.** Committing finished work is fine; pushing is a
  separate decision that belongs to the user.
- A change to the REST contract needs the matching change in `nova-api` and a
  docs update in `nova-docs`.
