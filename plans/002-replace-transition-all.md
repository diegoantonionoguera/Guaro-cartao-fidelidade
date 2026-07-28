# 002 - Replace broad transitions with explicit properties

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 7 files, 49 replacements

## Problem

Interactive elements use `transition-all`, which opts layout, sizing, shadows, transforms, and any future property into animation.

```css
/* src/index.css:222 - current */
.glass-panel-hover {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
```

```html
<!-- src/ui/clientList.js:92 - current -->
<div class="... transition-all ...">
```

The inventory at commit `fc3cd2b` is 48 `transition-all` utilities plus one `transition: all` declaration:

- `src/ui/clientList.js`
- `src/ui/managerPanel.js`
- `src/ui/modals.js`
- `src/ui/navbar.js`
- `src/ui/smsDrawer.js`
- `src/ui/toast.js`

## Target

No `transition-all` remains in application source. Use:

- Color-only controls: `transition-colors duration-150`.
- Color plus border: `transition-[color,background-color,border-color] duration-150`.
- Pressable controls that transform: explicit CSS with `transform 160ms var(--ease-out)` plus color properties.
- Overlays: plans 004, 007, and 008 own their exact transitions.

```css
.glass-panel-hover {
  transition:
    transform 160ms var(--ease-out),
    border-color 160ms ease,
    box-shadow 160ms ease;
}
```

## Repo conventions to follow

- Tailwind utility classes remain in template strings.
- Shared curves live in `src/index.css`.
- Preserve existing hover colors, shadows, and active states; only narrow transition properties.

## Steps

1. Add `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` if plan 001 has not already added it.
2. Update `.glass-panel-hover` to the exact explicit transition above.
3. In `clientList.js`, use color/border transitions on client cards and `transition-colors duration-150` on buttons.
4. In `managerPanel.js`, replace button `transition-all` with `transition-colors duration-150`; do not modify `.team-card`, which plan 006 owns.
5. In `navbar.js`, use `transition-colors duration-150` for tabs, message, and logout controls.
6. In `smsDrawer.js`, use `transition-[background-color,border-color,opacity] duration-150` for message rows and `transition-colors duration-150` for buttons.
7. In `modals.js`, use `transition-colors duration-150` for controls. Remove panel `transition-all`; plan 007 adds overlay motion.
8. In `toast.js`, remove `transition-all`; plan 008 adds exact motion.
9. Run `rg -n "transition-all|transition:\\s*all" src`; expected result: zero matches.

## Boundaries

- Do not change colors, spacing, markup, or behavior.
- Do not animate width, height, padding, margin, top, left, or grid properties.
- Do not modify generated files in `dist/`.
- If a component intentionally changes a property not listed here, add that property explicitly rather than restoring `all`.

## Verification

- **Mechanical**: `rg -n "transition-all|transition:\\s*all" src` returns no matches; then run lint, build, and security tests.
- **Feel check**:
  - Hover every primary action and navigation tab; color feedback remains.
  - Inspect DevTools Computed > transition-property; it never reports `all`.
  - Record a Performance trace while moving across client cards; no layout event should be attributed to transitions.
  - With CPU throttled 6x, hover feedback should remain immediate.
- **Done when**: all intended feedback remains and no application transition targets every CSS property.
