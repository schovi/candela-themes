# Swatches

One lightweight SVG and PNG preview per Candela theme. The SVG is the homepage tile in
miniature: its name, tone, eight color chips, and a token-colored code line. Files use
stable `candela-<id>` names and are committed for docs, listings, and external embeds.

## Regenerate

```sh
npm run swatches      # writes SVGs, no browser required
npm run swatches:png  # also writes matching PNGs through Playwright
```

The deployed SVG URL omits the `candela-` filename prefix:

```md
[![Sepia Paper](https://candela.ink/swatch/sepia-paper.svg)](https://candela.ink/themes#sepia-paper)
```
