import React from "react";
import _ from 'lodash';
import { Layout, Menu, Text } from '@nurvus/ui';
import { Tooltip } from '@material-ui/core';
import AddNewElement from './AddNewElement.jsx';
import Container from './Container/Container.jsx';
import AddIcon from '@material-ui/icons/Add';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import RemoveRedEyeIcon from '@material-ui/icons/RemoveRedEye';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import IconButton from '@material-ui/core/IconButton';
import { shortcutLabel } from '../../util/keyboard.js';

// A new element starts as the bouncing square from
// https://css-tricks.com/making-css-animations-feel-natural/
const NEW_ELEMENT_KEYFRAMES = {
  '0%':   { transform: 'scale(1,1)      translateY(0)' },
  '10%':  { transform: 'scale(1.1,.9)   translateY(0)' },
  '30%':  { transform: 'scale(.9,1.1)   translateY(-100px)' },
  '50%':  { transform: 'scale(1.05,.95) translateY(0)' },
  '57%':  { transform: 'scale(1,1)      translateY(-7px)' },
  '64%':  { transform: 'scale(1,1)      translateY(0)' },
  '100%': { transform: 'scale(1,1)      translateY(0)' }
};

const newElementClassProps = (animationName) => ({
  width: '50px',
  height: '50px',
  background: 'red',
  borderRadius: '10px',
  animationName,
  animationDuration: '2s',
  animationIterationCount: 'infinite',
  animationDirection: 'normal',
  animationTimingFunction: 'cubic-bezier(0.280, 0.840, 0.420, 1)'
});

/**
 * First free "element-N": not used by any class, keyframes or layer name, so
 * a new element never shares (and overwrites) another one's styles.
 */
function nextNewElementName(classes = {}, keyframes = {}, elements = []) {
  const taken = new Set([...Object.keys(classes), ...Object.keys(keyframes)]);
  const walk = (list) => list.forEach((el) => { taken.add(el.displayName); walk(el.elements || []); });
  walk(elements);
  let n = 1;
  while (taken.has(`element-${n}`) || taken.has(`element-${n}-bounce`)) n += 1;
  return `element-${n}`;
}

export default class Layers extends React.Component {

  constructor() {
    super();
    this.state = {
      // The element being created in the Add New Element dialog, or null when
      // it is closed: { className, keyframesName, element }.
      draft: null
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCancelModal = this.handleCancelModal.bind(this);
    this.handleSaveModal = this.handleSaveModal.bind(this);
  }

  handleOpenModal() {
    const { classes, keyframes, elements } = this.props;
    const name = nextNewElementName(classes, keyframes, elements);
    const draft = {
      className: name,
      keyframesName: `${name}-bounce`,
      element: { displayName: name, classes: [name] }
    };

    // App remembers the document as it is now: Cancel restores it exactly,
    // Save records ONE "Add layer" step from it.
    this.props.onBeginAddElement();
    // The draft's class + animation go into the document so the dialog's
    // preview can show them. `record: false`: they are not edits (yet).
    this.props.onClassChange(draft.className, newElementClassProps(draft.keyframesName), { record: false });
    this.props.onKeyframesChange(draft.keyframesName, NEW_ELEMENT_KEYFRAMES, { record: false });
    this.setState({ draft });
  }

  handleCancelModal() {
    this.props.onCancelAddElement();
    this.setState({ draft: null });
  }

  handleSaveModal(element) {
    this.props.onAddElement(element);
    this.setState({ draft: null });
  }

  renderAddNewElementContainer() {
    const { draft } = this.state;
    // Mounted only while open, so every Add starts from a fresh dialog.
    if (!draft) return null;

    return (
      <AddNewElement
        { ...this.props }
        draft={ draft }
        element={ draft.element }
        classes={ this.props.classes }
        open
        onSave={ this.handleSaveModal }
        onCancel={ this.handleCancelModal }
      />
    );
  }

  /**
   * From the timeline model: each animated layer's animation names (by path
   * key, "0-2-1"), and the layers with an animated layer somewhere inside.
   */
  getAnimationIndex() {
    const { byPath } = this.props.timelineModel || { byPath: new Map() };
    const inside = new Set();
    byPath.forEach((entries, key) => {
      const parts = key.split('-');
      for (let i = 1; i < parts.length; i++) inside.add(parts.slice(0, i).join('-'));
    });
    return { byPath, inside };
  }

  getMenuItems(elements, path = [], animation = this.getAnimationIndex()) {
    if (elements) {
      return elements.map((item, i) => {
        const nextPath = [...path, i];
        const key = nextPath.join('-');
        return {
          ...item,
          label: item.displayName,
          path: nextPath,
          animationNames: [...new Set((animation.byPath.get(key) || []).map((entry) => entry.name))],
          animatedInside: animation.inside.has(key),
          items: this.getMenuItems(item.elements, nextPath, animation)
        }
      });
    }

    return [];

  }

  render() {
    // REFERENCE ADOBE FLASH OR OBS FOR ACTIONS
    // ADD MULTI SELECT/DRAGGING/ ETC
    // ADD LIST FOR CLASSES AND KEYFRAMES (MAYBE CATEGORIZE THEM FOR THEIR ACCESS)
    const { activeElement, elements } = this.props;
    const overflowStyle = {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    };

    const itemRenderer = (item) => {
      const { label, hidden, path, animationNames = [], animatedInside } = item;
      const handleToggleHidden = (e) => this.props.onToggleHidden?.(e, path);
      const handleRemove = (e) => this.props.onRemove?.(e, path);

      // Same MUI Tooltip as the toolbar and header icons (the row icons only
      // had plain browser `title`s, and the eye had nothing at all).
      const eyeLabel = hidden ? 'Show layer' : 'Hide layer';
      const eyeButton = (
        <Tooltip title={ eyeLabel }>
          <IconButton className="caf-iconbtn-xs" size="small" onClick={ handleToggleHidden } aria-label={ eyeLabel }>
            { hidden ? <VisibilityOffIcon fontSize="small" /> : <RemoveRedEyeIcon fontSize="small" /> }
          </IconButton>
        </Tooltip>
      );

      // Which layers animate, at a glance: a filled diamond (the timeline's
      // keyframe color) when this layer does, a hollow one when only layers
      // inside it do.
      let badge = null;
      if (animationNames.length || animatedInside) {
        const badgeLabel = animationNames.length
          ? `Animates: ${animationNames.join(', ')}`
          : 'Layers inside it animate';
        badge = (
          <Tooltip title={ badgeLabel }>
            <span
              className={ `caf-layer-badge${animationNames.length ? '' : ' is-inside'}` }
              role="img"
              aria-label={ badgeLabel }
            />
          </Tooltip>
        );
      }

      return (
        <Layout display="flex" alignItems="center" justifyContent="space-between" itemSpacing={ 0 }>
          <span className="caf-layer-name">
            <Text className="caf-text-xs" style={ overflowStyle }>{ label }</Text>
            { badge }
          </span>
          {/* itemSpacing 0 here and on the row: the 20px default gaps made the icons take 126px, more than the label room on every nested row */}
          <Layout display="flex" alignItems="center" itemSpacing={ 0 }>
            {/* A hidden layer keeps its eye-off icon showing, so you can see it is hidden without hovering. */}
            { hidden && eyeButton }
            {/* `caf-layer-actions` only takes room while the row is hovered (see App.scss). */}
            <Layout className="caf-layer-actions" display="flex" alignItems="center" itemSpacing={ 0 }>
              { !hidden && eyeButton }
              <Tooltip title="Delete layer">
                <IconButton className="caf-iconbtn-xs" size="small" onClick={ handleRemove } aria-label="Delete layer">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lock layer (coming soon)">
                <IconButton className="caf-iconbtn-xs" size="small" onClick={ (e) => e.stopPropagation() } aria-label="Lock layer (coming soon)">
                  <LockOpenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Layout>
          </Layout>
        </Layout>
      );
    };

    return (
      <Container
        visible={ true }
        style={ {
          width: this.props.width,
          maxHeight: '100%',
          overflowY: 'auto',
          // Keep this panel compact like the app nav.
          padding: 'var(--caf-space-4) var(--caf-nav-pad-x)',
        } }
      >
        <div style={{ marginBottom: 'var(--caf-space-8)' }}>
          <Layout>
            <Layout display="flex" alignItems="center" justifyContent="space-between" itemSpacing={ 0 }>
              <div className="caf-title">Layers</div>
              <Tooltip title={ `Hide Layers panel (${shortcutLabel('B')})` }>
                <IconButton
                  className="caf-iconbtn-nav"
                  size="small"
                  onClick={ this.props.onHide }
                  aria-label="Hide Layers panel"
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Layout>
            <Layout display="flex" alignItems="center" itemSpacing={ 0 }>
              <Tooltip title="Add New Element">
                <span style={{ display: 'inline-flex' }}>
                  <IconButton
                    className="caf-iconbtn-nav"
                    size="small"
                    onClick={ this.handleOpenModal }
                    aria-label="Add New Element"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Clone Selected Layer">
                <span style={{ display: 'inline-flex' }}>
                  <IconButton
                    className="caf-iconbtn-nav"
                    size="small"
                    onClick={ this.props.onClone }
                    disabled={ !this.props.activePath.length }
                    aria-label="Clone Selected Layer"
                  >
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Layout>
          </Layout>
          {/* [ADD NEW GROUP] [GROUP EL EMENTS]  [DELETE ELEMENT] */}
        </div>
        <Menu
          activePath={ this.props.activePath }
          items={ this.getMenuItems(elements) }
          itemRenderer={ itemRenderer }
          onClick={ (e, path) => this.props.onClick(path) }
        />
        { this.renderAddNewElementContainer() }
      </Container>
    );
  }
}
