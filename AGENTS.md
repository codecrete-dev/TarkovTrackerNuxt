# AGENTS.md

This is the canonical shared governance file for repository-level agent guidance.

If guidance applies across tools, write it here first. Keep `CLAUDE.md` as a thin Claude adapter and avoid duplicating shared instructions across files.

## What This Is

TarkovTracker is a Nuxt 4 single-page app for tracking Escape from Tarkov progress, with Supabase-backed real-time collaboration and Cloudflare deployment.

## Stack

- Nuxt 4 / Vue 3 / TypeScript
- Nuxt UI and Tailwind CSS v4
- Pinia
- Supabase
- Cloudflare Pages and Worker-based API gateway

## Project Structure

- `app/` - application code
- `app/features/` - domain-specific features
- `app/components/` - shared UI components
- `app/stores/` - Pinia stores
- `app/server/api/` - server proxy routes
- `workers/` - Cloudflare worker code
- `supabase/` - Supabase-related assets
- `tests/` - test code
- `docs/` and `.github/` - contributor and architecture docs

## Core Commands

- `npm run dev`
- `npm run lint`
- `npx vitest`
- `npm run build`
- `npm run format`

## Workflow Rules

- Use or create an issue before starting significant work and keep each pull request focused on one change.
- Follow the existing branch naming conventions from `.github/CONTRIBUTING.md`.
- Keep lint clean with zero warnings.
- Use `@/` imports instead of relative parent traversals.
- Use Tailwind v4 theme variables and semantic styling tokens instead of raw hex colors.
- Use the shared `logger` utilities for structured error logging.
- If you change architecture, contributor workflow, or core technical conventions, update `AGENTS.md` rather than creating separate duplicated agent docs.

## Verification

- Most app changes: `npm run lint`
- Logic-heavy changes: `npx vitest`
- Build or deployment-affecting changes: `npm run build`
- Features that differ by game mode should be checked in both PvP and PvE flows
