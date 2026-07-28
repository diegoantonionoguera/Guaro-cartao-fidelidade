# Animation Improvement Plans

All plans are based on commit `fc3cd2b` and the current uncommitted UI redesign.

The product is an internal operational dashboard. Motion must explain state, preserve spatial continuity, or confirm an action. A cinematic scroll-scrub world is intentionally excluded from this application; that technique belongs to the future public restaurant website.

| Plan | Title | Severity | Status | Depends on |
| --- | --- | --- | --- | --- |
| 001 | Stop replaying the manager entry | HIGH | DONE | None |
| 002 | Replace broad transitions | HIGH | DONE | None |
| 003 | Preserve feedback with reduced motion | HIGH | DONE | 001, 004, 005, 007, 008 |
| 004 | Make the message drawer interruptible | MEDIUM | DONE | 002 |
| 005 | Pulse status badges only on change | MEDIUM | DONE | 002 |
| 006 | Tighten and gate team-card hover | MEDIUM | DONE | 001, 002 |
| 007 | Add complete modal motion | MEDIUM | DONE | 002 |
| 008 | Make toasts enter, exit, and retarget | LOW | DONE | 002 |

## Recommended execution order

1. `001-stop-replaying-manager-entry.md` removes the most disruptive repeated animation and transform ownership conflict.
2. `002-replace-transition-all.md` establishes explicit transition properties and `--ease-out`.
3. `006-tighten-team-card-hover.md` corrects high-frequency hover behavior.
4. `005-pulse-status-only-on-change.md` removes permanent attention-seeking motion.
5. `004-make-sms-drawer-interruptible.md` adds the first stateful overlay lifecycle.
6. `007-add-complete-modal-motion.md` applies the same lifecycle discipline to all modals.
7. `008-make-toasts-enter-exit-and-retarget.md` adds guarded transient feedback.
8. `003-preserve-feedback-with-reduced-motion.md` integrates every final motion class into one accessibility policy.

## Global verification

After each plan:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:security
```

Before marking the set complete:

- Inspect desktop at 1440x1000 and compact layout at 500x844.
- Use Edge DevTools Animations at 10% playback.
- Test keyboard, touch emulation, 6x CPU throttling, and `prefers-reduced-motion`.
- Confirm automatic synchronization never replays view, toast, badge, modal, or drawer entrances.

## Execution verification

Completed on 2026-07-28:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test:motion` - 4 passed
- `npm.cmd run test:security` - 9 passed
- Desktop visual check at 1440x1000
- Mobile visual check at 500x844
- Drawer and modal enter/exit lifecycle checks
- Toast node persistence and replacement check
- Reduced-motion transform check
- Browser console check with zero runtime errors
