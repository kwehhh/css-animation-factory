import React from 'react';
import classNames from 'classnames';
import './PanelResizeHandle.scss';

const KEYBOARD_STEP = 16;

/**
 * VS Code-style "sash": a thin strip on a panel's right edge that you drag to
 * resize the panel. Double-click resets to `defaultWidth`; when focused, the
 * Left/Right arrow keys nudge it.
 *
 * `onResize(width)` fires continuously while dragging; `onResizeEnd(width)`
 * fires once when a drag, reset or key nudge is done (the moment to persist).
 */
export default function PanelResizeHandle({
  width,
  minWidth,
  maxWidth,
  defaultWidth,
  label,
  onResize,
  onResizeEnd,
}) {
  const [dragging, setDragging] = React.useState(false);
  // { x, width, lastWidth } for the drag in progress, null otherwise.
  const drag = React.useRef(null);

  const clamp = (w) => Math.min(maxWidth, Math.max(minWidth, Math.round(w)));

  const commit = (w) => {
    onResize(w);
    if (onResizeEnd) onResizeEnd(w);
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    // No text selection / native drag while resizing.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, width, lastWidth: null };
    // Keep the resize cursor even when the pointer outruns the strip.
    document.body.classList.add('caf-is-resizing');
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!drag.current) return;
    drag.current.lastWidth = clamp(drag.current.width + e.clientX - drag.current.x);
    onResize(drag.current.lastWidth);
  };

  const handlePointerEnd = () => {
    if (!drag.current) return;
    const { lastWidth } = drag.current;
    drag.current = null;
    document.body.classList.remove('caf-is-resizing');
    setDragging(false);
    // A plain click (no movement) changes nothing, so there is nothing to save.
    if (lastWidth !== null && onResizeEnd) onResizeEnd(lastWidth);
  };

  const handleKeyDown = (e) => {
    const step = { ArrowLeft: -KEYBOARD_STEP, ArrowRight: KEYBOARD_STEP }[e.key];
    if (!step) return;
    e.preventDefault();
    commit(clamp(width + step));
  };

  return (
    <div
      className={ classNames('caf-panel-sash', { 'is-dragging': dragging }) }
      role="separator"
      aria-orientation="vertical"
      aria-label={ label }
      aria-valuenow={ width }
      aria-valuemin={ minWidth }
      aria-valuemax={ maxWidth }
      tabIndex={ 0 }
      title={ `${label} (double-click to reset)` }
      onPointerDown={ handlePointerDown }
      onPointerMove={ handlePointerMove }
      onPointerUp={ handlePointerEnd }
      onPointerCancel={ handlePointerEnd }
      onDoubleClick={ () => commit(defaultWidth) }
      onKeyDown={ handleKeyDown }
    />
  );
}
