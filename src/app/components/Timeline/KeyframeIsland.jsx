import React from 'react';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import TimelineLane from './TimelineLane.jsx';
import SpeedControl from './SpeedControl.jsx';
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
 * properties' current values. App only shows it for a layer that animates
 * (the Layers panel's badges say which do); otherwise it renders nothing. The axis is this layer's own span, so a short
 * animation is not squeezed by a long scene. Play, scrub and keyframe clicks
 * drive the shared scene clock, so the whole preview follows.
 */
export default function KeyframeIsland({ controller, path, layer, timelineOpen, onOpenTimeline, isolated, onIsolate, onExitIsolation, style }) {
  const { model, playing, direction, speed } = useTimeline(controller);
  const forwards = playing && direction > 0;
  const backwards = playing && direction < 0;
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

  // Its animations can go away while it is selected (a class removed, the
  // layer hidden): then there is nothing to show.
  if (!span) return null;

  return (
    <div className="caf-island-wrap" style={ style }>
      <section className="caf-island" aria-label={ `Keyframes of ${name}` } onMouseDown={ keepFocusOnMouseDown }>
        <header className="caf-island-head">
          <span className="caf-island-title" title={ name }>{ name }</span>
          <span className="caf-island-anims" title={ entries.map((e) => e.name).join(', ') }>
            { entries.map((e) => e.name).join(', ') }
          </span>
          <span className="caf-island-spacer" />
          <span className="caf-island-time caf-mono" ref={ timeRef } />
          <SpeedControl controller={ controller } speed={ speed } className="caf-tl-select caf-island-speed" name="island-playback-speed" />
          <Tooltip title={ isolated ? 'Exit isolation (Esc)' : 'Isolate: show only this layer' }>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={ () => (isolated ? onExitIsolation() : onIsolate(path)) }
              aria-label={ isolated ? 'Exit isolation' : 'Isolate this layer' }
              aria-pressed={ !!isolated }
            >
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          { !timelineOpen && (
            <Tooltip title="Show Timeline panel (all layers)">
              <IconButton className="caf-iconbtn-nav" size="small" onClick={ onOpenTimeline } aria-label="Show all layers in the Timeline panel">
                <LinearScaleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) }
        </header>

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
            <Tooltip title={ backwards ? 'Pause (K)' : 'Play backwards (J)' }>
              <IconButton
                className="caf-iconbtn-nav"
                size="small"
                onClick={ () => (backwards ? controller.pause() : controller.play(-1)) }
                aria-label={ backwards ? 'Pause' : 'Play backwards' }
                aria-pressed={ backwards }
              >
                { backwards ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" className="caf-icon-flip" /> }
              </IconButton>
            </Tooltip>
            <Tooltip title={ forwards ? 'Pause (Space or K)' : 'Play (Space or L)' }>
              <IconButton
                className="caf-iconbtn-nav caf-island-play"
                size="small"
                onClick={ () => (forwards ? controller.pause() : controller.play(1)) }
                aria-label={ forwards ? 'Pause' : 'Play' }
              >
                { forwards ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" /> }
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
                name="island-scrub"
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
      </section>
    </div>
  );
}
