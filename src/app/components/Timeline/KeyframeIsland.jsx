import React from 'react';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import TimelineLane from './TimelineLane.jsx';
import { useTimeline, useTimelineFrame } from '../../timeline/useTimeline.js';
import { computedSummary, formatTime, layerSpan, localTime, pathKey } from '../../timeline/timelineModel.js';
import { keepFocusOnMouseDown } from '../../../util/keyboard.js';
import './Timeline.scss';

// Animations listed in the island; the Timeline panel shows the rest.
const MAX_LANES = 3;
// While playing, the computed values line updates this often (ms).
const COMPUTED_EVERY_MS = 120;
// Arrow keys on the scrubber move this far (ms); Shift moves 10x.
const KEY_STEP_MS = 100;

/**
 * The selected layer's keyframes, floating over the preview: its animations as
 * tracks with a diamond per keyframe, a playhead, a scrubber and the animated
 * properties' current values. The axis is this layer's own span, so a short
 * animation is not squeezed by a long scene. Play, scrub and keyframe clicks
 * drive the shared scene clock, so the whole preview follows.
 */
export default function KeyframeIsland({ controller, path, layer, hidden, timelineOpen, onOpenTimeline, style }) {
  const { model, playing } = useTimeline(controller);
  const key = pathKey(path);
  const entries = model.byPath.get(key) || [];
  const span = layerSpan(entries);
  const name = (layer && (layer.displayName || layer.tag)) || 'Layer';

  const timeRef = React.useRef(null);
  const playheadRef = React.useRef(null);
  const scrubRef = React.useRef(null);
  const computedRef = React.useRef(null);
  const lastComputed = React.useRef(0);

  const writeComputed = () => {
    if (!computedRef.current) return;
    const text = computedSummary(entries) || '—';
    computedRef.current.textContent = text;
    computedRef.current.title = text;
  };

  useTimelineFrame(controller, (time) => {
    if (!span) return;
    const local = localTime(time, span);
    const progress = (local - span.start) / (span.end - span.start);
    if (playheadRef.current) playheadRef.current.style.left = `${progress * 100}%`;
    if (timeRef.current) timeRef.current.textContent = `${formatTime(local)} / ${formatTime(span.end)}`;
    if (scrubRef.current) {
      scrubRef.current.value = String(Math.round(local));
      scrubRef.current.style.setProperty('--p', `${progress * 100}%`);
    }
    const now = window.performance.now();
    if (!controller.playing || now - lastComputed.current > COMPUTED_EVERY_MS) {
      lastComputed.current = now;
      writeComputed();
    }
  });

  // An edit to a keyframe's values moves nothing on the clock: refresh the
  // computed line now and then while paused, so it never goes stale.
  React.useEffect(() => {
    const id = window.setInterval(() => { if (!controller.playing) writeComputed(); }, 500);
    return () => window.clearInterval(id);
  });

  const seek = (time) => {
    controller.pause();
    controller.seek(time);
  };

  const handleScrubKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    seek(localTime(controller.time, span) + step * KEY_STEP_MS * (e.shiftKey ? 10 : 1));
  };

  const descendants = model.entries.filter((e) => e.path.startsWith(`${key}-`));
  const animatedInside = new Set(descendants.map((e) => e.path)).size;
  let empty = null;
  if (hidden) {
    empty = layer && layer.hidden
      ? 'This layer is hidden, so nothing on it plays.'
      : 'This layer is inside a hidden layer, so nothing on it plays.';
  } else if (!model.entries.length) {
    empty = 'Nothing in this scene animates yet. Give a class an animation (name + duration) and it shows up here.';
  } else if (!entries.length) {
    empty = animatedInside
      ? `No animation on this layer itself. ${animatedInside} layer${animatedInside === 1 ? '' : 's'} inside it animate${animatedInside === 1 ? 's' : ''}.`
      : 'No animation on this layer.';
  }

  return (
    <div className="caf-island-wrap" style={ style }>
      <section className="caf-island" aria-label={ `Keyframes of ${name}` } onMouseDown={ keepFocusOnMouseDown }>
        <header className="caf-island-head">
          <span className="caf-island-title" title={ name }>{ name }</span>
          { entries.length > 0 && (
            <span className="caf-island-anims" title={ entries.map((e) => e.name).join(', ') }>
              { entries.map((e) => e.name).join(', ') }
            </span>
          ) }
          <span className="caf-island-spacer" />
          { span && <span className="caf-island-time caf-mono" ref={ timeRef } /> }
          { !timelineOpen && (
            <Tooltip title="Show Timeline panel (all layers)">
              <IconButton className="caf-iconbtn-nav" size="small" onClick={ onOpenTimeline } aria-label="Show all layers in the Timeline panel">
                <LinearScaleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) }
        </header>

        { empty ? (
          <p className="caf-island-empty">{ empty }</p>
        ) : (
          <React.Fragment>
            <div className="caf-island-computed caf-mono">
              <span className="caf-island-computed-label">computed</span>
              <code ref={ computedRef } />
            </div>
            <div className="caf-island-body">
              <div className="caf-island-transport">
                <Tooltip title="Previous keyframe">
                  <IconButton className="caf-iconbtn-nav" size="small" onClick={ () => controller.stepKeyframe(-1, entries) } aria-label="Previous keyframe">
                    <SkipPreviousIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={ `${playing ? 'Pause' : 'Play'} (Space)` }>
                  <IconButton
                    className="caf-iconbtn-nav caf-island-play"
                    size="small"
                    onClick={ () => controller.toggle() }
                    aria-label={ playing ? 'Pause' : 'Play' }
                  >
                    { playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" /> }
                  </IconButton>
                </Tooltip>
                <Tooltip title="Next keyframe">
                  <IconButton className="caf-iconbtn-nav" size="small" onClick={ () => controller.stepKeyframe(1, entries) } aria-label="Next keyframe">
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="caf-island-tracks">
                <div className="caf-island-names">
                  { entries.slice(0, MAX_LANES).map((entry) => (
                    <span key={ entry.id } className="caf-island-lane-name caf-mono" title={ entry.name }>{ entry.name }</span>
                  )) }
                </div>
                <div className="caf-island-lanes">
                  {/* Inset by half the scrubber thumb, so a time sits at the same x
                      on the lanes, the playhead and the thumb. */}
                  <div className="caf-island-lanes-inner">
                    { entries.slice(0, MAX_LANES).map((entry) => (
                      <TimelineLane key={ entry.id } entry={ entry } from={ span.start } to={ span.end } onKeyframe={ seek } />
                    )) }
                    <div className="caf-tl-playhead caf-island-playhead" ref={ playheadRef } aria-hidden="true" />
                  </div>
                  <input
                    ref={ scrubRef }
                    className="caf-island-scrub"
                    type="range"
                    min={ Math.round(span.start) }
                    max={ Math.round(span.end) }
                    step={ 1 }
                    defaultValue={ Math.round(localTime(controller.time, span)) }
                    aria-label={ `Scrub ${name}'s animation` }
                    onPointerDown={ () => controller.pause() }
                    onChange={ (e) => seek(Number(e.target.value)) }
                    onKeyDown={ handleScrubKeyDown }
                  />
                </div>
              </div>
            </div>
            { entries.length > MAX_LANES && (
              <p className="caf-island-more">
                { `+${entries.length - MAX_LANES} more animation${entries.length - MAX_LANES === 1 ? '' : 's'} on this layer in the Timeline panel.` }
              </p>
            ) }
          </React.Fragment>
        ) }
      </section>
    </div>
  );
}
