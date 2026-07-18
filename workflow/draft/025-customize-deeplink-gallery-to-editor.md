# 025 — "Customize" deep-link from gallery cards into the Editor

priority: 7
depends: 024

## What & why

From the themes gallery you can't jump straight into editing a theme — you have to
open the Editor and re-pick it from the "Start from" select. Add a **Customize**
action on each gallery card that opens the Editor preloaded with that theme's palette.

## Spec

- **Card action**: each `/themes` gallery card gets a **Customize** link →
  `/editor?theme=<id>`. Label is "Customize" (decided).
- **Editor honors the param**: `Playground` reads `?theme=<id>` on mount and initializes
  its `seed` + `draft` from that theme (same path as picking it in "Start from"). Missing
  or unknown id → fall back to the blank template, no crash. The Editor already forks any
  theme via `reseed`, so this is wiring the URL param into the initial state, not new edit
  logic.
- **Shot-mode safety (load-bearing)**: `ThemeCard` is shared by the gallery, `ShotView`
  (screenshot mode), and the Editor's live preview. The Customize action must render
  **only** on gallery cards — never in shot mode (it would pollute the committed PNGs) and
  ideally not in the Editor's own preview. Prefer adding the link in `Gallery.tsx`'s card
  rendering, or gate it behind an explicit `ThemeCard` prop that only the gallery passes.

Implementation boundary:
- Production: `app/src/Gallery.tsx` (the Customize link) and `app/src/Playground.tsx`
  (read `?theme=` into initial state). `app/src/ThemeCard.tsx` only if an opt-in action
  prop is the chosen seam. `app/src/styles.css` for the link styling.
- Docs: `README.md`/`AGENTS.md` explorer section — one line that the gallery deep-links a
  theme into the Editor. Skip with a reason if it fits an existing sentence.
- Exclusions: no change to the Editor's editing/validation/export; Builder untouched;
  homepage index cards keep linking to `/themes#<id>` only (scope decided: gallery only).
- Validation: `cd app && npm run build`; then load `/themes`, click Customize, confirm the
  Editor opens with that palette.

## Acceptance criteria

- Every `/themes` gallery card exposes a "Customize" action linking to the Editor for that theme.
- Following it lands on the Editor with that theme's palette, name, tone, and fonts loaded (not the blank template).
- An unknown/malformed `?theme=` value opens the Editor on the blank template without error.
- The Customize control does **not** appear in screenshot shot mode; `cd app && npm run screenshots` still produces chrome-free cards.
- `cd app && npm run build` succeeds.

## Notes

Depends on 024 for the `/editor` URL. If 024 keeps the Editor at a different path, the link
target follows that path.
