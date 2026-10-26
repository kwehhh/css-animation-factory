import React from 'react';
import { HistoryList } from '@nurvus/ui';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { IS_MAC, shortcutLabel } from '../../../util/keyboard.js';
import './HistoryPanel.scss';

/**
 * Photoshop-style History panel. The list itself is @nurvus/ui's HistoryList
 * (every step newest first, current highlighted, undone steps faded, a Start
 * row; click to jump). This adds the panel chrome: title, close, the action
 * count and Undo/Redo. Non-modal, so it can stay open while you work.
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
      <div className="caf-history-scroll">
        <HistoryList
          steps={ steps }
          index={ index }
          onJump={ onJump }
          startLabel={ trimmed ? 'Oldest kept state' : 'Start' }
          startDetail={ trimmed ? 'Older steps were dropped' : 'Before any changes' }
        />
      </div>
    </div>
  );
}
