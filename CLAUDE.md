# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server (no /api/proxy locally — see Proxy notes)
npm run build      # tsc -b && vite build
npm test           # vitest run (all tests)
npx vitest run src/lib/provider.test.ts   # single test file
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
npm run format     # Prettier
vercel dev         # Vercel CLI (includes Edge functions)
```

## Architecture

React 19 + Vite + TypeScript + Tailwind single-page BYOK translation app ("Let's Translate"). All state lives in the browser: settings/API keys in LocalStorage (`src/lib/storage.ts`), translation history in IndexedDB (`src/lib/db.ts`).

### Request flow

`App.tsx` (panel state, abort controllers, history records) → `src/lib/provider.ts:translateText()` → provider-specific function (`openai` / `gemini` / `custom`). All HTTP goes through `fetchWithProxy()`, which POSTs to `/api/proxy` with the real destination in an `x-target-url` header. `/api/proxy` is a Vercel Edge function (`api/proxy.ts`) that forwards the request and adds CORS headers.

**Important consequence:** under plain `npm run dev` there is no `/api/proxy` route — API calls only work when deployed to Vercel (or via `vercel dev`).

### Providers and streaming

- `provider.ts` builds requests per provider (`buildOpenAiRequest`, `buildCustomChatRequest`, `buildGeminiRequest`); prompts come from `src/lib/prompt.ts`, which splits system/user messages to mitigate prompt injection.
- "custom" provider = any OpenAI-compatible chat-completions endpoint (e.g. OpenRouter); API key is optional for it.
- Streaming (settings toggle) parses SSE `data:` lines (OpenAI/custom) or JSON-array chunks (Gemini); `onChunk` receives the _accumulated_ text, not the delta.

### Other key modules

- `src/lib/models.ts` — model lists per provider; `src/lib/cost.ts` — token/cost estimation (skipped for custom provider).
- `src/lib/types.ts` — shared types (`ProviderId`, `TranslationMode`, `TranslationTone`, `HistoryRecord`...).
- UI text and code comments are in Traditional Chinese; keep that convention.

## Testing

Vitest + jsdom + Testing Library (`vitest.config.ts`, setup in `src/test/setup.ts`). Existing tests cover the pure logic in `src/lib/` (prompt building, request builders, storage, cost) and custom hooks in `src/hooks/`. Test files are excluded from `tsconfig.app.json` so they don't break the production build.

## Versioning

This project uses **Semantic Versioning** (`MAJOR.MINOR.PATCH`). Current version: **1.0.0** (set 2026-06-29).

- `MAJOR` — breaking changes (e.g. localStorage schema change, removed provider)
- `MINOR` — new user-facing features (e.g. new provider, new translation mode)
- `PATCH` — bug fixes and minor adjustments

All notable changes are recorded in `CHANGELOG.md`. When bumping a version, update both `package.json` and `CHANGELOG.md`. Write CHANGELOG entries at the **feature level** (what the user gains), not at the implementation level.

## Current feature set (v1.0.0)

The app is fully functional and deployed on Vercel. Users can:
- Set their own API keys (BYOK) in Settings and translate immediately
- Use OpenAI, Google Gemini, or any custom OpenAI-compatible endpoint
- Open multiple translation panels side-by-side
- Toggle streaming mode for real-time output
- Save favourite language pairs
- Browse full translation history (stored locally in IndexedDB)
- Add custom languages beyond the built-in list
