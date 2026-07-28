# 004 - Make the message drawer interruptible

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 3 files, about 60 lines

## Problem

The drawer enters with a keyframe and disappears immediately when store state changes.

```css
/* src/index.css:202 - current */
.animate-slide-in-right {
  animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

```html
<!-- src/ui/smsDrawer.js:8 - current -->
<div class="... animate-slide-in-right">
```

```js
// src/main.js:248 - current
if (target.closest('#btn-close-sms-drawer')) {
    store.toggleSmsDrawer(false);
}
```

Keyframes restart rather than retarget, and there is no closing state.

## Target

- Panel entrance: `280ms var(--ease-drawer)`.
- Backdrop entrance: `200ms var(--ease-out)`.
- Panel and backdrop exit: `200ms var(--ease-out)`.
- Only `transform` and `opacity`.
- Drawer remains mounted through exit.

```css
.sms-drawer-backdrop {
  opacity: 1;
  transition: opacity 200ms var(--ease-out);
}
.sms-drawer-panel {
  transform: translateX(0);
  transition: transform 280ms var(--ease-drawer);
}
.sms-drawer-backdrop[data-state="closed"] { opacity: 0; }
.sms-drawer-backdrop[data-state="closed"] .sms-drawer-panel {
  transform: translateX(100%);
  transition-duration: 200ms;
}
```

Use `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`.

## Repo conventions to follow

- Rendering remains in `renderSmsDrawer()`.
- Click handling remains delegated from `src/main.js`.
- Store state remains the source of truth after the exit completes.

## Steps

1. Add `--ease-drawer` and the exact CSS above to `src/index.css`.
2. Delete `@keyframes slideInRight` and `.animate-slide-in-right`.
3. Replace `animate-slide-in-right` in `smsDrawer.js` with `sms-drawer-panel`.
4. Add `sms-drawer-backdrop`, `data-sms-drawer`, and initial `data-state="closed"` to the outer overlay.
5. Replace the unconditional `setSafeHtml(smsDrawerContainer, renderSmsDrawer())` in `main.js` with `syncSmsDrawer(container)`.
6. When `store.isSmsDrawerOpen` becomes true and no drawer exists, insert the markup once, then use `requestAnimationFrame()` to set `data-state="open"`.
7. When it becomes false, keep the same node mounted and set `data-state="closed"`.
8. Listen on the root backdrop for `transitionend` with `event.propertyName === 'opacity'`, then remove the closed node. Use a 240ms fallback only as a watchdog for background tabs.
9. If state returns to open before removal, cancel the fallback and pending removal listener, then set the same node back to `open`; never replace it. CSS transitions will retarget from its current position.
10. Route close-button clicks, backdrop clicks, and Escape through `store.toggleSmsDrawer(false)` so the synchronizer handles every path.
11. Keep immediate teardown only for logout, when the authenticated application unmounts.
12. In reduced motion, remove translation and retain a 150ms opacity transition.

## Boundaries

- Do not change message data or read-state behavior.
- Do not add swipe gestures or a motion dependency.
- Do not exceed 280ms.
- Do not use a fixed delay as the primary unmount signal; use `transitionend` plus fallback.
- If the drawer markup no longer has one backdrop and one panel, stop and report drift.

## Verification

- **Mechanical**: lint, build, security tests.
- **Feel check**:
  - Open and close with button, Escape, and backdrop.
  - Exit is faster than entry.
  - Close and reopen before the exit finishes; the same node reverses smoothly from its current position.
  - At 10% playback, panel and backdrop begin together and no frame jumps.
  - With reduced motion, only opacity changes.
- **Done when**: every user close path has a complete exit and no keyframe controls drawer position.
