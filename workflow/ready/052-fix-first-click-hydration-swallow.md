# 052 — Stop swallowing the first click after page load

priority: 50

## What & why

For ~1-2s after /editor loads, clicks silently do nothing (reproduced repeatedly: the
Simple/Pro tab click after a reload had to be repeated). The static prerendered shell
renders interactive-looking controls before React hydrates and attaches handlers, so a
user's first interaction is dropped with zero feedback.

## Spec

- Investigate the mount/hydration path (app/src/editor.entry.tsx, app/src/mount.tsx,
  app/scripts/prerender.mjs) and pick the lazy fix that fits: e.g. render the prerendered
  editor shell inert (CSS `pointer-events: none` + `aria-busy` until hydration completes)
  or a visible skeleton state — anything that makes pre-hydration clicks either work or
  visibly not-yet-available. Verify whether /themes and / share the issue; fix in the
  shared entry if so, skip with a one-line reason if they don't exhibit it.
- Boundary: app entry/mount/prerender files and styles.css. No editor feature logic.

## Acceptance criteria

- Clicking a control immediately after load either performs the action once hydration lands or the UI visibly signals it is not interactive yet — no silent drop.
- No regression to prerendered SEO output (`npm run build` in app/ still emits the pages).
