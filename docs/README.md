# TarkovTracker Documentation
## Core Stack
- **Nuxt**: 4.2.1
- **@nuxt/ui**: 4.2.0
- **Tailwind CSS**: 4.1.17 (CSS-first config)
- **Supabase**: Auth + Database
- **Pinia**: State management with localStorage persistence
See `00_VERSION_CONTRACT.md` for detailed requirements.
## Project Structure
```
app/
├── app.vue          # Root wrapper (see APP_STRUCTURE.md)
├── layouts/         # Nuxt page layouts
├── shell/           # App chrome (header, nav, footer)
├── pages/           # File-based routing
├── features/        # Feature-specific components
├── components/      # Shared UI components
├── stores/          # Pinia stores
├── composables/     # Composition utilities
├── plugins/         # Nuxt plugins
├── locales/         # i18n translations
└── assets/css/      # Tailwind theme
```
See `APP_STRUCTURE.md` for detailed explanation of app.vue, layouts, and shell components.
## Development
```bash
npm run dev      # Start dev server
npm run build    # Production build
npx vitest       # Run tests
npx eslint app   # Lint code
```
## Documentation Index
| File | Purpose |
|------|---------|
| `00_VERSION_CONTRACT.md` | Stack requirements and patterns |
| `APP_STRUCTURE.md` | App organization (app.vue, layouts, shell components) |
| `BACKEND_STATUS.md` | Supabase/Edge Functions status |
| `DEPENDENCIES.md` | Package inventory |
| `I18N_STATUS.md` | Translation system status |
| `TEAM_ARCH.md` | Team system architecture (Supabase vs Cloudflare) |
| `TEAM_GATEWAY.md` | Team gateway implementation details |
| `TEAM_UI_IMPROVEMENTS.md` | Team UI/UX improvements (January 2025) |
| `z_DISCORD_RULES_LEGAL.md` | Legal/Discord info |
