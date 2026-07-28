# 001 - Stop replaying the manager entry

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 3 files, about 35 lines

## Problem

The manager hero runs a long entrance every time `renderApp()` rebuilds the main container, including data refreshes and unrelated store notifications.

```css
/* src/index.css:712 - current */
.surface-enter {
  animation: surfaceEnter 620ms var(--ease-premium) both;
}
```

```js
// src/main.js:192 - current
if (mainContainer) {
    setSafeHtml(mainContainer, store.activeTab === 'dashboard' ? renderClientList() : renderManagerPanel());
}
```

```html
<!-- src/ui/managerPanel.js:53 - current -->
<section class="manager-hero surface-enter ...">
```

At 620ms, with `filter: blur(4px)`, this is too slow for a repeatedly used operational dashboard and it replays when the user did not navigate.

## Target

- Animate the manager hero only when entering Gerencia.
- Animate team cards only when entering the Usuarios subtab.
- Use `opacity` and `transform` only.
- Duration: `220ms`.
- Easing: `var(--ease-out)` where `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- Start at `opacity: 0` and `translateY(8px)`.
- Never animate background synchronization, search input, toast, quota, or other unrelated renders.

```css
.surface-enter {
  animation: surfaceEnter 220ms var(--ease-out) both;
}

@keyframes surfaceEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## Repo conventions to follow

- Motion tokens remain in `src/index.css` under `:root`.
- `setSafeHtml()` remains the only dynamic HTML insertion path.
- `store.activeTab` and `store.managerSubTab` define the logical view.

## Steps

1. In `src/index.css`, add `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` beside `--ease-premium`.
2. Replace the current `.surface-enter` and `surfaceEnter` declarations with the exact implementation above; delete the blur.
3. Change `renderManagerPanel()` to accept `{ animatePanelEntrance = false, animateTeamCardsEntrance = false }`.
4. Make the hero class conditional on `animatePanelEntrance`.
5. Make `surface-enter` on `managerPanel.js:292` team cards conditional on `animateTeamCardsEntrance`.
6. In `src/main.js`, track `previousPrimaryTab` and `previousManagerSubTab`.
7. Before rendering, set `animatePanelEntrance` only when the current primary tab is `manager` and the previous primary tab was not.
8. Set `animateTeamCardsEntrance` only when the current manager subtab is `usuarios` and the previous subtab was not.
9. Pass both booleans to `renderManagerPanel()`, then update the previous values after the main render.
10. Reset both trackers in the unauthenticated branch.
11. Do not animate when the tracked tab values are unchanged.

## Boundaries

- Do not change store data, API calls, authentication, or HTML structure.
- Do not animate client search result refreshes.
- Do not add GSAP or another dependency.
- If `renderApp()` no longer owns main-container replacement, stop and report drift.

## Verification

- **Mechanical**: run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run test:security`; all must pass.
- **Feel check**:
  - Open Gerencia once: one short entrance should occur.
  - Wait for automatic sync: the hero must remain stationary.
  - Change a quota or trigger a toast: the hero must not replay.
  - Enter Usuarios once: team cards may enter once in 220ms.
  - Trigger a modal or background sync while on Usuarios: cards must remain stationary.
  - At 10% playback, confirm no blur and no double exposure.
  - With reduced motion enabled after plan 003, confirm no vertical movement.
- **Done when**: entrance count equals intentional view changes, never store notification count.
