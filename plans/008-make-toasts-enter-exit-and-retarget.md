# 008 - Make toasts enter, exit, and retarget cleanly

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: LOW
- **Category**: Interruptibility
- **Estimated scope**: 4 files, about 100 lines

## Problem

The toast has broad transition utilities but no explicit enter or exit state.

```html
<!-- src/ui/toast.js:9 - current -->
<div role="..." class="... transition-all duration-300 ...">
```

The store clears it immediately after its timeout, and `renderApp()` replaces the entire container on every notification. A CSS entrance would therefore replay on unrelated data updates, while an exit could never complete.

```js
// src/store.js:214 - current
this.toast = { message, type, id: Date.now() };
setTimeout(() => {
    this.toast = null;
    this.notify();
}, 3600);
```

Using `Date.now()` as both identity and elapsed-time clock also permits collisions between notifications created in the same millisecond.

## Target

- Entry: `opacity: 0; translateY(8px)` to rest in `200ms var(--ease-out)`.
- Exit: rest to `opacity: 0; translateY(8px)` in `150ms var(--ease-out)`.
- Use CSS transitions, not keyframes.
- Unrelated store notifications neither rebuild nor replay a toast.
- A replacement marks the previous node as closing and mounts the new one once.
- The container may temporarily hold one current and one exiting node, but there is still only one active product notification.

```css
#toast-container {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 50;
  display: grid;
  gap: 0.5rem;
  pointer-events: none;
}
.toast-message {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}
.toast-message[data-state="entering"],
.toast-message[data-state="closing"] {
  opacity: 0;
  transform: translateY(8px);
}
.toast-message[data-state="closing"] {
  transition-duration: 150ms;
}
```

At the existing `sm` breakpoint, keep the current right-aligned maximum width and release `left`.

## Repo conventions to follow

- Toast semantics remain `role="status|alert"` and `aria-live="polite|assertive"`.
- `store.toast` remains the single active notification source.
- Dynamic insertion continues through `setSafeHtml()` or its existing safe-fragment helper.
- `renderApp()` still owns `#toast-container`.

## Steps

1. Replace time-derived identity in `src/store.js` with a module or store monotonic `nextToastId`.
2. Store one `toastDismissTimer`. `showToast()` cancels the prior timer, assigns the next ID, notifies, and captures that ID in a `3500ms` callback.
3. The dismissal callback may clear `store.toast` only when the captured ID still equals the active toast ID, then it notifies. An old timer must never clear a replacement.
4. Change `renderToast()` to `renderToast(toast)` and render one item with `data-toast-id`, `data-state="entering"`, and `toast-message`.
5. Move fixed positioning from the item to `#toast-container`, preserving the current mobile gutters and `sm:max-w-md` equivalent.
6. Remove `transition-all duration-300` and add the exact transition CSS above.
7. Replace unconditional toast `setSafeHtml()` calls in both authenticated and unauthenticated branches with `syncToast(toastContainer)`.
8. In `syncToast`, locate nodes by `data-toast-id`. If the active ID already has a connected `open` node, do nothing on unrelated notifications.
9. When a new ID appears, mark any older current node `closing`, attach guarded removal, then insert the new item once as `entering`.
10. On the next animation frame, set the new item to `open` only if it is connected, still `entering`, and its ID still matches `store.toast.id`.
11. When `store.toast` becomes null, mark the current node `closing` rather than clearing the container.
12. Remove a closing node on its own opacity `transitionend`, filtering `event.target === node` and `event.propertyName === 'opacity'`; use a `200ms` fallback.
13. Before fallback or event removal, confirm `node.isConnected` and `node.dataset.state === 'closing'`.
14. Cap the container at three DOM nodes during rapid bursts by immediately removing the oldest already-closing node before inserting beyond the cap. Never queue more than one active notification in store state.
15. Under reduced motion, remove translation and keep entry and exit opacity at `150ms`.

## Boundaries

- Do not change toast copy, role, color, or live-region priority.
- Do not convert the product to a persistent multi-toast stack.
- Do not add swipe dismissal or another dependency.
- Do not use a fixed timer as the primary DOM-removal signal; it is only a fallback.
- Do not let logout prevent login errors from rendering in the same container.

## Verification

- **Mechanical**: run lint, build, and security tests; add a fake-timer unit test if store timers are already testable.
- **DOM lifecycle**:
  - Trigger a toast, then a tab change or background sync; its node identity remains stable.
  - Trigger a second toast before dismissal; the prior node exits and the new node enters once.
  - Trigger several notifications in the same millisecond; every ID is unique and the container never exceeds three nodes.
  - Let the old dismissal deadline pass after replacement; the new toast remains.
- **Feel check**:
  - Check success, error, and information toasts at desktop and mobile widths.
  - Automatic exit is faster than entry and has no final-frame pop.
  - At 10% playback, a rapid replacement has no restart or jump.
  - With reduced motion, only opacity changes for `150ms`.
- **Done when**: toast identity, entrance, replacement, and removal remain correct under unrelated and rapid store notifications.
