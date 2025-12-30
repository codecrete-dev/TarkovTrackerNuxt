# Session Notes: Visual Clarity & Consistency Audit

**Date**: 2025-12-29
**Project**: TarkovTrackerNuxt
**Current Objective**: Refine visual clarity/consistency of Task Cards and ensure Loading Screen adheres to theme settings.

## Context

We are performing a visual audit to fix contrast issues in Light Mode and ensuring consistent theming.

## Progress So Far

### 1. Tasks Page (Verified)

- **Status**: **Complete**
- **Components Audited**: `TaskCard.vue`, `TaskCardRewards.vue`, `QuestObjectives.vue`, `QuestKeys.vue`, `TaskFilterBar.vue`.
- **Fixes Applied**:
  - `TaskCardRewards`: Refined Light Mode contrast.
    - Expanded Rewards container: `bg-gray-50` with `border-gray-200`.
    - Reward Item Cards: `bg-white`, `shadow-sm`, `border-gray-200` for clear separation.
    - Links: Darkened to `text-primary-600` (Light Mode) for readability.
  - `QuestKeys`: Darkened header text for better visibility in Light Mode.
  - `TaskObjectiveItemGroup`: Removed blending issues by using semantic borders and text colors.
  - `QuestKeys`: Fixed gap between "One of" and first key in multi-key lists.
  - `GameItem`:
    - Fixed item image squishing by applying `object-contain`.
    - Optimized external link overlay for small sizes (`xs`) by reducing icon size and gaps, preventing layout breakage and ensuring a cleaner look.
- **Verification**: Confirmed "Background Check" task visuals in both Light and Dark modes.

### 2. Hideout Page (Next)

- **Components**: `HideoutModuleCard.vue`, `HideoutRequirements.vue`.
- **Focus**: Module levels, crafting queues, and requirements visibility in Light Mode. of suggested keys and headers.
- **Verification**: Verified in browser (Light/Dark) across Debut and other tasks. Contrast and readability are now high-quality.

### 2. Loading Screen Fix

- **Theme Consistency**: Updated `app/shell/LoadingScreen.vue` to remove hardcoded dark theme.
  - Background: `bg-white dark:bg-gray-950`
  - Text: Semantic/Theme-aware colors.
- **Current Status**: The file `app/shell/LoadingScreen.vue` currently has a **FORCED DEBUG STATE** (`return true; // FORCED FOR TESTING`) in the `shouldShow` computed property to allow for visual verification.

## Remaining Work

1. **Verify Loading Screen**:
   - Confirm it looks correct in Light Mode.
   - Confirm it looks correct in Dark Mode.
2. **Cleanup**:
   - **CRITICAL**: Remove the `return true` line from `app/shell/LoadingScreen.vue`.
3. **Needed Items Page**:
   - Proceed to audit `neededitems.vue` for similar clarity/theme issues.

## Files Modified

- `app/features/tasks/TaskCard.vue`
- `app/features/tasks/TaskCardRewards.vue`
- `app/features/tasks/QuestKeys.vue`
- `app/components/ui/GameItem.vue`
- `app/shell/LoadingScreen.vue`
