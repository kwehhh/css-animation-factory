import React from 'react';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { keepFocusOnMouseDown } from '../../../util/keyboard.js';
import './IsolationBar.scss';

/**
 * Shown while one layer is isolated (Illustrator's isolation mode): where you
 * are as a breadcrumb (click a parent to isolate that instead, or "All layers"
 * to leave), Fit to view, and Exit (Esc).
 */
export default function IsolationBar({ path, elements, fit, onIsolate, onToggleFit, onExit, style }) {
  const crumbs = [];
  let list = elements;
  path.forEach((index, depth) => {
    const element = list && list[index];
    if (!element) return;
    crumbs.push({ path: path.slice(0, depth + 1), name: element.displayName || element.tag || 'layer' });
    list = element.elements;
  });

  return (
    <div className="caf-isolation-wrap" style={ style }>
      <nav className="caf-isolation" aria-label="Isolation mode" onMouseDown={ keepFocusOnMouseDown }>
        <CenterFocusStrongIcon className="caf-isolation-icon" fontSize="small" aria-hidden="true" />
        <span className="caf-isolation-label">Isolated</span>
        <ol className="caf-isolation-crumbs">
          <li>
            <button type="button" className="caf-isolation-crumb" onClick={ onExit } title="Leave isolation: show all layers">
              All layers
            </button>
          </li>
          { crumbs.map((crumb, i) => {
            const current = i === crumbs.length - 1;
            return (
              <li key={ crumb.path.join('-') }>
                <ChevronRightIcon className="caf-isolation-sep" aria-hidden="true" />
                { current ? (
                  <span className="caf-isolation-crumb is-current" aria-current="location" title={ crumb.name }>{ crumb.name }</span>
                ) : (
                  <button type="button" className="caf-isolation-crumb" onClick={ () => onIsolate(crumb.path) } title={ `Isolate ${crumb.name} instead` }>
                    { crumb.name }
                  </button>
                ) }
              </li>
            );
          }) }
        </ol>
        <span className="caf-isolation-spacer" />
        <Tooltip title={ fit ? 'Fit to view is on: showing it as large as fits' : 'Fit to view is off: showing it at actual size' }>
          <IconButton className="caf-iconbtn-nav" size="small" onClick={ onToggleFit } aria-label="Fit to view" aria-pressed={ fit }>
            <ZoomOutMapIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <button type="button" className="caf-isolation-exit" onClick={ onExit } title="Leave isolation (Esc)">
          Exit
        </button>
      </nav>
    </div>
  );
}
