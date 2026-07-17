# 015 — JetBrains plugin build + packaging

priority: 10

## What & why

Today `build/intellij/` is only the plugin *source layout* (`src/main/resources/…`
+ `META-INF/plugin.xml`) — "Gradle wiring is out of scope" (task 003), so there is
no build and no installable artifact. This is the closest analog to what 012 did
for VS Code: add the build wiring + a packaging script that turns the source
layout into a real, warning-free plugin distributable in `dist/`, ready to publish
to the JetBrains Marketplace later.

## Spec

Follow the 012 pattern (packaging script + `package:<tool>` npm script + metadata
hardening + docs), applied to JetBrains.

### Gradle build wiring (emitted into `build/intellij/`)
- Extend the intellij emitter in `scripts/generate.js` to also write a minimal,
  current `build.gradle.kts` and `settings.gradle.kts` using the **IntelliJ
  Platform Gradle Plugin** so `buildPlugin` produces a plugin `.zip`. Verify the
  current plugin coordinates + version against JetBrains docs before finalizing —
  do not hardcode a stale version blindly.
- `generate.js` stays **zero runtime dependencies** and deterministic (the emitted
  Gradle files are static text derived from the theme set).

### plugin.xml metadata hardening
- The generated `META-INF/plugin.xml` must carry warning-free, Marketplace-ready
  metadata: `<id>`, `<name>`, `<vendor>` (with url/email placeholders like 012's
  `CHANGEME`), `<description>` (HTML), `<change-notes>`, `<idea-version
  since-build=…/>`, `<version>`, plus the existing 14 `themeProvider` extensions.
  Verify required-vs-optional fields against the current plugin descriptor docs.

### Packaging script
- New `scripts/package-intellij.js`: runs `buildPlugin` in `build/intellij/`
  (assume `build/` fresh or run the build first — pick one and document, matching
  `package-vscode.js`), then copies the resulting plugin zip to
  `dist/aurora-themes-intellij-<version>.zip`. Exits **non-zero** if the build
  fails or Gradle/JDK is absent, with a clear message. No interactive prompts.
- Root `package.json`: add `package:intellij` → `node scripts/package-intellij.js`.

### Prerequisite (documented, not bundled)
- Unlike vsce (an npm devDep), the JetBrains build needs a system **JDK + Gradle**.
  Document this as a prerequisite in the README JetBrains section and have the
  packaging script fail loudly if the toolchain is missing. Do not attempt to
  vendor a Gradle wrapper binary jar into the repo.

### Docs
- Root `README.md` JetBrains install section: add the "build a real plugin"
  path (`npm run package:intellij` → `dist/…zip` → install from disk) alongside
  the existing import-`.icls` / build-from-source paths, and note the JDK+Gradle
  prerequisite. Update "How themes are generated → JetBrains" to mention the
  emitted Gradle wiring.
- Root `AGENTS.md`, "Standard loop" step 6: it currently names only
  `npm run package:vscode`. Add `package:intellij` where packaging is described.

### Implementation boundary
- **Production surfaces**: `scripts/generate.js` (intellij emitter: Gradle files +
  plugin.xml metadata), `scripts/package-intellij.js` (new), root `package.json`
  (script).
- **Docs**: `README.md`, `AGENTS.md`.
- **Load-bearing**: `generate.js` zero-runtime-dep + `build/` determinism; the two
  `.icls` / `.theme.json` hex conventions from task 003 stay correct;
  `themes/aurora-themes.json` is the untouched source of truth.
- **Exclusions**: actual Marketplace publish, accounts/tokens, CI release upload;
  a real plugin icon PNG (leave a documented TODO like the VS Code icon); changing
  the existing `.icls`/`.theme.json` color mappings.

## Acceptance criteria

- `npm run package:intellij` produces `dist/aurora-themes-intellij-<version>.zip`
  from a `buildPlugin`, exits non-zero on failure, and runs with no interactive
  prompts (given a JDK + Gradle on PATH).
- `npm run build` emits `build.gradle.kts` + `settings.gradle.kts` under
  `build/intellij/` and a `META-INF/plugin.xml` carrying id, name, vendor (placeholder
  url/email), description, change-notes, since-build, version, and 14 `themeProvider`
  extensions. Icon is a documented TODO, not a fabricated binary.
- The produced plugin zip installs via **Settings → Plugins → Install Plugin from
  Disk…** and the 14 Aurora themes appear (spot-check a warm, a cool, and one
  experiment theme).
- Root `package.json` has a `package:intellij` script; `scripts/generate.js` has no
  runtime `require` of an installed dependency and `build/` output stays
  byte-identical across runs.
- README (JetBrains install + generation sections) documents the plugin-build path
  and the JDK+Gradle prerequisite; `AGENTS.md` step 6 references `package:intellij`.
- Gate green: `python3 -m json.tool themes/aurora-themes.json` and
  `node scripts/validate.js` both exit 0.

## Notes

- Like the `.vsix`, the plugin zip need not be byte-deterministic (Gradle embeds
  metadata); `dist/` is never committed. Determinism applies to `build/`.
- If wiring a full Gradle build turns out to need real per-IDE nuance beyond a
  theme plugin's minimum, capture the surprise here rather than expanding scope.
