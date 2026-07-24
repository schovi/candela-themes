import { PANE_ORDER, type PaneKey } from './samples/Panes';

export function PanePicker({ panes, onChange }: { panes: Set<PaneKey>; onChange: (panes: Set<PaneKey>) => void }) {
  const toggle = (key: PaneKey) => {
    const next = new Set(panes);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  return (
    <fieldset className="pane-toggles">
      <legend>Previews</legend>
      {PANE_ORDER.map((pane) => (
        <label key={pane.key}>
          <input type="checkbox" aria-label={pane.label} checked={panes.has(pane.key)} onChange={() => toggle(pane.key)} />
          {pane.label}
        </label>
      ))}
    </fieldset>
  );
}
