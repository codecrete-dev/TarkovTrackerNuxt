# PR Split Plan: `feat/ui-overhaul` Branch Decomposition

This document outlines the plan to break up the large `feat/ui-overhaul` PR into smaller, focused branches that can be reviewed and merged independently.

## Background

The `feat/ui-overhaul` branch contains extensive work spanning multiple features and improvements. To facilitate review and incremental merging, this work needs to be split into the following focused PRs based on the issues created.

---

## Issue Breakdown

### 1. URL-Based Filter State Management Across Pages (#101)

**Scope:** Replace store-based filter persistence with URL query parameter–based state management for shareable, bookmarkable filtered views.

**Expected Behavior:**

- Active filter state reflected in URL query parameters (e.g., `/tasks?status=locked`)
- Filtered views shareable via URL and restored on page load
- Browser back/forward navigation correctly updates filter state
- User's last viewed filters remembered and updated during navigation

**Fingerprints (How to identify this issue's code):**

| Pattern Type  | What to Look For                                                             |
| ------------- | ---------------------------------------------------------------------------- |
| New Files     | `usePageFilters.ts`, `usePageFilterRegistry.ts`, `*FilterConfig.ts`          |
| Imports       | `import { usePageFilters }`, `import { usePageFilterRegistry }`              |
| URL Logic     | `useRoute().query`, `router.replace({ query: ... })`, `watchEffect` on route |
| Store Changes | Removal of filter state from Pinia stores, replacing with URL-based state    |

**Change Manifest:**

| File                                                                 | In-Scope Changes                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| `app/composables/usePageFilters.ts`                                  | **[NEW]** Core composable for URL-based filter handling |
| `app/composables/usePageFilterRegistry.ts`                           | **[NEW]** Centralized filter registry                   |
| `app/features/tasks/composables/useTasksFilterConfig.ts`             | **[NEW]** Tasks page filter config                      |
| `app/features/neededitems/composables/useNeededItemsFilterConfig.ts` | **[NEW]** Needed Items filter config                    |
| `app/features/hideout/composables/useHideoutFilterConfig.ts`         | **[NEW]** Hideout filter config                         |
| `app/pages/tasks.vue`                                                | Filter setup using `usePageFilters` instead of store    |
| `app/pages/neededitems.vue`                                          | Filter setup using `usePageFilters` instead of store    |
| `app/pages/hideout.vue`                                              | Filter setup using `usePageFilters` instead of store    |
| `app/components/FilterPill.vue`                                      | URL-aware filter clearing                               |

**Out of Scope (Do NOT include):**

- `dark:` prefixes, light mode colors → #102
- PvP/PvE accent colors (`text-pvp-*`, `text-pve-*`) → #104
- `tabindex`, `focus:` attributes → #103
- UI layout changes unrelated to filter controls → #106, #107
- Nav drawer reorganization → #108

**Verification Checklist:**

- [ ] Navigate to `/tasks?status=locked` → should show locked tasks
- [ ] Change filter → URL updates without full page reload
- [ ] Browser back button → previous filter state restored
- [ ] Refresh page → filter state persisted from URL
- [ ] Share URL with filter → recipient sees same filtered view

**Dependencies:** None - can be extracted independently

---

### 2. Add Light Mode Theme Option (#102)

**Scope:** Add a first-class light mode theme option that users can toggle, with semantic theme variables.

**Expected Behavior:**

- Light mode can be enabled via settings or UI toggle
- Theme choice persists per user or per session
- All core UI components remain readable and consistent in light mode

**Fingerprints (How to identify this issue's code):**

| Pattern Type  | What to Look For                                                                |
| ------------- | ------------------------------------------------------------------------------- |
| CSS Classes   | `dark:bg-*`, `dark:text-*`, `dark:border-*` (any `dark:` prefix)                |
| CSS Variables | `--bg-light`, `--surface-light`, `--text-on-light`, light-specific color tokens |
| Functions     | `useColorMode()`, `toggleColorMode()`, `colorMode.value`                        |
| Settings      | Theme toggle/selector in settings page                                          |
| Body Classes  | `.dark` class toggling on `<html>` or `<body>`                                  |

**Change Manifest:**

> [!IMPORTANT]
> This issue has **extensive coverage** across the codebase. Validation found **275 instances** of `dark:` patterns in the diff. Extraction requires surgical per-file analysis to avoid pulling in unrelated changes.

| File                               | In-Scope Changes                                             |
| ---------------------------------- | ------------------------------------------------------------ |
| `app/assets/css/tailwind.css`      | CSS variables with `dark:` variants, light mode color tokens |
| `app/layouts/default.vue`          | Color mode integration, body class switching                 |
| `app/pages/settings.vue`           | Theme toggle UI component                                    |
| `app/locales/en.json5`             | Light mode translation strings (`settings.theme.*`)          |
| `app/stores/usePreferences.ts`     | Theme preference state                                       |
| `app/utils/preferenceMapper.ts`    | Preference mapping for theme                                 |
| `app/error.vue`                    | Error page theming                                           |
| `app/components/ui/*.vue`          | Component `dark:` class variants (see list below)            |
| `app/features/settings/*.vue`      | Settings page theming                                        |
| `app/features/dashboard/*.vue`     | Dashboard theming                                            |
| `app/features/drawer/*.vue`        | Drawer theming                                               |
| `app/features/team/*.vue`          | Team page theming                                            |
| `app/features/traders/*.vue`       | Traders page theming                                         |
| `app/features/admin/*.vue`         | Admin page theming                                           |
| `app/features/maps/LeafletMap.vue` | Map popup theming                                            |
| `app/pages/*.vue`                  | Page-level theming (login, privacy, terms, etc.)             |

**Components with `dark:` patterns (partial list):**

- `AppTooltip.vue`, `ContextMenu.vue`, `GameBadge.vue`, `GameItem.vue`
- `GameItemImage.vue`, `GenericCard.vue`, `ItemStatusBadge.vue`, `ToggleButton.vue`

**Out of Scope (Do NOT include):**

- PvP/PvE accent colors (`--accent-pvp`, `--accent-pve`, `text-pvp-*`) → #104
- URL filter state (`usePageFilters`, query params) → #101
- Focus/accessibility improvements (`tabindex`, `focus:`) → #103
- Nav drawer control reorganization → #108

**Verification Checklist:**

- [ ] Settings page shows theme toggle
- [ ] Toggle to light mode → entire app switches to light theme
- [ ] Refresh page → theme preference persisted
- [ ] All text readable with sufficient contrast in light mode
- [ ] No broken/invisible elements in light mode

**Dependencies:** Should coordinate with #104 (PvP/PvE accent theming) - both affect theming infrastructure

---

### 3. Improve Keyboard Navigation and Focus Accessibility (#103)

**Scope:** Improve keyboard navigation and focus handling across the application for accessibility.

**Expected Behavior:**

- All interactive elements are reachable via keyboard
- Logical tab order throughout the UI
- Visible focus states on all focusable elements
- No keyboard traps

**Fingerprints (How to identify this issue's code):**

| Pattern Type | What to Look For                                                   |
| ------------ | ------------------------------------------------------------------ |
| Attributes   | `tabindex`, `role`, `aria-*`, `focusable`                          |
| CSS          | `focus:`, `focus-visible:`, `outline-*`, `ring-*` focus styles     |
| Events       | `@keydown`, `@keyup`, `@keypress`, `@focus`, `@blur`               |
| Logic        | Focus trap utilities, keyboard navigation handlers, `useFocusTrap` |

**Change Manifest:**

> [!IMPORTANT]
> This issue has **extensive coverage** across the codebase. Validation found **217 instances** of accessibility-related patterns (`tabindex`, `focus:`, `aria-*`, `@keydown`) in the diff. Extraction requires surgical per-file analysis.

| File                                               | In-Scope Changes                         |
| -------------------------------------------------- | ---------------------------------------- |
| `app/assets/css/tailwind.css`                      | Focus ring styles, focus utility classes |
| `app/components/ui/ContextMenuItem.vue`            | Context menu keyboard handling           |
| `app/components/ui/ToggleButton.vue`               | Toggle button focus states               |
| `app/components/ui/GameItem.vue`                   | Game item keyboard handling              |
| `app/features/drawer/DrawerLevel.vue`              | Drawer navigation tabindex               |
| `app/features/dashboard/DashboardProgressCard.vue` | Card tabindex                            |
| `app/features/tasks/TaskCardRewards.vue`           | Task card tabindex                       |
| `app/features/tasks/RelatedTasksRow.vue`           | Related tasks tabindex                   |
| `app/shell/LoadingScreen.vue`                      | Loading screen focus management          |
| `app/features/neededitems/*.vue`                   | Needed items keyboard handling           |
| `app/features/hideout/*.vue`                       | Hideout keyboard handling                |

**Out of Scope (Do NOT include):**

- `dark:` prefixes, light mode styles → #102
- PvP/PvE accent colors → #104
- URL filter state → #101
- Layout/UI reorganization → #106, #107, #108

**Verification Checklist:**

- [ ] Tab through entire app → all interactive elements reachable
- [ ] Focus rings visible on all focusable elements
- [ ] Can navigate tasks list with keyboard only
- [ ] No keyboard traps (can always Tab out)
- [ ] Escape closes modals/drawers

**Dependencies:** None - can be extracted independently

---

### 4. Support PvP / PvE Accent Theming (#104)

**Scope:** Introduce accent theming that visually differentiates PvP and PvE contexts.

**Expected Behavior:**

- PvP and PvE views use distinct accent colors
- Accent choice integrates cleanly with existing themes
- Accents are applied consistently across relevant UI elements

**Fingerprints (How to identify this issue's code):**

| Pattern Type  | What to Look For                                                       |
| ------------- | ---------------------------------------------------------------------- |
| CSS Variables | `--accent-pvp`, `--accent-pve`, `--color-pvp-*`, `--color-pve-*`       |
| CSS Classes   | `text-pvp-*`, `text-pve-*`, `bg-pvp-*`, `bg-pve-*`                     |
| Conditionals  | Classes applied based on `gameMode`, mode-reactive computed properties |
| Store         | `useSystemStore().gameMode`, game mode watchers                        |
| Visual        | Logo tinting, accent borders, mode-specific colors                     |

**Change Manifest:**

| File                           | In-Scope Changes                                    |
| ------------------------------ | --------------------------------------------------- |
| `app/assets/css/tailwind.css`  | PvP/PvE accent CSS variables and utility classes    |
| `app/stores/useSystemStore.ts` | Game mode state (only accent-related logic)         |
| `app/stores/useProgress.ts`    | Progress by game mode                               |
| `app/shell/NavDrawer.vue`      | Mode accent indication (not control reorganization) |
| `app/app.vue`                  | Root app accent theming based on mode               |
| `app/layouts/default.vue`      | Layout mode accent integration                      |

**Out of Scope (Do NOT include):**

- Light mode styles (`dark:` prefixes) → #102
- URL filter state → #101
- Nav drawer control reorganization (moving buttons) → #108
- Keyboard accessibility → #103

**Verification Checklist:**

- [ ] Switch to PvP mode → accent colors change throughout app
- [ ] Switch to PvE mode → different accent colors appear
- [ ] Accents visible in nav drawer, headers, active states
- [ ] Accents work correctly in both light and dark themes
- [ ] No visual conflicts with other color tokens

**Dependencies:** Should coordinate with #102 (Light Mode) - both affect theming infrastructure

---

### 5. Updated Tasks UI with Improved Navigation and Related Task Context (#106)

**Scope:** Update the Tasks UI to improve task discoverability, progression clarity, and navigation between task list and single-task views.

**Expected Behavior:**

- Reimagined "related tasks" section showing:
  - Prerequisite tasks
  - Next tasks in the chain
  - Failure conditions where applicable
- Streamlined task navigation with instant access to single-task view
- When viewing a task with map objectives, the map opens automatically

**Fingerprints (How to identify this issue's code):**

| Pattern Type | What to Look For                                                      |
| ------------ | --------------------------------------------------------------------- |
| Components   | `RelatedTasksRow`, `TaskLink`, `TaskChain`, task relationship display |
| Props        | `prerequisites`, `nextTasks`, `failureConditions`, `taskChain`        |
| Navigation   | Single-task view routing (`/tasks/[id]`), map auto-open logic         |
| Data         | Task relationship queries, prerequisite/successor lookups             |

**Change Manifest:**

| File                                            | In-Scope Changes                                      |
| ----------------------------------------------- | ----------------------------------------------------- |
| `app/features/tasks/RelatedTasksRow.vue`        | Related tasks display (prerequisites, next, failures) |
| `app/features/tasks/TaskCard.vue`               | Task card layout, related tasks integration           |
| `app/features/tasks/TaskInfo.vue`               | Task information display                              |
| `app/features/tasks/TaskLink.vue`               | Task linking component                                |
| `app/features/tasks/TaskObjective.vue`          | Task objective display                                |
| `app/features/tasks/TaskObjectiveItemGroup.vue` | Grouped objectives                                    |
| `app/features/tasks/TaskActions.vue`            | Task action buttons                                   |
| `app/features/tasks/TaskCardRewards.vue`        | Rewards display                                       |
| `app/features/tasks/TaskFilterBar.vue`          | Filter bar component (layout only)                    |
| `app/features/tasks/TaskSettingsModal.vue`      | Task settings                                         |
| `app/features/tasks/InfoRow.vue`                | Task info row component                               |
| `app/features/tasks/ObjectiveCountControls.vue` | Objective count controls                              |
| `app/features/tasks/QuestKeys.vue`              | Quest keys display                                    |
| `app/features/tasks/QuestObjectives.vue`        | Quest objectives display                              |
| `app/features/tasks/SettingsToggle.vue`         | Settings toggle component                             |
| `app/features/tasks/TaskMapPanel.vue`           | Task map panel                                        |
| `app/features/tasks/TaskMapTabs.vue`            | Task map tabs                                         |
| `app/pages/tasks.vue`                           | Tasks page (layout, not filter URL state)             |

**Out of Scope (Do NOT include):**

- Light mode styles (`dark:` prefixes) → #102
- PvP/PvE accent theming → #104
- URL filter state (`usePageFilters`) → #101
- `tabindex`, `focus:` accessibility attributes → #103
- Nav drawer changes → #108

**Verification Checklist:**

- [ ] Task cards show related tasks (prerequisites, next in chain)
- [ ] Click related task → navigates to that task
- [ ] Single task view works correctly
- [ ] Map auto-opens for map-based objectives
- [ ] Task progression chain is visually clear

**Dependencies:** May benefit from #103 (Keyboard Navigation) for accessibility

---

### 6. "Needed Items" UI Facelift with Clear Status Indicators (#107)

**Scope:** Refresh the "Needed Items" UI to improve scannability, visual clarity, and status awareness while keeping the layout familiar.

**Expected Behavior:**

- Game item images use a Tarkov-inspired color treatment for visual consistency
- Item requirement, craftable, and Kappa indicators consolidated into a clear, compact status bar
- Status indicators visible at a glance without opening item details
- Layout supports dense item grids without sacrificing readability

**Fingerprints (How to identify this issue's code):**

| Pattern Type | What to Look For                                                   |
| ------------ | ------------------------------------------------------------------ |
| Components   | `ItemIndicators`, `ItemStatusBar`, status badge components         |
| CSS          | Tarkov-style image filters, status badge styling, indicator colors |
| Layout       | Dense grid support, indicator consolidation, compact card views    |
| Data         | Status aggregation, indicator state computation                    |

**Change Manifest:**

| File                                                 | In-Scope Changes                |
| ---------------------------------------------------- | ------------------------------- |
| `app/features/neededitems/NeededItem.vue`            | Main needed item component      |
| `app/features/neededitems/NeededItemSmallCard.vue`   | Compact card view               |
| `app/features/neededitems/NeededItemGroupedCard.vue` | Grouped card view               |
| `app/features/neededitems/NeededItemMediumCard.vue`  | Medium card view                |
| `app/features/neededitems/NeededItemRow.vue`         | Row view                        |
| `app/features/neededitems/ItemIndicators.vue`        | Status indicator badges         |
| `app/features/neededitems/ItemCountControls.vue`     | Count controls                  |
| `app/features/neededitems/CollectedToggleButton.vue` | Collected toggle button         |
| `app/features/neededitems/RequirementInfo.vue`       | Requirement display             |
| `app/features/neededitems/NeededItemsFilterBar.vue`  | Filter bar (layout only)        |
| `app/features/neededitems/TeamNeedsDisplay.vue`      | Team needs display              |
| `app/features/neededitems/neededitem-keys.ts`        | Item key utilities              |
| `app/types/neededItems.ts`                           | Needed items type definitions   |
| `app/pages/neededitems.vue`                          | Needed Items page (layout only) |

**Out of Scope (Do NOT include):**

- Light mode styles (`dark:` prefixes) → #102
- PvP/PvE accent theming → #104
- URL filter state (`usePageFilters`) → #101
- Accessibility attributes → #103

**Verification Checklist:**

- [ ] Item cards show consolidated status indicators
- [ ] Indicators visible at a glance (no hover required)
- [ ] Dense grid view renders correctly
- [ ] Tarkov-style image treatment applied
- [ ] Status colors are semantic and consistent

**Dependencies:** Should coordinate with #102 (Light Mode) for theme-aware styling

---

### 7. Reorganize Navigation Drawer and App Bar Controls (#108)

**Scope:** Reorganize the navigation drawer and app bar to more clearly separate game-related controls from application-level settings.

**Expected Behavior:**

- Game controls (game mode, faction, edition) consolidated in the navigation drawer
- Application controls (theme toggle, language picker) remain in the app bar
- Control grouping feels intentional and consistent across the app
- No existing functionality is removed or hidden

**Fingerprints (How to identify this issue's code):**

| Pattern Type      | What to Look For                                    |
| ----------------- | --------------------------------------------------- |
| Removals          | Game mode toggle FROM `AppBar.vue`                  |
| Additions         | Game mode/faction cycler buttons TO `NavDrawer.vue` |
| Component Changes | Toggle button groups → single-button cyclers        |
| Hover Effects     | Removal of hover effect from `DrawerLevel`          |

**Specific Changes (In Scope):**

1. **Move game mode toggle from AppBar to NavDrawer**
   - Remove the PvP/PvE segmented button group from `AppBar.vue`
   - Add a single-button game mode cycler to `NavDrawer.vue`
2. **Convert toggle button groups to single-button cyclers**
   - Game mode: single button that cycles PvP ↔ PvE with swapping icon
   - Faction: single button that cycles USEC ↔ BEAR (if not already)
3. **Remove icon hover effect from DrawerLevel**
   - The level/XP icon should not have a hover effect
4. **Minor layout adjustments** to accommodate the new control placement

**Change Manifest:**

| File                                  | In-Scope Changes                     |
| ------------------------------------- | ------------------------------------ |
| `app/shell/NavDrawer.vue`             | Add game mode/faction cycler buttons |
| `app/shell/AppBar.vue`                | Remove game mode toggle              |
| `app/features/drawer/DrawerLevel.vue` | Remove hover effect from level icon  |

**Out of Scope (Do NOT include):**

- Light mode styles (`dark:` prefixes, `bg-white`, etc.) → #102
- PvP/PvE accent theming (`text-pvp-*`, `text-pve-*`, logo tinting) → #104
- URL filter state management (`usePageFilterRegistry`) → #101
- Any new translation keys beyond what's needed for button labels
- Accessibility attributes (`tabindex`, `focus:`) → #103

**Verification Checklist:**

- [ ] Game mode toggle appears in nav drawer (not app bar)
- [ ] Single-button cycler switches PvP ↔ PvE on click
- [ ] Faction cycler switches USEC ↔ BEAR on click
- [ ] DrawerLevel icon has no hover effect
- [ ] App bar retains theme/language controls only

**Dependencies:** None - can be extracted independently

---

### 8. Standardize Task Terminology and Expand Localization Coverage (#109)

**Scope:** Update localization files to standardize task-related terminology and add missing translations for commonly used gameplay terms.

**Expected Behavior:**

- The term "quest" is consistently replaced with "task" across all language files
- "Found in Raid" translations are added and used consistently where applicable
- No functional behavior changes, only text and localization updates
- Existing translation structure and keys remain stable where possible

**Fingerprints (How to identify this issue's code):**

| Pattern Type | What to Look For                                       |
| ------------ | ------------------------------------------------------ |
| Text Changes | `quest` → `task` replacements                          |
| New Keys     | `foundInRaid`, `fir`, `found_in_raid` translation keys |
| Files        | Only `*.json5` locale files in `app/locales/`          |

**Change Manifest:**

| File                   | In-Scope Changes               |
| ---------------------- | ------------------------------ |
| `app/locales/en.json5` | English translations (primary) |
| `app/locales/de.json5` | German translations            |
| `app/locales/es.json5` | Spanish translations           |
| `app/locales/fr.json5` | French translations            |
| `app/locales/ru.json5` | Russian translations           |
| `app/locales/uk.json5` | Ukrainian translations         |

**Out of Scope (Do NOT include):**

- Any non-locale files
- Light mode terminology strings → #102
- UI component text that's not in locale files
- Nav drawer text changes → #108

**Verification Checklist:**

- [ ] All instances of "quest" replaced with "task" in UI
- [ ] "Found in Raid" label appears where appropriate
- [ ] App renders correctly in all supported languages
- [ ] No missing translation warnings in console

**Dependencies:** Should be one of the first or last PRs - first to establish terminology foundation, or last to avoid conflicts with text changes in other PRs

---

### 9. Shared Infrastructure and Code Quality Improvements (#110)

**Scope:** General infrastructure improvements, code quality refactors, and shared utility changes that don't fit into any specific feature issue.

**Expected Behavior:**

- No user-visible changes
- Improved code maintainability and performance
- Updated dependencies and build configuration

**Fingerprints (How to identify this issue's code):**

| Pattern Type    | What to Look For                                               |
| --------------- | -------------------------------------------------------------- |
| Refactors       | `structuredClone` instead of `JSON.parse(JSON.stringify(...))` |
| Composables     | Shared filtering/utility composables not specific to #101      |
| Config          | `app.config.ts`, `nuxt.config.ts` changes                      |
| Dependencies    | `package.json`, `package-lock.json` updates                    |
| Store refactors | Non-feature-specific store improvements                        |

**Change Manifest:**

| File                                      | In-Scope Changes                             |
| ----------------------------------------- | -------------------------------------------- |
| `app.config.ts`                           | App configuration updates                    |
| `nuxt.config.ts`                          | Nuxt configuration updates                   |
| `package.json`                            | Dependency updates                           |
| `package-lock.json`                       | Lock file updates                            |
| `app/stores/useTarkov.ts`                 | Store refactors (non-feature-specific)       |
| `app/stores/useMetadata.ts`               | Metadata store updates                       |
| `app/stores/progressState.ts`             | Progress state refactors (`structuredClone`) |
| `app/composables/useAppInitialization.ts` | App initialization logic                     |
| `app/composables/useCraftableItem.ts`     | Craftable item utility                       |
| `app/composables/useHideoutFiltering.ts`  | Hideout filtering utility                    |
| `app/composables/useLeafletMap.ts`        | Leaflet map utility                          |
| `app/composables/useLootGame.ts`          | Loot game utility                            |
| `app/composables/useTaskFiltering.ts`     | Task filtering utility                       |
| `app/plugins/tooltip.client.ts`           | Tooltip plugin updates                       |
| `app/components/HolidayToggle.vue`        | Holiday toggle component                     |
| `app/components/FilterPill.vue`           | Filter pill component (non-URL-specific)     |
| `.gitignore`                              | Git ignore updates                           |

**Out of Scope (Do NOT include):**

- Light mode styles (`dark:` prefixes) → #102
- PvP/PvE accent colors → #104
- URL filter state (`usePageFilters`, `usePageFilterRegistry`) → #101
- Accessibility attributes → #103
- Feature-specific UI changes → #106, #107, #108

**Verification Checklist:**

- [ ] App builds successfully
- [ ] All tests pass
- [ ] No functional regressions
- [ ] `npm run dev` works correctly

**Dependencies:** Should be extracted first as a foundation, or last to catch remaining changes

---

## Progress Tracking

| Issue | Description            | Branch                            | Status          |
| ----- | ---------------------- | --------------------------------- | --------------- |
| #101  | URL-Based Filter State | `feat/issue-101-url-filter-state` | [ ] Not Started |
| #102  | Light Mode Theme       | `feat/issue-102-light-mode`       | [ ] Not Started |
| #103  | Keyboard Navigation    | `feat/issue-103-keyboard-nav`     | [ ] Not Started |
| #104  | PvP/PvE Accent Theming | `feat/issue-104-accent-theming`   | [ ] Not Started |
| #106  | Tasks UI Improvements  | `feat/issue-106-tasks-ui`         | [ ] Not Started |
| #107  | Needed Items UI        | `feat/issue-107-needed-items`     | [ ] Not Started |
| #108  | Nav Drawer/App Bar     | `feat/issue-108-nav-drawer`       | [ ] Not Started |
| #109  | Localization           | `feat/issue-109-localization`     | [ ] Not Started |
| #110  | Shared Infrastructure  | `feat/issue-110-infrastructure`   | [ ] Not Started |

**Status Legend:** `[ ]` Not Started · `[/]` In Progress · `[x]` Complete · `[!]` Blocked

---

## Recommended Extraction Order

Based on dependencies, extract in this order:

1. **#110** - Shared Infrastructure (foundation, no feature dependencies)
2. **#109** - Localization (establishes terminology foundation)
3. **#108** - Navigation Drawer/App Bar (standalone UI reorganization)
4. **#102** - Light Mode Theme (foundation for theming)
5. **#104** - PvP/PvE Accent Theming (builds on theme infrastructure)
6. **#103** - Keyboard Navigation/Accessibility (standalone)
7. **#106** - Tasks UI Improvements
8. **#107** - Needed Items UI Facelift
9. **#101** - URL-Based Filter State (relatively independent)

> [!NOTE]
> This order may need adjustment based on the actual file changes and interdependencies discovered during detailed analysis of each issue.

---

## Strategy for Branch Creation

> [!IMPORTANT]
> **The `feat/ui-overhaul` branch will be preserved intact.** All new branches should be created fresh from the **latest `main` commit** and changes applied surgically from `feat/ui-overhaul`.

### Guiding Principles

> [!CAUTION]
> **Never do wholesale file checkouts.** Running `git checkout feat/ui-overhaul -- path/to/file.vue` brings in ALL changes to that file, including unrelated theming, styling, or other feature work. This is the #1 cause of scope creep.

1. **The app's base theme is Dark Mode.** Do not introduce `dark:` prefixes for default styles; assume the default _is_ the dark theme. Light mode styles belong exclusively to #102.
2. **PvP/PvE accent colors belong to #104.** Do not introduce `text-pvp-*`, `text-pve-*`, or accent color variables unless working on that specific issue.
3. **URL filter state belongs to #101.** Do not introduce `usePageFilters`, `usePageFilterRegistry`, or URL query parameter logic unless working on that specific issue.

### Approach

For each issue:

1. **Create a fresh branch from `main`**

   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/issue-XXX-descriptive-name
   ```

2. **Analyze the diff for scope**

   Use the fingerprints and change manifest for the issue to identify in-scope changes:

   ```bash
   # View all changes to a file
   git diff main..feat/ui-overhaul -- path/to/file.vue

   # Search for specific fingerprints in the diff
   git diff main..feat/ui-overhaul -- path/to/file.vue | grep -E "(pattern1|pattern2)"
   ```

   - Review the diff carefully. Cross-reference with the **Fingerprints** table.
   - For each hunk, ask: "Does this match an in-scope fingerprint?"
   - If it matches an **out-of-scope** pattern (e.g., `dark:` for non-#102 issues), skip it.

3. **Apply changes surgically**
   - **For new files** that only exist for this issue: `git checkout feat/ui-overhaul -- path/to/new-file.ts`
   - **For modified files**: Manually edit the `main` version, copying only in-scope hunks from the diff
   - **Never** checkout a modified file wholesale

4. **Verify isolation**

   After applying changes, run `git diff` and cross-check:

   ```bash
   git diff --staged  # If staged
   git diff           # If not staged
   ```

   Ask for each change: "Is this in the **Change Manifest** for my issue?"

   Common contaminants to watch for:
   - `dark:` prefixes (belongs to #102)
   - `text-pvp-*`, `text-pve-*` classes (belongs to #104)
   - `usePageFilters`, router.replace with query (belongs to #101)
   - `tabindex`, `focus:` attributes (belongs to #103)

5. **Build and test**

   ```bash
   npm run build   # Catch import errors
   npm run dev     # Visual inspection
   ```

   Run through the **Verification Checklist** for the issue.

6. **Commit with a meaningful message**

   Describe the actual change, not the extraction process.
   - ✅ Good: `feat(nav): convert game mode toggle to single-button cycler`
   - ❌ Bad: `chore: extract #108 changes from ui-overhaul`

7. **Return to main and update this document**

   ```bash
   git checkout main
   ```

   - Mark the completed issue as done in the "Suggested Order of PRs" section above.

---

## Quick Reference: Fingerprint Summary

| Issue | Key Fingerprints                                                                        |
| ----- | --------------------------------------------------------------------------------------- |
| #101  | `usePageFilters`, `usePageFilterRegistry`, `router.replace({ query`, `*FilterConfig.ts` |
| #102  | `dark:`, `--bg-light`, `useColorMode`, light mode color tokens (275 occurrences)        |
| #103  | `tabindex`, `focus:`, `focus-visible:`, `@keydown`, `aria-*` (217 occurrences)          |
| #104  | `text-pvp-*`, `text-pve-*`, `--accent-pvp`, `--accent-pve`, `gameMode` conditionals     |
| #106  | `RelatedTasksRow`, `TaskLink`, `prerequisites`, `nextTasks`, task chain logic           |
| #107  | `ItemIndicators`, status badges, Tarkov image filters, dense grid layout                |
| #108  | Game mode toggle move, single-button cyclers, `DrawerLevel` hover removal               |
| #109  | `*.json5` files only, `quest` → `task`, `foundInRaid` keys                              |
| #110  | `structuredClone`, config files, store refactors, shared composables                    |

---

## Notes

- Each PR should be self-contained and pass all tests independently
- Coordinate with maintainers on merge order to minimize conflicts
- Update this document as issue details are added
