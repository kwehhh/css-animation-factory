import React from 'react';
import { Layout, Button } from '@nurvus/ui';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ViewListIcon from '@material-ui/icons/ViewList';
import TuneIcon from '@material-ui/icons/Tune';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import { IS_MAC, shortcutLabel } from '../../../util/keyboard.js';
import './AppHeader.scss';

export default function AppHeader({
  navHeight,
  showLayersPanel,
  showElementContainer,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onShowExport,
  onToggleLayersPanel,
  onToggleElementPanel,
  onShowPresets,
}) {
  return (
    <div
      className="app-header"
      style={{
        // Keep JS the source of truth for layout boundaries.
        // Styling lives in `AppHeader.scss`.
        '--caf-nav-height': `${navHeight}px`,
      }}
    >
      <Layout
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        itemSpacing={0}
        style={{ width: '100%', height: '100%' }}
      >
        <div className="caf-title">CSS Animation Factory</div>
        <Layout
          className="app-header-actions"
          display="flex"
          alignItems="center"
          itemSpacing={0}
        >
          {/* span wrappers: a disabled button fires no mouse events, so the Tooltip needs one */}
          <Tooltip title={`Undo (${shortcutLabel('Z')})`}>
            <span style={{ display: 'inline-flex' }}>
              <IconButton
                className="caf-iconbtn-nav"
                size="small"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={`Redo (${IS_MAC ? shortcutLabel('Z', { shift: true }) : shortcutLabel('Y')})`}>
            <span style={{ display: 'inline-flex' }}>
              <IconButton
                className="caf-iconbtn-nav"
                size="small"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {/* Panel toggles: aria-pressed drives the "on" look (App.scss) and tells screen readers. */}
          <Tooltip title={`${showLayersPanel ? 'Hide' : 'Show'} Layers panel (${shortcutLabel('B')})`}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onToggleLayersPanel}
              aria-label={showLayersPanel ? 'Hide Layers panel' : 'Show Layers panel'}
              aria-pressed={!!showLayersPanel}
            >
              <ViewListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={showElementContainer ? 'Hide Element editor' : 'Show Element editor'}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onToggleElementPanel}
              aria-label={showElementContainer ? 'Hide Element editor' : 'Show Element editor'}
              aria-pressed={!!showElementContainer}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button type="secondary" size="mini" onClick={onShowPresets}>Presets</Button>
          <Button type="secondary" size="mini" onClick={onShowExport}>Export</Button>
        </Layout>
      </Layout>
    </div>
  );
}

