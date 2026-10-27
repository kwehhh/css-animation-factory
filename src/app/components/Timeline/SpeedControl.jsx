import React from 'react';
import { MAX_SPEED, MIN_SPEED, clampSpeed } from '../../timeline/TimelineController.js';

// Slow motion in fractions (like 1/2, 1/3, 1/4), plus faster than real time.
export const SPEED_PRESETS = [0.1, 0.25, 1 / 3, 0.5, 0.75, 1, 1.5, 2, 4];
const CUSTOM = 'custom';
const CURRENT = 'current';

const same = (a, b) => Math.abs(a - b) < 1e-6;

/** "1/3×", "1/2×", "1×", "1.5×"; other rates as a short decimal ("0.6×"). */
export function speedLabel(speed) {
  if (same(speed, 1)) return '1×';
  if (speed < 1) {
    for (let d = 2; d <= 10; d++) {
      for (let n = 1; n < d; n++) {
        if (same(n / d, speed)) return `${n}/${d}×`;
      }
    }
  }
  return `${Number(speed.toFixed(2))}×`;
}

/** "0.6", "0.6x", "1/3", "1/3×" → a rate, or null. */
export function parseSpeed(text) {
  const m = String(text).trim().match(/^(\d*\.?\d+)\s*(?:\/\s*(\d*\.?\d+))?\s*[x×]?$/i);
  if (!m) return null;
  const value = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  return clampSpeed(value);
}

/**
 * Playback rate: the presets, plus "Custom…", which turns into a small field
 * that takes a decimal or a fraction (Enter or leaving it applies, Escape
 * cancels). A custom rate stays listed as the current choice.
 */
export default function SpeedControl({ controller, speed, className = 'caf-tl-select' }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const preset = SPEED_PRESETS.find((s) => same(s, speed));

  const apply = () => {
    const value = parseSpeed(draft);
    if (value !== null) controller.setSpeed(value);
    setEditing(false);
  };

  if (editing) {
    const invalid = draft.trim() !== '' && parseSpeed(draft) === null;
    return (
      <span className="caf-tl-speed-custom">
        <input
          className={ className }
          type="text"
          inputMode="decimal"
          autoFocus
          value={ draft }
          size={ 5 }
          placeholder="1/3"
          aria-label={ `Custom playback rate, ${MIN_SPEED} to ${MAX_SPEED} (a decimal or a fraction)` }
          aria-invalid={ invalid }
          title={ `A decimal (0.6) or a fraction (1/3), ${MIN_SPEED}× to ${MAX_SPEED}×` }
          onChange={ (e) => setDraft(e.target.value) }
          onBlur={ apply }
          onKeyDown={ (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            } else if (e.key === 'Escape') {
              // Only cancels this field (not the dialog / isolation around it).
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setEditing(false);
            }
          } }
        />
        <span aria-hidden="true">×</span>
      </span>
    );
  }

  return (
    <select
      className={ className }
      value={ preset !== undefined ? String(preset) : CURRENT }
      aria-label="Playback speed"
      title="Playback speed"
      onChange={ (e) => {
        if (e.target.value === CUSTOM) {
          setDraft(preset !== undefined ? '' : String(Number(speed.toFixed(3))));
          setEditing(true);
        } else if (e.target.value !== CURRENT) {
          controller.setSpeed(Number(e.target.value));
        }
      } }
    >
      { SPEED_PRESETS.map((s) => <option key={ s } value={ String(s) }>{ speedLabel(s) }</option>) }
      { preset === undefined && <option value={ CURRENT }>{ `${speedLabel(speed)} (custom)` }</option> }
      <option value={ CUSTOM }>Custom…</option>
    </select>
  );
}
