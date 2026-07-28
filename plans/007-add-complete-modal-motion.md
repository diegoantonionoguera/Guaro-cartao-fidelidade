# 007 - Add complete modal enter and exit motion

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: MEDIUM
- **Category**: Physicality, lifecycle, and origin
- **Estimated scope**: 3 files, about 120 lines

## Problem

Modal panels declare `transition-all` but have no visual state change, so they appear immediately.

```html
<!-- src/ui/modals.js:30-31 - current -->
<div class="fixed inset-0 z-50 bg-black/80 ...">
  <div class="... shadow-2xl transition-all">
```

`renderApp()` also replaces `#modals-container` on every `store.notify()`. When `store.activeModal` becomes `none`, the old node is destroyed before an exit can run. This affects close buttons, Escape, and programmatic closes after successful operations.

```js
// src/main.js:195-196 - current
if (modalsContainer)
    setSafeHtml(modalsContainer, renderModals());
```

## Target

- Backdrop entrance: opacity, `200ms var(--ease-out)`.
- Panel entrance: opacity plus `scale(0.96) translateY(6px)`, `220ms var(--ease-out)`.
- Exit: opacity plus `scale(0.98) translateY(4px)`, `160ms var(--ease-out)`.
- Panel transform origin remains center.
- The mounted layer owns presentation state through `data-state="entering|open|closing"`.
- Every store close path completes the same exit before DOM removal.
- Reopening the same modal during exit reverses the existing transition instead of replacing the node.

```css
.modal-layer {
  opacity: 0;
  transition: opacity 200ms var(--ease-out);
}
.modal-panel {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
  transform-origin: center;
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out);
}
.modal-layer[data-state="open"] { opacity: 1; }
.modal-layer[data-state="open"] .modal-panel {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.modal-layer[data-state="closing"] {
  opacity: 0;
  transition-duration: 160ms;
}
.modal-layer[data-state="closing"] .modal-panel {
  opacity: 0;
  transform: scale(0.98) translateY(4px);
  transition-duration: 160ms;
}
```

## Repo conventions to follow

- `store.activeModal` remains the modal identity and business-state source of truth.
- `renderModals()` remains the routing function.
- Dynamic HTML continues through `setSafeHtml()`.
- Delegated event handling remains in `src/main.js`.
- No external motion library.

## Steps

1. Add the exact CSS target to `src/index.css`; plan 002 removes the old panel `transition-all`.
2. Add `data-modal-layer` and `modal-layer` to the outer shell of all 10 renderers in `src/ui/modals.js`.
3. Add `data-modal-panel` and `modal-panel` to each shell's direct panel. Do not alter the internal modal markup.
4. Replace the unconditional modal `setSafeHtml()` call in `renderApp()` with `syncModal(modalsContainer)`.
5. Keep module-scope presentation state in `main.js`: mounted modal name, cached markup, pending animation frame, exit listener, `210ms` fallback, and the element that held focus before opening.
6. When a modal name appears with no mounted layer, render it once, set `data-state="entering"`, and schedule `data-state="open"` on the next animation frame.
7. The animation-frame callback may open only a layer that is still connected, still `entering`, and still matches `store.activeModal`; this prevents a close in the same frame from reopening it.
8. When the active modal remains the same but its markup changes, replace the markup already in `data-state="open"` so coupon choices, tabs, validation, and pending labels update without replaying entrance motion.
9. When `store.activeModal === 'none'`, preserve the mounted layer, set it to `closing`, and remove it after the layer's own opacity `transitionend`.
10. Filter completion with `event.target === layer` and `event.propertyName === 'opacity'`; add a `210ms` fallback for background tabs.
11. Before removing, verify `store.activeModal === 'none'`, `layer.isConnected`, and `layer.dataset.state === 'closing'`.
12. If the same modal reopens before removal, cancel the frame, listener, and fallback, then set the existing layer back to `open` so the transition retargets from its current value.
13. If a different modal replaces the current identity without an intermediate `none`, render the new identity once in `entering`; never replay merely because its inner markup changed.
14. Restore focus only after the exit node is removed. Logout may immediately clear the container and all pending presentation handles.
15. Under reduced motion, remove scale and translation and retain a `150ms` opacity fade.

## Boundaries

- Do not delay or rewrite `store.closeModal()`; programmatic closes must be detected by the DOM synchronizer.
- Do not change modal content, validation, permissions, API calls, or confirmation dialogs.
- Do not use `scale(0)`.
- Do not exceed `220ms` entering or `160ms` exiting.
- Do not animate modal height or scroll position.
- If the file no longer contains exactly 10 routed modal shells, stop and report drift.

## Verification

- **Mechanical**: run lint, build, security tests, and any modal-specific tests.
- **DOM lifecycle**:
  - Unrelated `notify()` calls do not replace an open layer or replay its entrance.
  - Close and reopen the same modal inside `160ms`; the same node reverses without a flash.
  - Change coupon selection and client-detail tabs; content updates but the shell does not re-enter.
  - A close in the same frame as open never leaves an orphaned layer.
- **Feel check**:
  - Open and close all 10 modal types through buttons, backdrop, Escape, and successful operations.
  - At 10% playback, the panel starts at `0.96`, never zero, and the backdrop does not flash.
  - With reduced motion, only a `150ms` opacity change remains.
- **Done when**: every modal has a complete, interruptible lifecycle and store updates do not restart its motion.
