# 043 — Editor inspect mode: click the preview to select a token

depends: 042

## What & why

Deepest of the three flow tasks (041 shell → 042 wiring → this): make the preview
canvas an input surface — click a keyword in the sample pane and the rail opens that
token's controls, closing the loop "I see the color I dislike, take me to its knob."
Deliberately left in draft until 041/042 ship and the new frame is felt; needs its own
groom to decide interaction design (hover highlight? which panes participate? how
pane elements map to tokens?) before it can be Ready.

## Acceptance criteria

- (Sketch — re-groom before Ready.) Clicking a tokenized element in a sample preview
  pane selects that token and reveals its controls in the rail, reusing 042's reveal
  mechanism; discoverable, keyboard-accessible, and off by default or clearly modal
  so normal text selection in panes isn't hijacked.
