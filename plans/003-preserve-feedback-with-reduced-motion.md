# 003 - Preserve useful feedback with reduced motion

- **Status**: DONE
- **Commit**: fc3cd2b
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 file, about 35 lines

## Problem

The global reduced-motion rule collapses every animation and transition to `0.01ms`.

```css
/* src/index.css:748 - current */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This removes spatial movement, but also removes useful color, opacity, focus, loading, and success feedback.

## Target

- Disable positional and scale movement.
- Preserve color and opacity feedback at `150ms ease`.
- Stop infinite decorative motion.
- Keep processing understandable through text even when the spinner stops.

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }

  .surface-enter,
  .animate-fade-in-scale {
    animation: reducedFade 200ms ease both !important;
    transform: none !important;
    filter: none !important;
  }

  .animate-pulse-glow,
  .shimmer-badge,
  .status-badge-change,
  .animate-shake {
    animation: none !important;
    transform: none !important;
    filter: none !important;
  }

  button,
  input,
  select,
  textarea,
  .motion-feedback {
    transition-duration: 150ms !important;
    transition-property: color, background-color, border-color, opacity, box-shadow !important;
    transform: none !important;
  }

  .busy-spinner {
    animation: none;
    border-right-color: currentColor;
    opacity: 0.65;
  }
}

@keyframes reducedFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Plans 004, 007, and 008 must add their overlay classes to this media query and remove translation/scale while retaining opacity for `150ms`.

## Repo conventions to follow

- Reduced-motion policy remains centralized at the end of `src/index.css`.
- Processing buttons already include visible `Processando...` text, so motion is not the only signal.
- Focus rings must remain unchanged.

## Steps

1. Delete the blanket universal-selector rule.
2. Add the exact policy above.
3. Add the exact `reducedFade` keyframe and use it for view/modal/toast feedback that still needs an entrance.
4. Add overlay classes introduced by plans 004, 007, and 008 as those plans land.
5. Neutralize transform states for `.team-card:hover`, `.coupon-choice:hover`, `.glass-panel-hover:hover`, button hover, and `button:active`.
6. Ensure no infinite `pulseGlow`, shimmer, badge pulse, or drawer movement runs under reduced motion.
7. Keep hover/focus color transitions at 150ms.

## Boundaries

- Do not use `animation-duration: 0.01ms` globally.
- Do not remove focus outlines.
- Do not hide loading indicators or status text.
- Do not alter non-motion accessibility behavior.

## Verification

- **Mechanical**: lint, build, security tests, then search for the old universal reduced-motion selector.
- **Feel check**:
  - Emulate `prefers-reduced-motion: reduce` in Edge DevTools.
  - Buttons still change color and focus rings remain visible.
  - Views, drawer, modals, and toast do not translate or scale.
  - Success/error messages still fade in and remain readable.
  - `Processando...` remains visible even though the spinner is static.
- **Done when**: reduced-motion users retain state feedback without positional, scale, shimmer, or pulsing movement.
