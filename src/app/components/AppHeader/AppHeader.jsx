import React from 'react';
import { Layout, Link } from '@unfocused/nurvus-ui';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ViewListIcon from '@material-ui/icons/ViewList';
import TuneIcon from '@material-ui/icons/Tune';
import './AppHeader.scss';

export default function AppHeader({
  navHeight,
  showLayersPanel,
  showElementContainer,
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
          <Tooltip title={showLayersPanel ? 'Hide Layers panel' : 'Show Layers panel'}>
            <IconButton
              className="caf-iconbtn-nav"
              size="small"
              onClick={onToggleLayersPanel}
              aria-label={showLayersPanel ? 'Hide Layers panel' : 'Show Layers panel'}
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
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Link onClick={onShowPresets}>Presets</Link>
        </Layout>
      </Layout>
    </div>
  );
}

