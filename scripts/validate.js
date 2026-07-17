'use strict';

// Aurora invariant validator. Reads docs/design-handover/aurora-themes.json (the
// single source of truth) and turns the design rules from
// docs/design-handover/README.md into an automated pre-commit gate. Zero runtime
// dependencies — runs on a stock Node install. Read-only: never edits the JSON.
//
// Hard invariants fail the exit code; the accent-hue count is a judgement-call
// warning that prints but never fails.

const fs = require('fs');
const path = require('path');
const { expectedTokens, checkTheme, checkAnsiMapping } = require('../lib/rules');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs/design-handover/aurora-themes.json');

const useColor = process.stdout.isTTY;
const green = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);

function main() {
  const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const expected = expectedTokens(data.tokenReference);

  let hardFailures = 0;
  let warningCount = 0;

  for (const theme of data.themes) {
    const { failures, warnings } = checkTheme(theme, expected);
    for (const f of failures) {
      console.log(`${red('FAIL')}  ${theme.id}: ${f}`);
      hardFailures++;
    }
    for (const w of warnings) {
      console.log(`warn  ${theme.id}: ${w}`);
      warningCount++;
    }
  }

  for (const f of checkAnsiMapping(data.ansiMapping, expected)) {
    console.log(`${red('FAIL')}  ${f}`);
    hardFailures++;
  }

  const warnSuffix = warningCount ? ` (${warningCount} warning(s))` : '';
  if (hardFailures) {
    console.log(`\n${red(`${hardFailures} invariant failure(s)`)} across ${data.themes.length} themes${warnSuffix}.`);
    process.exit(1);
  }
  console.log(green(`OK  ${data.themes.length} themes pass all invariants${warnSuffix}.`));
}

main();
