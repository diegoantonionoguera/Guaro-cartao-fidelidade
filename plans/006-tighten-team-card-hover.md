# 006 - Tighten and gate team-card hover

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file, about 20 lines
- **Dependency**: plan 001 must remove `surface-enter` from repeatedly rendered surfaces first

## Problem

Team cards use a `420ms` lift and shadow transition.

```css
/* src/index.css:659 - current */
.team-card {
  transition:
    transform 420ms var(--ease-premium),
    border-color 420ms var(--ease-premium),
    box-shadow 420ms var(--ease-premium);
}

.team-card:hover {
  transform: translateY(-3px);
}
```

This is too slow for a frequently scanned admin grid and applies hover behavior before capability is checked.

## Target

```css
.team-card {
  transition:
    transform 160ms var(--ease-out),
    border-color 160ms ease,
    box-shadow 160ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .team-card:hover {
    transform: translateY(-2px);
    border-color: var(--line-warm);
    box-shadow: 0 24px 52px -38px rgba(227, 34, 39, 0.72);
  }
}
```

Duration is `160ms`; movement is reduced from `3px` to `2px`.

## Repo conventions to follow

- Keep `--ease-out` in `:root`.
- Preserve the existing border color and shadow values.
- Existing global button press feedback remains separate.

## Steps

1. Replace the current `.team-card` transition with the exact target.
2. Move `.team-card:hover` into the fine-pointer media query.
3. Delete the redundant `@media (hover: none) { .team-card:hover { transform: none; } }`.
4. In the reduced-motion query, set `.team-card { transform: none !important; }` while preserving border-color feedback.
5. Confirm no `surface-enter` animation with `animation-fill-mode: both` owns the card transform; plan 001 must land first if it does.

## Boundaries

- Do not change card dimensions, content, grid, or shadow at rest.
- Do not add entry animations or stagger to this high-frequency list.
- Do not alter touch behavior.

## Verification

- **Mechanical**: lint, build, security tests.
- **Feel check**:
  - Sweep the pointer quickly across several team cards; each retargets immediately.
  - At 10% playback, the lift is 2px and finishes in 160ms.
  - In Computed styles, `transform` changes on hover and is not masked by an animation fill mode.
  - Emulate touch: no hover translation occurs.
  - Reduced motion: border feedback remains, movement does not.
- **Done when**: the grid feels responsive rather than buoyant and never produces a sticky hover on touch.
