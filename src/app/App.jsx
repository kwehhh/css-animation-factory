import React from "react";
import { Helmet } from "react-helmet";
import { Menu, Link } from '@nurvus/ui';
import { Drawer } from '@material-ui/core';
import _ from "lodash";
import AnimationContainer from './components/AnimationContainer/AnimationContainer.jsx';
import AppHeader from './components/AppHeader/AppHeader.jsx';
import ElementEditor from './components/ElementEditor.jsx';
import ExportModal from './components/ExportModal/ExportModal.jsx';
import Layers from './components/Layers.jsx';
import PanelResizeHandle from './components/PanelResizeHandle/PanelResizeHandle.jsx';
import Preview from './components/Preview.jsx';
import { convertCamelToKebabCase } from '../util/StringUtil.js';
import { svgToElements } from '../util/svgToElements.js';
import { cssToModel } from '../util/cssToModel.js';
import { isEditableTarget } from '../util/keyboard.js';
import "./App.scss";

// Layers panel width (px): default, drag limits, and where the user's choice is remembered.
const LAYERS_WIDTH = { default: 180, min: 180, max: 480 };
const LAYERS_WIDTH_STORAGE_KEY = 'caf.layersWidth';

// Undo/redo history. Only the animation itself is undoable; selection and
// panel layout are UI state and stay where they are.
const HISTORY_DOC_KEYS = ['elements', 'classes', 'keyframes', 'css'];
const HISTORY_LIMIT = 100;
// Edits to the same field closer together than this become one undo step
// (one slider drag, one typed value) instead of one step per keystroke.
const HISTORY_MERGE_MS = 1000;

function readStoredLayersWidth() {
  try {
    const stored = Number(window.localStorage.getItem(LAYERS_WIDTH_STORAGE_KEY));
    if (stored >= LAYERS_WIDTH.min && stored <= LAYERS_WIDTH.max) {
      return stored;
    }
  } catch {
    // Storage blocked (private window, site data off): fall back to the default.
  }
  return LAYERS_WIDTH.default;
}

export default class App extends React.Component {

  constructor(props) {
    super();

    const { data } = props;
    this.state = {
      // Current Selected Layer/Element
      activePath: [],
      // activePath: [0, 0, 0],
      // Defaults
      classes: {},
      keyframes: {},
      elements: [],
      // SVG presets carry a raw `svg` string (expanded into an editable element
      // tree on load) + raw `css` injected verbatim.
      css: '',
      // Assign
      ...data,
      // activeElement: null,
      // FOR TESTING....
      activeElement: 0,
      activeKeyframesId: null,
      // activeKeyframesId: 'orbit',
      showLayersPanel: true,
      layersWidth: readStoredLayersWidth(),
      // Nothing is selected on load, so the editor starts closed (it opens on select).
      showElementContainer: false,
      isElementEditorExpanded: true,
      showExport: false,
      showPresets: false,
      presets: [],
      canUndo: false,
      canRedo: false
    };

    // Snapshots of HISTORY_DOC_KEYS. `last` describes the newest recorded change
    // so the next one can merge into it (see recordHistory).
    this.history = { past: [], future: [], last: null };
    // Filled by noteHistoryChange() just before a handler's setState.
    this.historyHint = null;
    this.isApplyingHistory = false;

    // console.log('constructor', props, this.state);
    this.handleCloneElement = this.handleCloneElement.bind(this);
    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleSelectKeyframes = this.handleSelectKeyframes.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleShowPresets = this.handleShowPresets.bind(this);
    this.handleHidePresets = this.handleHidePresets.bind(this);
    this.handleUpdateClass = this.handleUpdateClass.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElementAtPath = this.handleUpdateElementAtPath.bind(this);
    this.handleUpdateKeyframes = this.handleUpdateKeyframes.bind(this);
    this.handleElementEditorExpandedChange = this.handleElementEditorExpandedChange.bind(this);
  }

  handleShowExport = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState({ showExport: true });
  }

  handleHideExport = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState({ showExport: false });
  }

  handleToggleLayersPanel = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({ showLayersPanel: !prevState.showLayersPanel }));
  }

  handleLayersResize = (layersWidth) => {
    this.setState({ layersWidth });
  }

  handleLayersResizeEnd = (layersWidth) => {
    try {
      window.localStorage.setItem(LAYERS_WIDTH_STORAGE_KEY, String(layersWidth));
    } catch {
      // Storage blocked: the width still applies for this visit.
    }
  }

  handleToggleElementPanel = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({ showElementContainer: !prevState.showElementContainer }));
  }

  handleElementEditorExpandedChange(isExpanded) {
    this.setState({ isElementEditorExpanded: !!isExpanded });
  }

  /**
   *
   * @param {*} path
   * @param {*} elements
   * @returns {object|null}
   */
  getActiveElement(path, elements) {
    if (!path?.length) return null;
    if (!elements) return null;

    // Traverse defensively: selection paths can become stale after deletes/preset swaps.
    let current = { elements };
    for (const index of path) {
      const nextElements = current?.elements;
      if (!Array.isArray(nextElements)) return null;
      const next = nextElements[index];
      if (!next) return null;
      current = next;
    }

    return current || null;
  }

  getCSSfromStyleObj(style, formatter) {
    let css = '';
    Object.keys(style).forEach((attr) => {
      // console.log(attr);
      if (formatter) {
        css += formatter(convertCamelToKebabCase(attr), style[attr]);
      } else {
        css += `${convertCamelToKebabCase(attr)}: ${style[attr]};\n`;
      }
    });

    return css;
  }

  // CSS goes into app HEAD STYLE tag
  getDisplayCSS() {
    const { classes, elements, keyframes } = this.state;
    let displayCSS = '';

    // Generate CSS from Elements
    if (elements) {
      elements.forEach((element) => {
        const { css, keyframes, name, props } = element;

        // // Convert props to CSS
        // if (props) {
        //   let block = props;
        //   if (!_.isString(props)) {
        //     block = this.getCSSfromStyleObj(props);
        //   }

        //   displayCSS += this.createCSSBlock(`.${name}`, block);
        // }

        // !! TODO: Extract Keyframes
        if (keyframes) {
          let block = keyframes;
          if (!_.isString(keyframes)) {
            block = this.getKeyframesCSS(name, keyframes);
          }

          displayCSS += this.createCSSBlock(`@keyframes ${name}`, block);
        }
      });
    }

    // Generate CSS from Classes
    if (classes) {
      Object.keys(classes).forEach((className) => {
        const block = this.getCSSfromStyleObj(classes[className]);
        displayCSS += this.createCSSBlock(`.${className}`, block);
      });
    }

    // Generate CSS from Keyframes
    if (keyframes) {
      Object.keys(keyframes).forEach((className) => {
        // const block = this.getCSSfromStyleObj(keyframes[className]);
        const block = this.getKeyframesCSS(className, keyframes[className]);
        // displayCSS += this.createCSSBlock(`.${className}`, block);
        displayCSS += this.createCSSBlock(`@keyframes ${className}`, block);
      });
    }

    // Raw CSS from a markup/SVG preset — injected verbatim (fills, @keyframes, id rules).
    // Only present while such a preset is active; cleared on preset switch.
    if (this.state.css) {
      displayCSS += `\n${this.state.css}\n`;
    }

    // console.log('getDisplayCSS', displayCSS);
    return displayCSS;
  };

  // getCSSfromStyleObj(styleProps) {
  //   return this.getCSSfromStyleObj(styleProps);
  // }

  // here ....
  getElementCSS(name, style) {
    let css = '';
    // css += `.${name} {\n`;
    css += this.getCSSfromStyleObj(style);
    // css += `}\n`;

    return css;
  }

  // Expand a preset into the editable model:
  //  - raw `svg` string -> element tree (Layers)
  //  - raw `css` string -> classes + keyframes (Element Editor can resolve them);
  //    id/grouped rules stay as raw `css` and are still injected verbatim.
  expandPreset(preset) {
    if (!preset) return preset;
    let next = preset;

    if (preset.svg && !(preset.elements && preset.elements.length)) {
      next = { ...next, elements: svgToElements(preset.svg) };
    }

    if (preset.css) {
      const { classes, keyframes, rest } = cssToModel(preset.css);
      next = {
        ...next,
        classes: { ...(next.classes || {}), ...classes },
        keyframes: { ...(next.keyframes || {}), ...keyframes },
        css: rest
      };
    }

    return next;
  }

  // Fetch JSON Preset
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);

    const { files } = this.props.manifest;
    const file = `data/${files[0]}`;
    fetch(file).then(res => res.json()).then(data => {
      const expanded = this.expandPreset(data);
      // The starting preset is where history begins, not an undoable step.
      this.noteHistoryChange({ record: false });
      this.setState(prevState => ({
        ...prevState,
        ...expanded
      }));
    });
    Promise.all(files.map(file => fetch(`data/${file}`))).then(responses => {
      return Promise.all(responses.map(res => res.json()));
    }).then(presets => {
      this.setState({ presets: presets.map((preset, i) => ({
        ...this.expandPreset(preset),
        src: files[i]
      })) });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const hint = this.historyHint;
    const isApplyingHistory = this.isApplyingHistory;
    this.historyHint = null;
    this.isApplyingHistory = false;

    // Every change to the animation passes through here, whichever handler made
    // it, so nothing can bypass history. Undo/redo itself is not recorded.
    const docChanged = HISTORY_DOC_KEYS.some((key) => prevState[key] !== this.state[key]);
    if (!docChanged || isApplyingHistory || (hint && hint.record === false)) return;

    this.recordHistory(prevState, hint && hint.key);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Every handler that changes the animation calls this just before its
   * setState. `key` lets repeated edits of the same field merge into one step;
   * `record: false` marks a change that is not a user edit. React can batch
   * several handlers into one update: it is recorded if ANY of them is a real
   * edit, so a non-edit can never swallow one. (A change with no note at all
   * is recorded too.)
   */
  noteHistoryChange({ key = null, record = true } = {}) {
    const prev = this.historyHint;
    this.historyHint = {
      key,
      record: record || !!(prev && prev.record)
    };
  }

  getDocSnapshot(state) {
    return _.pick(state, HISTORY_DOC_KEYS);
  }

  /**
   * Save the animation as it was before a change, unless the change merges into
   * the previous step: same synchronous run (e.g. the source editor applying
   * several classes at once), or the same field edited again within
   * HISTORY_MERGE_MS. State is never mutated in place, so snapshots share
   * everything that did not change.
   */
  recordHistory(prevState, key = null) {
    const now = Date.now();
    const { last } = this.history;
    const merge = !!last && (last.sameRun || (!!key && last.key === key && now - last.time < HISTORY_MERGE_MS));

    if (!merge) {
      this.history.past.push(this.getDocSnapshot(prevState));
      if (this.history.past.length > HISTORY_LIMIT) {
        this.history.past.shift();
      }
    }
    this.history.future = [];

    const entry = { key, time: now, sameRun: true };
    this.history.last = entry;
    setTimeout(() => { entry.sameRun = false; }, 0);

    this.syncHistoryButtons();
  }

  syncHistoryButtons() {
    const canUndo = this.history.past.length > 0;
    const canRedo = this.history.future.length > 0;
    if (canUndo !== this.state.canUndo || canRedo !== this.state.canRedo) {
      this.setState({ canUndo, canRedo });
    }
  }

  isValidPath(elements = [], path = []) {
    let list = elements;
    return path.every((index) => {
      const element = list && list[index];
      list = element && element.elements;
      return !!element;
    });
  }

  applyHistorySnapshot(snapshot) {
    // The next edit always starts a new step, even if it hits the same field.
    this.history.last = null;
    this.isApplyingHistory = true;
    this.setState((prevState) => ({
      ...snapshot,
      // Keep the selection when it still points at an element, else clear it.
      activePath: this.isValidPath(snapshot.elements, prevState.activePath) ? prevState.activePath : [],
      canUndo: this.history.past.length > 0,
      canRedo: this.history.future.length > 0
    }));
  }

  handleUndo = () => {
    if (!this.history.past.length) return;
    const snapshot = this.history.past.pop();
    this.history.future.push(this.getDocSnapshot(this.state));
    this.applyHistorySnapshot(snapshot);
  }

  handleRedo = () => {
    if (!this.history.future.length) return;
    const snapshot = this.history.future.pop();
    this.history.past.push(this.getDocSnapshot(this.state));
    this.applyHistorySnapshot(snapshot);
  }

  /**
   * App-wide Cmd/Ctrl shortcuts. Text fields and the code editors keep their own
   * (so Cmd+Z there undoes typing, not the animation).
   */
  handleKeyDown = (e) => {
    if (e.defaultPrevented || !(e.metaKey || e.ctrlKey) || e.altKey) return;
    if (isEditableTarget(e.target)) return;

    const key = e.key.toLowerCase();
    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.handleRedo();
      } else {
        this.handleUndo();
      }
    } else if (key === 'y' && e.ctrlKey && !e.shiftKey) {
      // Windows/Linux redo. Not Cmd+Y: on a Mac that opens the browser history.
      e.preventDefault();
      this.handleRedo();
    } else if (key === 'b' && !e.shiftKey) {
      e.preventDefault();
      this.handleToggleLayersPanel();
    }
  }

  createCSSBlock(blockName, cssBlock) {
    return `${blockName} {\n${cssBlock}}\n`;
  }

  getKeyframesCSS(name, keyframes) {
    let css = '';

    Object.keys(keyframes).forEach((keyframe, i) => {
      const formatter = (attr, value) => {
        return `  ${attr}: ${value};\n`;
      };

      if (i > 0) {
        css += '\n';
      }
      css += this.createCSSBlock(keyframe, this.getCSSfromStyleObj(keyframes[keyframe], formatter));

      // console.log('keyframeCSS', keyframeCSS, keyframe, keyframes, name);
    });



    // css = this.createCSSBlock(`@keyframes ${name}`, css);


    // css += `.${name} {\n`;
    // css += this.getCSSfromStyleObj(style);
    // css += `}\n`;

    // console.log('getKeyframesCSS', css);

    return css;
  }

  getElementCSSKeyframes() {

  }

  getKeyframes(keyframes) {
    let css = '';
    keyframes.forEach((keyframe) => {
      css += keyframe;
    });

    return css;
  }

  cloneInsertion(elements = [], path = []) {
    if (path.length) {
      const [index, ...nextPath] = path;
      const newElements = [...elements];
      const refElement = newElements[index];
      const extraProps = refElement.elements ? { elements: this.cloneInsertion(refElement.elements, nextPath) } : {};
      const newElement = { ...refElement, ...extraProps };

      // Clone Element
      if (path.length === 1) {
        const getNameRoot = (name = '') => name.replace(/\s+\d+$/, '');
        const getNextName = (rootName, siblings) => {
          const root = getNameRoot(rootName);
          let max = 0;

          siblings.forEach((sibling) => {
            const siblingName = sibling?.displayName || '';
            if (siblingName === root) {
              max = Math.max(max, 1);
              return;
            }

            const match = siblingName.match(new RegExp(`^${_.escapeRegExp(root)}\\s+(\\d+)$`));
            if (match) {
              max = Math.max(max, parseInt(match[1], 10));
            }
          });

          return { root, max, next: `${root} ${max + 1}` };
        };

        const { root, max, next } = getNextName(newElement.displayName, newElements);

        // If this is the first duplicate, rename original to "<root> 1"
        if (max <= 1 && newElement.displayName === root) {
          newElements[index] = { ...newElement, displayName: `${root} 1` };
        } else {
          newElements[index] = newElement;
        }

        // Ensure the clone is a distinct object (no shared references)
        const cloneElement = _.cloneDeep(newElements[index]);
        cloneElement.displayName = next;
        newElements.push(cloneElement);
      } else {
        newElements[index] = newElement;
      }

      return newElements;
    }

    return elements;
  }

  updateElementAtPath(elements = [], path = [], updater) {
    if (!path.length) return elements;

    const [index, ...rest] = path;
    const nextElements = [...elements];
    const current = nextElements[index];

    if (!current) return elements;

    if (!rest.length) {
      nextElements[index] = updater(current);
      return nextElements;
    }

    const childElements = current.elements || [];
    nextElements[index] = {
      ...current,
      elements: this.updateElementAtPath(childElements, rest, updater)
    };
    return nextElements;
  }

  removeElementAtPath(elements = [], path = []) {
    if (!path.length) return elements;
    const [index, ...rest] = path;
    const nextElements = [...elements];
    const current = nextElements[index];
    if (!current) return elements;

    if (!rest.length) {
      nextElements.splice(index, 1);
      return nextElements;
    }

    const childElements = current.elements || [];
    nextElements[index] = {
      ...current,
      elements: this.removeElementAtPath(childElements, rest)
    };
    return nextElements;
  }

  adjustActivePathAfterRemoval(activePath = [], removedPath = []) {
    if (!activePath.length || !removedPath.length) return activePath;

    // If the removed path is a prefix of the active path, clear selection.
    const isPrefix = removedPath.every((v, i) => activePath[i] === v);
    if (isPrefix) return [];

    // If same parent, and active index is after removed index, decrement it.
    if (activePath.length === removedPath.length) {
      const parentMatches = removedPath.slice(0, -1).every((v, i) => activePath[i] === v);
      if (parentMatches) {
        const removedIdx = removedPath[removedPath.length - 1];
        const activeIdx = activePath[activePath.length - 1];
        if (activeIdx > removedIdx) {
          return [...activePath.slice(0, -1), activeIdx - 1];
        }
      }
    }

    return activePath;
  }

  handleRemoveElement = (e, path) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.noteHistoryChange();
    this.setState((prevState) => ({
      elements: this.removeElementAtPath(prevState.elements, path),
      activePath: this.adjustActivePathAfterRemoval(prevState.activePath, path)
    }));
  }

  handleCloneElement() {
    this.noteHistoryChange();
    this.setState((prevState) => {
      return {
        elements: this.cloneInsertion(prevState.elements, prevState.activePath)
      };
    });
  }

  handleToggleHidden = (e, path) => {
    if (e?.stopPropagation) e.stopPropagation();

    this.noteHistoryChange();
    this.setState((prevState) => {
      return {
        elements: this.updateElementAtPath(prevState.elements, path, (el) => ({
          ...el,
          hidden: !el.hidden
        }))
      };
    });
  }

  /**
   * New/Update ....
   * @param {array} path - ...
   */
   handleSelectElement(path) {
    let activePath = path;
    const isSamePath = _.isEqual(activePath, this.state.activePath);
    if (isSamePath) {
      activePath = [];
    }

    // Selecting opens the Element Editor; clicking the selected thing again
    // deselects it and closes the editor, so the header toggle stays truthful.
    this.setState({
      activePath,
      showElementContainer: activePath.length > 0
    });
  }

  handleSelectKeyframes(activeKeyframeId) {
    this.setState({activeKeyframeId});
  }

  handleShowContainer() {
    this.setState({showElementContainer: true});
  }

  handleHideContainer() {
    this.setState({showElementContainer: false});
  }

  handleShowPresets() {
    this.setState({showPresets: true});
  }

  handleHidePresets(e, path) {
    this.setState({
      showPresets: false
    });
  }

  /**
   * Handle set preset
   * @param {object} e - event
   * @param {array} path - preset index
   */
  handleSetPreset = (e, path) => {
    // `path` is a Menu path array like [index]; it coerces to the preset index.
    const preset = path ? this.state.presets[path] : null;

    // Undoable: a misclick in Presets would otherwise wipe the current work.
    this.noteHistoryChange();
    this.setState({
      showPresets: false,
      // Reset all preset-driven fields first so nothing leaks between presets
      // (especially SVG css when switching to/from a div-based preset).
      elements: [],
      classes: {},
      keyframes: {},
      css: '',
      activePath: [],
      ...(preset || {})
    });
  }

  handleUpdateElements(element) {
    this.handleHideContainer();

    this.noteHistoryChange();
    this.setState((prevState) => {
      return {
        elements: [
          ...prevState.elements,
          element
        ]
      };
    });
  }

 /**
   * New/Update ....
   * @param {string} key - ...
   * @param {object|false} props - .... false = DELETE!!!
   * @param {object} [options] - `record: false` keeps the change out of undo history
   */
  handleUpdateClass(key, props, { record = true } = {}) {
    this.noteHistoryChange({ key: `class:${key}`, record });
    this.setState((prevState) => {
      const newClasses = {
        ...prevState.classes,
      };

      // delete
      if (props === false) {
        delete newClasses[key];
      // Add/ update
      } else {
        newClasses[key] = props;
      }

      return {
        classes: newClasses
      };
    });
  }

    /*
   * New/Update ....
   * @param {string} key - ...
   * @param {object|false} props - .... false = DELETE!!!
   * @param {object} [options] - `record: false` keeps the change out of undo history
   */
  handleUpdateKeyframes(key, props, { record = true } = {}) {
    this.noteHistoryChange({ key: `keyframes:${key}`, record });
    this.setState((prevState) => {
      const newKeyframes = {
        ...prevState.keyframes,
      };

      // delete
      if (props === false) {
        delete newKeyframes[key];
      // Add/ update
      } else {
        newKeyframes[key] = props;
      }

      return {
        keyframes: newKeyframes
      };
    });
  }

  handleUpdateElementAtPath(elementPatch, path = []) {
    if (!path.length) return;

    this.noteHistoryChange({ key: `element:${path.join('.')}` });
    this.setState((prevState) => {
      return {
        elements: this.updateElementAtPath(prevState.elements, path, (el) => ({
          ...el,
          ...elementPatch
        }))
      };
    });
  }

  render() {
    const { activeElement, activePath, classes, keyframes, elements } = this.state;

    const navHeight = 32;
    const containerSpacing = 20;
    const elContainerWidth = 350;
    const bottomBoundaryHeight = 200;
    const selectedElement = this.getActiveElement(activePath, elements);
    // Opened with nothing selected, the editor only shows a short note: keep it narrow.
    const elementEditorWidth = selectedElement && this.state.isElementEditorExpanded ? elContainerWidth * 2 : elContainerWidth;
    const commonProps = {
      activePath,
      classes,
      keyframes,
      elements,
      onClassChange: this.handleUpdateClass,
      onKeyframesChange: this.handleUpdateKeyframes,
      onSelectKeyframes: this.handleSelectKeyframes
    };

    const menuItems = this.state.presets.map(preset => ({ label: preset.title }));
    // <link href="assets/font/DancingScript-Medium.ttf" rel="stylesheet"></link>


    // <link rel="preconnect" href="https://fonts.googleapis.com" />
    // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    // <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&display=swap" rel="stylesheet"></link>
    return (
      <div className="app-root">
        <Helmet>
          <style>{ this.getDisplayCSS() }</style>
          <meta charSet="utf-8" />
        </Helmet>
        <AppHeader
          navHeight={ navHeight }
          showLayersPanel={ this.state.showLayersPanel }
          showElementContainer={ this.state.showElementContainer }
          canUndo={ this.state.canUndo }
          canRedo={ this.state.canRedo }
          onUndo={ this.handleUndo }
          onRedo={ this.handleRedo }
          onShowExport={ this.handleShowExport }
          onToggleLayersPanel={ this.handleToggleLayersPanel }
          onToggleElementPanel={ this.handleToggleElementPanel }
          onShowPresets={ this.handleShowPresets }
        />
        <ExportModal
          open={ this.state.showExport }
          onClose={ this.handleHideExport }
          elements={ this.state.elements }
          css={ this.getDisplayCSS() }
        />
        <Preview
          { ...commonProps }
          leftBoundaryWidth={ 0 }
          rightBoundaryWidth={ 0 }
          topBoundaryHeight={ navHeight }
          bottomBoundaryHeight={ bottomBoundaryHeight }
          onSelectElement={ this.handleSelectElement }
        />
        { this.state.showLayersPanel && (
          <div className="app-panel app-panel--left" style={{
            position: 'absolute',
            top: navHeight,
            bottom: 0,
            left: 0,
            padding: 'var(--caf-space-0)',
          }}>
            <Layers
              { ...commonProps }
              activeElement={ activeElement }
              onClick={ this.handleSelectElement }
              onClone={ this.handleCloneElement }
              onToggleHidden={ this.handleToggleHidden }
              onRemove={ this.handleRemoveElement }
              onHide={ this.handleToggleLayersPanel }
              width={ this.state.layersWidth }
            />
            <PanelResizeHandle
              label="Resize Layers panel"
              width={ this.state.layersWidth }
              minWidth={ LAYERS_WIDTH.min }
              maxWidth={ LAYERS_WIDTH.max }
              defaultWidth={ LAYERS_WIDTH.default }
              onResize={ this.handleLayersResize }
              onResizeEnd={ this.handleLayersResizeEnd }
            />
          </div>
        ) }
        { this.state.showElementContainer && (
          <div
            className="app-panel app-panel--right"
            style={{
              position: 'absolute',
              top: navHeight,
              bottom: 0,
              right: 0,
              padding: 'var(--caf-space-0)',
            }}
          >
            <ElementEditor
              { ...commonProps }
              width={ elementEditorWidth }
              style={{
                padding: 'var(--caf-space-4) var(--caf-nav-pad-x)',
              }}
              element={ selectedElement }
              elementProps={ selectedElement }
              defaultExpanded={ true }
              onExpandedChange={ this.handleElementEditorExpandedChange }
              visible={ true }
              onChange={ (props) => { this.handleUpdateElementAtPath(props, activePath) } }
              onSubmit={ this.handleUpdateElements }
            />
          </div>
        ) }
        <AnimationContainer
          { ...commonProps }
          keyframes={ this.state.keyframes[this.state.activeKeyframeId] }
          keyframesId={ this.state.activeKeyframeId }
          element={ this.getActiveElement(activePath, elements) }
        />
        <Drawer
          anchor="right"
          open={ this.state.showPresets }
          onClose={ this.handleHidePresets }
        >
          <Link onClick={ this.handleHidePresets }>Close Presets</Link>
          <Menu
            items={ menuItems }
            onClick={ this.handleSetPreset }
          />

        </Drawer>
      </div>
    );
  }
}
