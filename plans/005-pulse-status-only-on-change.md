# 005 - Pulse status badges only when values change

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 4 files, about 60 lines

## Problem

Operational indicators pulse forever even when nothing changes.

```html
<!-- src/ui/navbar.js:53 - current -->
<span class="... animate-pulse">${pendingTxs}</span>
```

```html
<!-- src/ui/navbar.js:133 - current -->
<span class="... animate-pulse">${unreadSms}</span>
```

```html
<!-- src/ui/smsDrawer.js:19 and src/ui/clientList.js:20 - current -->
<span class="... animate-pulse"></span>
```

These elements are seen tens or hundreds of times per day. Continuous motion competes with customer and transaction data.

## Target

- Status dots are static.
- Numeric badges animate once only when their count changes.
- One-shot duration: `240ms`.
- Easing: `var(--ease-out)`.
- Start: `opacity: 0.7; transform: scale(0.92)`.
- End: `opacity: 1; transform: scale(1)`.
- Never use `scale(0)`.

```css
.status-badge-change {
  animation: statusBadgeChange 240ms var(--ease-out);
}
@keyframes statusBadgeChange {
  from { opacity: 0.7; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
```

## Repo conventions to follow

- Counts are derived in `renderNavbar()`.
- `main.js` already owns post-render DOM coordination.
- No animation state is persisted to Google Sheets or the API.
- Some actions call `notify()` twice in the same task, so the one-shot state must survive consecutive renders.

## Steps

1. Remove every `animate-pulse` from `navbar.js`, `smsDrawer.js`, and `clientList.js`.
2. Add stable attributes to the numeric badges: `data-status-badge="pending"` and `data-status-badge="messages"`.
3. Add the exact one-shot CSS above to `src/index.css`.
4. In `main.js`, keep previous count values and a `pulseUntil` timestamp per badge in module scope.
5. After navbar render, compare current pending and unread counts with previous values.
6. When a previous value exists, the new value is greater than zero, and the count changed, set that badge's `pulseUntil = performance.now() + 240`.
7. Add `status-badge-change` while `performance.now() < pulseUntil`; then update the previous values. This keeps a second immediate `notify()` from stripping the class before the keyframe paints.
8. Reset previous values and both deadlines on logout or authenticated-session change so initialization never pulses.
9. Do not animate static online dots.
10. Under reduced motion, suppress this keyframe entirely.

## Boundaries

- Do not change how counts are calculated.
- Do not add sound, vibration, glow loops, or repeated timers.
- Do not animate when automatic sync returns the same count.
- Do not delay access to pending items.
- Do not add a timer merely to remove the class; the finite keyframe ends on its own.

## Verification

- **Mechanical**: `rg -n "animate-pulse" src` returns zero matches; run lint, build, and tests.
- **Feel check**:
  - Leave the panel idle for one minute: nothing pulses.
  - Create one new pending item: its count receives one subtle 240ms emphasis.
  - Sync unchanged data: no animation.
  - Increase the message count twice: each real change animates exactly once.
  - Reduced motion: no scale or pulse.
- **Done when**: motion communicates new information rather than permanent status.
