import React from 'react';
import { Layout, Button } from '@nurvus/ui';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ViewListIcon from '@material-ui/icons/ViewList';
import TuneIcon from '@material-ui/icons/Tune';
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import HistoryIcon from '@material-ui/icons/History';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import NightsStayIcon from '@material-ui/icons/NightsStay';
import PaletteOutlinedIcon from '@material-ui/icons/PaletteOutlined';
import { IS_MAC, shortcutLabel } from '../../../util/keyboard.js';
import './AppHeader.scss';

/** Header line for the last autosave, or null before the first one. */
const autosaveText = (autosave) => {
  if (!autosave) return null;
  if (autosave.status === 'failed') return 'Not saved: browser storage is blocked or full';
  const time = new Date(autosave.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return autosave.status === 'restored' ? `Restored your work from ${time}` : `Saved ${time}`;
};

export default function AppHeader({
  navHeight,
  autosave,
  showLayersPanel,
  showElementContainer,
  showHistoryPanel,
  showTimeline,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onShowExport,
  onShowJson,
  onToggleLayersPanel,
  onToggleElementPanel,
  onToggleHistoryPanel,
  onToggleTimeline,
  theme,
  onToggleTheme,
  palette,
  onTogglePalette,
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
        <div className="app-header-brand">
          <div className="caf-title">CSS Animation Factory</div>
          { autosave && (
            <span
              className={ `app-header-autosave${autosave.status === 'failed' ? ' is-failed' : ''}` }
              role="status"
              title="Your animation is saved in this browser automatically and restored next time"
            >
              { autosaveText(autosave) }
            </span>
          ) }
        </div>
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
          {/* Panel toggles: aria-pressed drives the "on" look (App.scss) and tells screen readers.
              History sits next to Undo/Redo, the controls it belongs with. */}
          <Tooltip title={showHistoryPanel ? 'Hide History panel' : 'Show History panel'}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onToggleHistoryPanel}
              aria-label={showHistoryPanel ? 'Hide History panel' : 'Show History panel'}
              aria-pressed={!!showHistoryPanel}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
          <Tooltip title={showTimeline ? 'Hide Timeline panel' : 'Show Timeline panel'}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onToggleTimeline}
              aria-label={showTimeline ? 'Hide Timeline panel' : 'Show Timeline panel'}
              aria-pressed={!!showTimeline}
            >
              <LinearScaleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Shows where a click takes you: the sun in dark mode, the moon in light. */}
          <Tooltip title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onToggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {theme === 'light' ? <NightsStayIcon fontSize="small" /> : <WbSunnyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {/* Pressed = the neutral palette (grey, after MotionCraft); off = the NURVUS navy. */}
          <Tooltip title={palette === 'neutral' ? 'Neutral palette is on: click for the NURVUS navy' : 'Neutral palette: grey instead of navy'}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onTogglePalette}
              aria-label="Neutral palette"
              aria-pressed={palette === 'neutral'}
            >
              <PaletteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button type="secondary" size="mini" onClick={onShowPresets}>Presets</Button>
          <Tooltip title="The whole animation as JSON: copy it, or paste one in to import">
            <span>
              <Button type="secondary" size="mini" onClick={onShowJson}>JSON</Button>
            </span>
          </Tooltip>
          <Button type="secondary" size="mini" onClick={onShowExport}>Export</Button>
        </Layout>
      </Layout>
    </div>
  );
}

