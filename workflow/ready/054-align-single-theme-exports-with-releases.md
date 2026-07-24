# 054 — Align editor single-theme exports with release emitters

priority: 70

## What & why

The editor's per-theme VS Code/IntelliJ/Zed downloads drift from what the release
pipeline ships: IntelliJ uses the legacy Gradle plugin (org.jetbrains.intellij 1.17.4 +
`intellij{}`) while releases use org.jetbrains.intellij.platform 2.18.1 +
`intellijPlatform{}`; version is hardcoded 0.1.0; Zed exports a bare candela.json with
drop-in instructions instead of an extension. Terminal formats are already byte-identical.

## Spec

- lib/emitters.js:342 (DEFAULT_VERSION) and :911-948: bring the single-theme IntelliJ
  Gradle scaffold up to the release setup (mirror emitFullFamily, :1036-1057); decide and
  implement one Zed story — either emit a minimal valid extension (extension.toml +
  themes/) or keep the drop-in file but say so explicitly in the install caption.
  Version: thread the real package version where available, keep a sane standalone
  default otherwise.
- Verify each changed format still builds/installs per its own manual (README fragments
  emitted alongside).
- Boundary: lib/emitters.js single-theme emitters + their README fragments;
  app/src/ExportControls.tsx captions only if the Zed decision changes wording. Release
  packaging scripts excluded — they already use emitFullFamily.

## Acceptance criteria

- Single-theme IntelliJ export builds with the same Gradle plugin generation as the released plugin.
- Exported artifacts no longer claim version 0.1.0 when a real version is known.
- Zed export is either a valid installable extension or its caption honestly describes the drop-in nature; the choice is recorded in the task on completion.
- `node scripts/generate.js` output for the 12 release formats is unchanged (no release regression).
