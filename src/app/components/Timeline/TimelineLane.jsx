import React from 'react';
import classNames from 'classnames';
import { formatTime, keyframeTimes } from '../../timeline/timelineModel.js';

/**
 * One animation on a time axis from `from` to `to` (scene ms): a bar for when
 * it runs and a diamond per keyframe. An animation that repeats forever runs
 * to the end of the axis. Clicking a diamond calls onKeyframe(time, entry).
 */
export default function TimelineLane({ entry, from, to, label = false, onKeyframe }) {
  const range = Math.max(1, to - from);
  const pct = (t) => `${((Math.min(to, Math.max(from, t)) - from) / range) * 100}%`;
  const barEnd = entry.infinite ? to : Math.min(to, entry.end);
  const frames = keyframeTimes(entry, from, barEnd);
  const name = `${entry.name}${entry.pseudo ? ` ${entry.pseudo}` : ''}`;

  return (
    <div className="caf-tl-lane">
      <div
        className={ classNames('caf-tl-bar', { 'is-infinite': entry.infinite }) }
        style={ { left: pct(entry.start), right: `calc(100% - ${pct(barEnd)})` } }
        title={ `${name}: ${formatTime(entry.duration)}${entry.delay ? `, delay ${formatTime(entry.delay)}` : ''}, ${entry.infinite ? 'repeats forever' : `${entry.iterations}×`}` }
      >
        { label && <span className="caf-tl-bar-label">{ name }</span> }
      </div>
      { frames.map((kf) => (
        <button
          key={ `${kf.iteration}-${kf.offset}-${kf.time}` }
          type="button"
          tabIndex={ -1 }
          className="caf-tl-key"
          style={ { left: pct(kf.time) } }
          aria-label={ `Go to ${name} keyframe ${Math.round(kf.offset * 100)}% at ${formatTime(kf.time)}` }
          title={ `${name} ${Math.round(kf.offset * 100)}% · ${formatTime(kf.time)}` }
          onPointerDown={ (e) => e.stopPropagation() }
          onClick={ (e) => {
            e.stopPropagation();
            if (onKeyframe) onKeyframe(kf.time, entry);
          } }
        />
      )) }
    </div>
  );
}
