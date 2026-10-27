import React from 'react';
import classNames from 'classnames';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import RepeatIcon from '@material-ui/icons/Repeat';
import CloseIcon from '@material-ui/icons/Close';
import PanelResizeHandle from '../PanelResizeHandle/PanelResizeHandle.jsx';
import TimelineLane from './TimelineLane.jsx';
import SpeedControl from './SpeedControl.jsx';
import { useTimeline, useTimelineFrame } from '../../timeline/useTimeline.js';
import { formatTick, formatTime, pathKey, rulerTicks } from '../../timeline/timelineModel.js';
import { keepFocusOnMouseDown } from '../../../util/keyboard.js';
import './Timeline.scss';

// Arrow keys on the ruler move this far (ms); Shift moves 10x.
const KEY_STEP_MS = 100;

/** Every layer, depth first, with its depth and whether it (or a parent) is hidden. */
function flattenLayers(elements = [], path = [], depth = 0, hidden = false, out = []) {
  elements.forEach((element, i) => {
    const layerPath = [...path, i];
    const isHidden = hidden || !!element.hidden;
    out.push({ path: layerPath, key: pathKey(layerPath), depth, element, hidden: isHidden });
    flattenLayers(element.elements || [], layerPath, depth + 1, isHidden, out);
  });
  return out;
}

/**
 * Bottom-docked Timeline: every layer as a row with its animations as bars and
 * a diamond per keyframe, one playhead across all of them, a ruler you can
 * click or drag to scrub, and transport (start, previous/next keyframe,
 * play backwards/forwards, loop, speed). Clicking a layer name selects it, like the Layers
 * panel; clicking a diamond jumps to that keyframe and selects its layer.
 */
export default function TimelinePanel({
  controller,
  elements,
  activePath,
  height,
  minHeight,
  maxHeight,
  defaultHeight,
  animatedOnly,
  onAnimatedOnlyChange,
  onResize,
  onResizeEnd,
  onSelect,
  onReveal,
  onClose,
}) {
  const { model, playing, direction, loop, speed } = useTimeline(controller);
  const forwards = playing && direction > 0;
  const backwards = playing && direction < 0;
  const { length } = model;
  const hasAnimations = length > 0;

  const timeRef = React.useRef(null);
  const playheadRef = React.useRef(null);
  const rulerRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  const dragging = React.useRef(false);
  const [trackWidth, setTrackWidth] = React.useState(0);

  useTimelineFrame(controller, (time, total) => {
    const progress = total ? time / total : 0;
    if (playheadRef.current) playheadRef.current.style.left = `${progress * 100}%`;
    if (timeRef.current) timeRef.current.textContent = `${formatTime(time)} / ${formatTime(total)}`;
    if (rulerRef.current) {
      rulerRef.current.setAttribute('aria-valuenow', String(Math.round(time)));
      rulerRef.current.setAttribute('aria-valuetext', formatTime(time));
    }
  });

  // The ruler's labels depend on how wide the tracks are.
  React.useEffect(() => {
    const el = rulerRef.current;
    if (!el || !window.ResizeObserver) return undefined;
    const observer = new window.ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimations]);

  // The playhead is exactly as tall as the visible rows. Anything taller would
  // count as scrollable content and let the list scroll into empty space.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !window.ResizeObserver) return undefined;
    const observer = new window.ResizeObserver(() => {
      el.style.setProperty('--caf-tl-view-h', `${el.clientHeight}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimations]);

  const allRows = flattenLayers(elements);
  const rows = animatedOnly ? allRows.filter((row) => model.byPath.has(row.key)) : allRows;
  const activeKey = pathKey(activePath);

  // Keep the selected layer's row in view (selected elsewhere, e.g. the preview).
  React.useEffect(() => {
    const scroller = scrollRef.current;
    const row = scroller && activeKey && scroller.querySelector(`[data-row="${activeKey}"]`);
    if (!row) return;
    const top = row.offsetTop - (scroller.querySelector('.caf-tl-ruler-row')?.offsetHeight || 0);
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (row.offsetTop + row.offsetHeight > scroller.scrollTop + scroller.clientHeight) {
      scroller.scrollTop = row.offsetTop + row.offsetHeight - scroller.clientHeight;
    }
  }, [activeKey, animatedOnly]);

  const timeAt = (clientX, el) => {
    const rect = el.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * length;
  };

  const seek = (time) => {
    controller.pause();
    controller.seek(time);
  };

  const handleRulerPointerDown = (e) => {
    if (e.button !== 0 || !hasAnimations) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    dragging.current = true;
    seek(timeAt(e.clientX, e.currentTarget));
  };

  const handleRulerPointerMove = (e) => {
    if (dragging.current) seek(timeAt(e.clientX, e.currentTarget));
  };

  const handleRulerPointerUp = () => {
    dragging.current = false;
  };

  const handleRulerKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (step) {
      e.preventDefault();
      seek(controller.time + step * KEY_STEP_MS * (e.shiftKey ? 10 : 1));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      seek(e.key === 'Home' ? 0 : length);
    }
  };

  const handleTrackPointerDown = (e) => {
    if (e.button !== 0 || !hasAnimations) return;
    seek(timeAt(e.clientX, e.currentTarget));
  };

  const ticks = rulerTicks(length, trackWidth);

  return (
    <div className="container caf-timeline" style={ { height } }>
      <PanelResizeHandle
        edge="top"
        label="Resize Timeline panel"
        width={ height }
        minWidth={ minHeight }
        maxWidth={ maxHeight }
        defaultWidth={ defaultHeight }
        onResize={ onResize }
        onResizeEnd={ onResizeEnd }
      />
      <div className="caf-tl-toolbar" onMouseDown={ keepFocusOnMouseDown }>
        <div className="caf-panel-title caf-tl-title">Timeline</div>
        <div className="caf-tl-transport">
          <Tooltip title="Back to start">
            <span className="caf-tl-btn-wrap">
              <IconButton className="caf-iconbtn-nav" size="small" onClick={ () => seek(0) } disabled={ !hasAnimations } aria-label="Back to start">
                <FirstPageIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Previous keyframe">
            <span className="caf-tl-btn-wrap">
              <IconButton className="caf-iconbtn-nav" size="small" onClick={ () => controller.stepKeyframe(-1) } disabled={ !hasAnimations } aria-label="Previous keyframe">
                <SkipPreviousIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={ backwards ? 'Pause (K)' : 'Play backwards (J)' }>
            <span className="caf-tl-btn-wrap">
              <IconButton
                className="caf-iconbtn-nav"
                size="small"
                onClick={ () => (backwards ? controller.pause() : controller.play(-1)) }
                disabled={ !hasAnimations }
                aria-label={ backwards ? 'Pause' : 'Play backwards' }
                aria-pressed={ backwards }
              >
                { backwards ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" className="caf-icon-flip" /> }
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={ forwards ? 'Pause (Space or K)' : 'Play (Space or L)' }>
            <span className="caf-tl-btn-wrap">
              <IconButton
                className="caf-iconbtn-nav caf-tl-play"
                size="small"
                onClick={ () => (forwards ? controller.pause() : controller.play(1)) }
                disabled={ !hasAnimations }
                aria-label={ forwards ? 'Pause' : 'Play' }
              >
                { forwards ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" /> }
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next keyframe">
            <span className="caf-tl-btn-wrap">
              <IconButton className="caf-iconbtn-nav" size="small" onClick={ () => controller.stepKeyframe(1) } disabled={ !hasAnimations } aria-label="Next keyframe">
                <SkipNextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={ loop ? 'Loop is on: playback starts over at the end' : 'Loop is off: playback stops at the end' }>
            <span className="caf-tl-btn-wrap">
              <IconButton
                className="caf-iconbtn-nav"
                size="small"
                onClick={ () => controller.setLoop(!loop) }
                aria-label="Loop"
                aria-pressed={ loop }
              >
                <RepeatIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <span className="caf-tl-time caf-mono" ref={ timeRef } />
        </div>
        <div className="caf-tl-options">
          <span className="caf-tl-option">
            <span>Speed</span>
            <SpeedControl controller={ controller } speed={ speed } />
          </span>
          <label className="caf-tl-option">
            <input
              type="checkbox"
              checked={ animatedOnly }
              onChange={ (e) => onAnimatedOnlyChange(e.target.checked) }
            />
            <span>Animated layers only</span>
          </label>
          <Tooltip title="Close Timeline panel">
            <IconButton className="caf-iconbtn-nav" size="small" onClick={ onClose } aria-label="Close Timeline panel">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      { !hasAnimations ? (
        <p className="caf-empty-note caf-tl-empty">
          Nothing in this scene animates yet. Give a class an animation (an animation name and a duration) and its layer shows up here with its keyframes.
        </p>
      ) : (
        <div className="caf-tl-scroll" ref={ scrollRef } onMouseDown={ keepFocusOnMouseDown }>
          <div className="caf-tl-ruler-row">
            <div className="caf-tl-label-head">
              { animatedOnly ? `${rows.length} animated layer${rows.length === 1 ? '' : 's'}` : `${rows.length} layer${rows.length === 1 ? '' : 's'}` }
            </div>
            <div className="caf-tl-ruler-pad">
              <div
                ref={ rulerRef }
                className="caf-tl-ruler"
                role="slider"
                tabIndex={ 0 }
                aria-label="Timeline position"
                aria-valuemin={ 0 }
                aria-valuemax={ Math.round(length) }
                onPointerDown={ handleRulerPointerDown }
                onPointerMove={ handleRulerPointerMove }
                onPointerUp={ handleRulerPointerUp }
                onPointerCancel={ handleRulerPointerUp }
                onKeyDown={ handleRulerKeyDown }
              >
                { ticks.map((t) => (
                  <span key={ t } className="caf-tl-tick caf-mono" style={ { left: `${(t / length) * 100}%` } }>
                    { formatTick(t) }
                  </span>
                )) }
                <div className="caf-tl-playhead" ref={ playheadRef } aria-hidden="true" />
              </div>
            </div>
          </div>
          { rows.map((row) => {
            const entries = model.byPath.get(row.key) || [];
            const name = row.element.displayName || row.element.tag || 'layer';
            const selected = row.key === activeKey;
            return (
              <div
                key={ row.key }
                data-row={ row.key }
                className={ classNames('caf-tl-row', { 'is-selected': selected, 'is-hidden': row.hidden, 'is-static': !entries.length }) }
              >
                <button
                  type="button"
                  className="caf-tl-label"
                  style={ { paddingLeft: `calc(var(--caf-space-8) + ${animatedOnly ? 0 : row.depth} * var(--caf-space-12))` } }
                  onClick={ () => onSelect(row.path) }
                  aria-pressed={ selected }
                  title={ row.hidden ? `${name} (hidden)` : name }
                >
                  { name }
                  { row.hidden && <span className="caf-tl-label-note"> hidden</span> }
                </button>
                <div className="caf-tl-track-pad">
                  <div className="caf-tl-track" onPointerDown={ handleTrackPointerDown }>
                    { entries.map((entry) => (
                      <TimelineLane
                        key={ entry.id }
                        entry={ entry }
                        from={ 0 }
                        to={ length }
                        label
                        onKeyframe={ (time) => {
                          seek(time);
                          if (!selected) onReveal(row.path);
                        } }
                      />
                    )) }
                  </div>
                </div>
              </div>
            );
          }) }
        </div>
      ) }
    </div>
  );
}
