import React from 'react';
import classNames from 'classnames';
import './PanelResizeHandle.scss';

const KEYBOARD_STEP = 16;

/**
 * VS Code-style "sash": a thin strip on a panel's edge that you drag to
 * resize the panel. Double-click resets to `defaultWidth`; when focused, the
 * arrow keys nudge it.
 *
 * `edge` is where the strip sits: 'right' (default; resizes the width, Left/
 * Right keys) or 'top' (a bottom-docked panel; resizes the height, dragging up
 * makes it taller, Up/Down keys). For 'top' the width props are the height.
 *
 * `onResize(width)` fires continuously while dragging; `onResizeEnd(width)`
 * fires once when a drag, reset or key nudge is done (the moment to persist).
 */
export default function PanelResizeHandle({
  edge = 'right',
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

  const isTop = edge === 'top';
  const bodyClass = isTop ? 'caf-is-resizing-rows' : 'caf-is-resizing';
  // Pointer position along the resize axis, signed so that "more" = bigger.
  const along = (e) => (isTop ? -e.clientY : e.clientX);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    // No text selection / native drag while resizing.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: along(e), width, lastWidth: null };
    // Keep the resize cursor even when the pointer outruns the strip.
    document.body.classList.add(bodyClass);
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!drag.current) return;
    drag.current.lastWidth = clamp(drag.current.width + along(e) - drag.current.x);
    onResize(drag.current.lastWidth);
  };

  const handlePointerEnd = () => {
    if (!drag.current) return;
    const { lastWidth } = drag.current;
    drag.current = null;
    document.body.classList.remove(bodyClass);
    setDragging(false);
    // A plain click (no movement) changes nothing, so there is nothing to save.
    if (lastWidth !== null && onResizeEnd) onResizeEnd(lastWidth);
  };

  const handleKeyDown = (e) => {
    const step = (isTop
      ? { ArrowDown: -KEYBOARD_STEP, ArrowUp: KEYBOARD_STEP }
      : { ArrowLeft: -KEYBOARD_STEP, ArrowRight: KEYBOARD_STEP })[e.key];
    if (!step) return;
    e.preventDefault();
    commit(clamp(width + step));
  };

  return (
    <div
      className={ classNames('caf-panel-sash', { 'caf-panel-sash--top': isTop, 'is-dragging': dragging }) }
      role="separator"
      aria-orientation={ isTop ? 'horizontal' : 'vertical' }
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
