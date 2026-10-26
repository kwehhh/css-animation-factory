import React from 'react';
import classNames from 'classnames';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { IS_MAC, shortcutLabel } from '../../../util/keyboard.js';
import './HistoryPanel.scss';

const formatTime = (time) => new Date(time).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

/**
 * Photoshop-style History panel (same layout as imageslicer's HistoryDrawer):
 * every step newest first, the current one highlighted, undone steps greyed
 * above it, and a "Start" row at the bottom. Clicking any row jumps there.
 * Non-modal, so it can stay open while you work.
 *
 * `steps` and `index` mirror App's history: `index` = how many steps are
 * applied, so step N (1-based) is current when N === index.
 */
export default function HistoryPanel({
  steps,
  index,
  trimmed,
  width,
  onJump,
  onUndo,
  onRedo,
  onClose,
}) {
  const canUndo = index > 0;
  const canRedo = index < steps.length;
  const rows = steps.map((step, i) => ({ step, number: i + 1 })).reverse();

  const renderRow = (number, label, detail, time, key) => {
    const isCurrent = number === index;
    const isFuture = number > index;
    let title = 'Jump to this step (undo to here)';
    if (isCurrent) title = 'Current state';
    else if (isFuture) title = 'Jump to this step (redo to here)';

    return (
      <li key={ key }>
        <button
          type="button"
          className={ classNames('caf-history-item', { 'is-current': isCurrent, 'is-future': isFuture }) }
          aria-current={ isCurrent ? 'step' : undefined }
          title={ title }
          onClick={ () => onJump(number) }
        >
          <span className="caf-history-index">{ number }</span>
          <span className="caf-history-text">
            <span className="caf-history-primary">{ label }</span>
            { detail ? <span className="caf-history-secondary">{ detail }</span> : null }
          </span>
          { time ? <span className="caf-history-time">{ formatTime(time) }</span> : null }
        </button>
      </li>
    );
  };

  return (
    <div className="container caf-history-panel" style={ { width } }>
      <div className="caf-history-header">
        <div className="caf-panel-title">History</div>
        <Tooltip title="Close History panel">
          <IconButton className="caf-iconbtn-nav" size="small" onClick={ onClose } aria-label="Close History panel">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <div className="caf-history-subtitle">
        <span>{ steps.length ? `${steps.length} action${steps.length === 1 ? '' : 's'}` : 'No actions yet.' }</span>
        <span className="caf-history-actions">
          <button
            type="button"
            className="caf-history-btn"
            onClick={ onUndo }
            disabled={ !canUndo }
            title={ `Undo (${shortcutLabel('Z')})` }
          >
            Undo
          </button>
          <button
            type="button"
            className="caf-history-btn"
            onClick={ onRedo }
            disabled={ !canRedo }
            title={ `Redo (${IS_MAC ? shortcutLabel('Z', { shift: true }) : shortcutLabel('Y')})` }
          >
            Redo
          </button>
        </span>
      </div>
      <ol className="caf-history-list" aria-label="History steps, newest first">
        { rows.map(({ step, number }) => renderRow(number, step.label, step.detail, step.time, step.id)) }
        { steps.length
          ? renderRow(
            0,
            trimmed ? 'Oldest kept state' : 'Start',
            trimmed ? 'Older steps were dropped' : 'Before any changes',
            null,
            'start'
          )
          : null }
      </ol>
    </div>
  );
}
