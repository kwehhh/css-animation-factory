import React from "react";
import { Helmet } from "react-helmet";
import { Menu, Link } from '@nurvus/ui';
import { Drawer } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import _ from "lodash";
import AnimationContainer from './components/AnimationContainer/AnimationContainer.jsx';
import AppHeader from './components/AppHeader/AppHeader.jsx';
import ElementEditor from './components/ElementEditor.jsx';
import ExportModal from './components/ExportModal/ExportModal.jsx';
import Layers from './components/Layers.jsx';
import HistoryPanel from './components/HistoryPanel/HistoryPanel.jsx';
import PanelResizeHandle from './components/PanelResizeHandle/PanelResizeHandle.jsx';
import Preview from './components/Preview.jsx';
import KeyframeIsland from './components/Timeline/KeyframeIsland.jsx';
import IsolationBar from './components/IsolationBar/IsolationBar.jsx';
import TimelinePanel from './components/Timeline/TimelinePanel.jsx';
import TimelineController, { clampSpeed } from './timeline/TimelineController.js';
import { convertCamelToKebabCase } from '../util/StringUtil.js';
import { indentFormatter } from '../util/CSSUtil.js';
import { svgToElements } from '../util/svgToElements.js';
import { cssToModel } from '../util/cssToModel.js';
import { isActivatableTarget, isEditableTarget } from '../util/keyboard.js';
import { getMuiTheme } from './muiTheme.js';
import "./App.scss";

const NAV_HEIGHT = 32;
// Element Editor width (px); twice that while expanded with a layer selected.
const EDITOR_WIDTH = 350;
// Layers panel width (px): default, drag limits, and where the user's choice is remembered.
const LAYERS_WIDTH = { default: 180, min: 180, max: 480 };
const LAYERS_WIDTH_STORAGE_KEY = 'caf.layersWidth';
// Timeline panel height (px). The max also stops at 70% of the window.
const TIMELINE_HEIGHT = { default: 240, min: 140, max: 600 };
// { open, height, loop, speed, animatedOnly }: the Timeline panel as you left it.
const TIMELINE_STORAGE_KEY = 'caf.timeline';
// The keyframe island floats this far above the bottom (or the Timeline panel).
const ISLAND_GAP = 16;
// Narrowest gap between the side panels the island fits in; below it, it
// spans everything right of the Layers panel and floats over the editor.
const ISLAND_MIN_WIDTH = 360;
// Isolation mode: the bar sits this far below the header, and Fit to view
// zooms the layer to this share of the space left between the panels.
const ISOLATION_BAR_GAP = 8;
const ISOLATION_BAR_HEIGHT = 36;
const ISOLATION_FIT_SHARE = 0.85;
const ISOLATION_SCALE = { min: 0.25, max: 8 };
// 'dark' | 'light'. index.html applies the saved value before first paint.
const THEME_STORAGE_KEY = 'caf.theme';
const PALETTE_STORAGE_KEY = 'caf.palette';

// Undo/redo history. Only the animation itself is undoable; selection and
// panel layout are UI state and stay where they are.
const HISTORY_DOC_KEYS = ['elements', 'classes', 'keyframes', 'css'];
const HISTORY_LIMIT = 100;
// Edits to the same field closer together than this become one undo step
// (one slider drag, one typed value) instead of one step per keystroke.
const HISTORY_MERGE_MS = 1000;
const HISTORY_PANEL_WIDTH = 260;
// History label for an Element Editor edit, by the one field it changed.
const ELEMENT_EDIT_LABELS = {
  displayName: 'Rename layer',
  tag: 'Change tag',
  attributes: 'Edit attributes',
  classes: 'Change classes',
  props: 'Edit styles'
};

// Autosave: the animation (HISTORY_DOC_KEYS) is written to localStorage
// shortly after every change and restored on the next visit, so a reload or a
// closed tab does not lose work. Undo history itself is not saved.
const AUTOSAVE_KEY = 'caf.autosave.v1';
const AUTOSAVE_DELAY_MS = 400;

function readAutosave() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(AUTOSAVE_KEY));
    if (saved && saved.version === 1 && saved.doc && Array.isArray(saved.doc.elements)) {
      return saved;
    }
  } catch {
    // Storage blocked or the saved JSON is corrupt: start from the default preset.
  }
  return null;
}

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

function readStoredTimeline() {
  const settings = { open: false, height: TIMELINE_HEIGHT.default, loop: true, speed: 1, animatedOnly: false };
  try {
    const stored = JSON.parse(window.localStorage.getItem(TIMELINE_STORAGE_KEY)) || {};
    if (typeof stored.open === 'boolean') settings.open = stored.open;
    if (stored.height >= TIMELINE_HEIGHT.min && stored.height <= TIMELINE_HEIGHT.max) settings.height = stored.height;
    if (typeof stored.loop === 'boolean') settings.loop = stored.loop;
    if (clampSpeed(stored.speed) === stored.speed) settings.speed = stored.speed;
    if (typeof stored.animatedOnly === 'boolean') settings.animatedOnly = stored.animatedOnly;
  } catch {
    // Storage blocked or corrupt: use the defaults.
  }
  return settings;
}

/** Tallest the Timeline panel may be in this window. */
function timelineMaxHeight() {
  return Math.max(TIMELINE_HEIGHT.min, Math.min(TIMELINE_HEIGHT.max, Math.round(window.innerHeight * 0.7)));
}

export default class App extends React.Component {

  constructor(props) {
    super();

    const { data } = props;
    const timeline = readStoredTimeline();
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
      showHistoryPanel: false,
      showTimeline: timeline.open,
      // Isolation mode: the path of the one layer shown ([] = off), whether
      // it is zoomed to fit, and that zoom ({ scale, originX/Y, x, y } or null).
      isolatedPath: [],
      isolationFit: true,
      isolationTransform: null,
      timelineHeight: timeline.height,
      timelineAnimatedOnly: timeline.animatedOnly,
      // data-theme on <html> drives both the factory's --caf-* tokens and @nurvus/ui.
      theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
      // 'nurvus' (the navy) or 'neutral' (grey, after MotionCraft); index.html applies it before paint.
      palette: document.documentElement.dataset.cafPalette === 'neutral' ? 'neutral' : 'nurvus',
      // Header status of the last autosave: { status: 'saved' | 'restored' | 'failed', time }.
      autosave: null,
      // Render copy of this.history (see syncHistoryView).
      historyView: { steps: [], index: 0, trimmed: false }
    };

    // The undo timeline, oldest first. Each step is
    // { id, label, detail, time, before, after }, where before/after are
    // snapshots of HISTORY_DOC_KEYS. `index` = how many steps are applied
    // (0 = the start, steps.length = newest), so undo/redo/jump are all "show
    // the snapshot at index N". `last` lets the next change merge into the
    // newest step (see recordHistory). `trimmed` = old steps were dropped.
    this.history = { steps: [], index: 0, last: null, nextId: 1, trimmed: false };
    // Filled by noteHistoryChange() just before a handler's setState.
    this.historyHint = null;
    this.isApplyingHistory = false;

    // One clock for every animation in the preview: the keyframe island and
    // the Timeline panel play, pause and scrub through it.
    this.previewRef = React.createRef();
    this.timeline = new TimelineController({
      getRoot: () => this.previewRef.current,
      loop: timeline.loop,
      speed: timeline.speed
    });
    // Which layers animate (for the island and the Layers panel's badges).
    // Only replaced when the animations change, not on every frame.
    this.state.timelineModel = this.timeline.model;

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
        const block = this.getCSSfromStyleObj(classes[className], indentFormatter(1));
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

  // Restore the autosaved animation, or fetch the default JSON preset
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    // pagehide (not unload, which Chrome blocks) fires on reload, tab close and
    // navigation: write a pending autosave before the page goes.
    window.addEventListener('pagehide', this.flushAutosave);
    // The island's position and the Timeline panel's max height follow the window.
    window.addEventListener('resize', this.handleWindowResize);
    this.timeline.start();
    this.stopTimelineSync = this.timeline.onChange(this.handleTimelineChange);

    const { files } = this.props.manifest;
    const saved = readAutosave();
    if (saved) {
      // Where history begins, like a freshly loaded preset.
      this.noteHistoryChange({ record: false });
      this.setState({
        ...saved.doc,
        autosave: { status: 'restored', time: saved.savedAt }
      }, () => {
        // It is already saved: cancel the save this restore just scheduled, so
        // the header keeps saying "Restored…" until the next real change.
        clearTimeout(this.autosaveTimer);
        this.autosaveTimer = null;
      });
    } else {
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
    }
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
    // Every change is autosaved, undo/redo and preset loads included.
    if (docChanged) this.scheduleAutosave();
    // An edit can change an animation's timing: the timelines re-read it now.
    if (docChanged) this.timeline.invalidate();
    if (['showTimeline', 'timelineAnimatedOnly'].some((key) => prevState[key] !== this.state[key])) {
      this.saveTimelineSettings();
    }
    // The isolated layer was deleted (or undone away): leave isolation.
    if (this.state.isolatedPath.length && !this.isValidPath(this.state.elements, this.state.isolatedPath)) {
      this.setState({ isolatedPath: [], isolationTransform: null });
    } else {
      this.updateIsolationFit();
    }
    if (!docChanged || isApplyingHistory || (hint && hint.record === false)) return;

    this.recordHistory(prevState, hint || {});
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('pagehide', this.flushAutosave);
    window.removeEventListener('resize', this.handleWindowResize);
    window.cancelAnimationFrame(this.resizeFrame);
    this.flushAutosave();
    this.timeline.stop();
    if (this.stopTimelineSync) this.stopTimelineSync();
  }

  handleWindowResize = () => {
    window.cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = window.requestAnimationFrame(() => this.forceUpdate());
  }

  // --- Isolation mode ------------------------------------------------------
  // Like Illustrator's: one layer (and what is inside it) is all you see in
  // the preview, optionally zoomed to fit. Esc, Exit, "All layers" or
  // selecting a layer outside it leaves.

  isInsideIsolation(path = []) {
    const { isolatedPath } = this.state;
    return isolatedPath.every((index, i) => path[i] === index);
  }

  handleIsolate = (path) => {
    if (!path || !path.length) return;
    // Also select it: a double-click on a layer row first toggles it off.
    this.setState({ isolatedPath: path, activePath: path, showElementContainer: true });
  }

  handleExitIsolation = () => {
    if (this.state.isolatedPath.length) this.setState({ isolatedPath: [], isolationTransform: null });
  }

  handleToggleIsolationFit = () => {
    this.setState((prevState) => ({ isolationFit: !prevState.isolationFit }));
  }

  /**
   * Fit to view: zoom the preview so the isolated layer fills the space left
   * between the panels (and above the island), centered. Recomputed only when
   * that space or the layer changes, not on every render (the layer may be
   * moving: it's animated).
   */
  updateIsolationFit() {
    const { isolatedPath, isolationFit } = this.state;
    const preview = this.previewRef.current;
    const layer = preview && isolatedPath.length && isolationFit && preview.querySelector('[data-caf-isolated]');
    const island = document.querySelector('.caf-island');
    const pos = this.getIslandPosition(this.getElementEditorWidth(), this.getDockBottom());
    const key = layer ? JSON.stringify([isolatedPath, pos, window.innerWidth, window.innerHeight, island ? island.offsetHeight : 0]) : '';
    if (key === this.isolationFitKey) return;
    this.isolationFitKey = key;
    if (!layer) {
      if (this.state.isolationTransform) this.setState({ isolationTransform: null });
      return;
    }

    // Where the layer is without any zoom: undo the preview's current scale
    // (read from the live transform, so this is right mid-transition too).
    const matrix = window.getComputedStyle(preview).transform;
    const scale = matrix && matrix !== 'none' ? Number(matrix.match(/matrix\(([^,]+)/)[1]) || 1 : 1;
    const p = preview.getBoundingClientRect();
    const e = layer.getBoundingClientRect();
    const w = e.width / scale;
    const h = e.height / scale;
    const x = preview.offsetLeft + (e.left - p.left) / scale;
    const y = preview.offsetTop + (e.top - p.top) / scale;

    const top = NAV_HEIGHT + ISOLATION_BAR_GAP * 2 + ISOLATION_BAR_HEIGHT;
    const bottom = window.innerHeight - this.getDockBottom() - (island ? island.offsetHeight + ISLAND_GAP * 2 : 0);
    const left = pos.left;
    const right = window.innerWidth - pos.right;
    if (!w || !h || right - left < 80 || bottom - top < 80) {
      if (this.state.isolationTransform) this.setState({ isolationTransform: null });
      return;
    }
    const fit = Math.min(((right - left) * ISOLATION_FIT_SHARE) / w, ((bottom - top) * ISOLATION_FIT_SHARE) / h);
    this.setState({
      isolationTransform: {
        scale: Math.min(ISOLATION_SCALE.max, Math.max(ISOLATION_SCALE.min, fit)),
        originX: x - preview.offsetLeft + w / 2,
        originY: y - preview.offsetTop + h / 2,
        x: (left + right) / 2 - (x + w / 2),
        y: (top + bottom) / 2 - (y + h / 2)
      }
    });
  }

  getElementEditorWidth() {
    // Opened with nothing selected, the editor only shows a short note: keep it narrow.
    const selected = this.getActiveElement(this.state.activePath, this.state.elements);
    return selected && this.state.isElementEditorExpanded ? EDITOR_WIDTH * 2 : EDITOR_WIDTH;
  }

  /** Height the Timeline panel takes at the bottom (0 when closed). */
  getDockBottom() {
    return this.state.showTimeline ? Math.min(this.state.timelineHeight, timelineMaxHeight()) : 0;
  }

  handleTimelineChange = () => {
    // Loop and speed are changed inside the panels: remember them.
    this.saveTimelineSettings();
    if (this.timeline.model !== this.state.timelineModel) {
      this.setState({ timelineModel: this.timeline.model });
    }
  }

  saveTimelineSettings = () => {
    try {
      window.localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify({
        open: this.state.showTimeline,
        height: this.state.timelineHeight,
        loop: this.timeline.loop,
        speed: this.timeline.speed,
        animatedOnly: this.state.timelineAnimatedOnly
      }));
    } catch {
      // Storage blocked: the settings still apply for this visit.
    }
  }

  handleToggleTimeline = () => {
    this.setState((prevState) => ({ showTimeline: !prevState.showTimeline }));
  }

  handleTimelineResize = (timelineHeight) => {
    this.setState({ timelineHeight });
  }

  handleTimelineResizeEnd = (timelineHeight) => {
    this.setState({ timelineHeight }, this.saveTimelineSettings);
  }

  handleTimelineAnimatedOnly = (timelineAnimatedOnly) => {
    this.setState({ timelineAnimatedOnly });
  }

  /** The preview's style: ends above the Timeline panel; zoomed in isolation (Fit to view). */
  getPreviewStyle(dockBottom) {
    const style = {};
    if (this.state.showTimeline) Object.assign(style, { height: 'auto', bottom: dockBottom });
    const zoom = this.state.isolationTransform;
    if (zoom) {
      Object.assign(style, {
        transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
        transformOrigin: `${zoom.originX}px ${zoom.originY}px`
      });
    }
    return Object.keys(style).length ? style : undefined;
  }

  /** Where the keyframe island floats: centered in the preview area between the open panels. */
  getIslandPosition(elementEditorWidth, dockBottom) {
    const left = this.state.showLayersPanel ? this.state.layersWidth : 0;
    const history = this.state.showHistoryPanel ? HISTORY_PANEL_WIDTH : 0;
    const editor = this.state.showElementContainer ? elementEditorWidth : 0;
    const roomy = window.innerWidth - left - editor - history >= ISLAND_MIN_WIDTH;
    return { left, right: history + (roomy ? editor : 0), bottom: dockBottom + ISLAND_GAP };
  }

  /** Select a layer (never deselect, unlike a click on the selected layer). */
  handleRevealElement = (path) => {
    this.setState({
      activePath: path,
      showElementContainer: true,
      ...(!this.isInsideIsolation(path) ? { isolatedPath: [], isolationTransform: null } : {})
    });
  }

  scheduleAutosave() {
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(this.writeAutosave, AUTOSAVE_DELAY_MS);
  }

  flushAutosave = () => {
    if (this.autosaveTimer) this.writeAutosave();
  }

  writeAutosave = () => {
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    const savedAt = Date.now();
    let status = 'saved';
    try {
      window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        version: 1,
        savedAt,
        // While the Add New Element dialog is open its draft class lives in
        // the document; save the document as it was before the dialog instead.
        doc: this.addElementBefore || this.getDocSnapshot(this.state)
      }));
    } catch {
      // Storage blocked or full: keep working, and say so in the header.
      status = 'failed';
    }
    this.setState({ autosave: { status, time: savedAt } });
  }

  /**
   * Every handler that changes the animation calls this just before its
   * setState. `label` + `detail` name the step in the History panel; `key`
   * lets repeated edits of the same field merge into one step; `record: false`
   * marks a change that is not a user edit. React can batch several handlers
   * into one update: it is recorded if ANY of them is a real edit (and named
   * after it), so a non-edit can never swallow one. A change with no note at
   * all is recorded too, as "Edit".
   */
  noteHistoryChange({ key = null, record = true, label = 'Edit', detail = '', before = null } = {}) {
    const prev = this.historyHint;
    const keepPrev = !record && prev && prev.record;
    this.historyHint = keepPrev ? prev : { key, record: record || !!(prev && prev.record), label, detail, before };
  }

  // --- Add New Element dialog -------------------------------------------
  // While it is open the draft's class + keyframes live in the document (so
  // its preview works) without being recorded. Cancel restores the document
  // as it was when the dialog opened; Save records ONE "Add layer" step whose
  // "before" is that same snapshot, so undoing it removes the element AND its
  // class and keyframes.

  handleBeginAddElement = () => {
    this.addElementBefore = this.getDocSnapshot(this.state);
  }

  handleCancelAddElement = () => {
    const before = this.addElementBefore;
    this.addElementBefore = null;
    if (!before) return;
    this.noteHistoryChange({ record: false });
    this.setState({ classes: before.classes, keyframes: before.keyframes });
  }

  handleAddElement = (element) => {
    const before = this.addElementBefore;
    this.addElementBefore = null;
    this.noteHistoryChange({ label: 'Add layer', detail: element.displayName, before });
    // Select the new layer and open the Element Editor on it.
    this.setState((prevState) => ({
      elements: [...prevState.elements, element],
      activePath: [prevState.elements.length],
      showElementContainer: true
    }));
  }

  /** Layer name for history details ("" when the path no longer exists). */
  getElementName(path) {
    const element = this.getActiveElement(path, this.state.elements);
    return element ? (element.displayName || element.tag || 'layer') : '';
  }

  getDocSnapshot(state) {
    return _.pick(state, HISTORY_DOC_KEYS);
  }

  /**
   * Record a change as a new step, or fold it into the newest step when it is
   * the same action continuing: same synchronous run (e.g. the source editor
   * applying several classes at once), or the same field edited again within
   * HISTORY_MERGE_MS. A new step after an undo drops the undone steps.
   * State is never mutated in place, so snapshots share everything that did
   * not change.
   */
  recordHistory(prevState, { key = null, label = 'Edit', detail = '', before = null }) {
    const now = Date.now();
    const history = this.history;
    const { last } = history;
    const current = history.steps[history.index - 1];
    // A step with its own `before` (Add layer) is always a step of its own.
    const merge = !before && !!last && !!current && last.id === current.id
      && (last.sameRun || (!!key && last.key === key && now - last.time < HISTORY_MERGE_MS));

    if (merge) {
      // Same action continuing: only the result moves. The row's label and
      // time stay, so the History panel does not need to re-render.
      current.after = this.getDocSnapshot(this.state);
    } else {
      history.steps = history.steps.slice(0, history.index);
      history.steps.push({
        id: history.nextId++,
        label,
        detail,
        time: now,
        before: before || this.getDocSnapshot(prevState),
        after: this.getDocSnapshot(this.state)
      });
      if (history.steps.length > HISTORY_LIMIT) {
        history.steps.shift();
        history.trimmed = true;
      }
      history.index = history.steps.length;
    }

    const entry = { id: history.steps[history.index - 1].id, key, time: now, sameRun: true };
    history.last = entry;
    setTimeout(() => { entry.sameRun = false; }, 0);

    if (!merge) this.syncHistoryView();
  }

  getHistoryView() {
    const { steps, index, trimmed } = this.history;
    return { steps: steps.slice(), index, trimmed };
  }

  syncHistoryView() {
    this.setState({ historyView: this.getHistoryView() });
  }

  isValidPath(elements = [], path = []) {
    let list = elements;
    return path.every((index) => {
      const element = list && list[index];
      list = element && element.elements;
      return !!element;
    });
  }

  /**
   * Show the animation as it was after `index` steps (0 = before the oldest
   * kept step). Undo, redo and clicking a History row all come through here.
   */
  handleJumpToHistory = (index) => {
    const history = this.history;
    if (!history.steps.length || index < 0 || index > history.steps.length || index === history.index) return;

    const snapshot = index === 0 ? history.steps[0].before : history.steps[index - 1].after;
    history.index = index;
    // The next edit always starts a new step, even if it hits the same field.
    history.last = null;
    this.isApplyingHistory = true;
    this.setState((prevState) => ({
      ...snapshot,
      // Keep the selection when it still points at an element, else clear it.
      activePath: this.isValidPath(snapshot.elements, prevState.activePath) ? prevState.activePath : [],
      historyView: this.getHistoryView()
    }));
  }

  handleUndo = () => {
    this.handleJumpToHistory(this.history.index - 1);
  }

  handleRedo = () => {
    this.handleJumpToHistory(this.history.index + 1);
  }

  handleToggleTheme = () => {
    const theme = this.state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage blocked: the theme still applies for this visit.
    }
    this.setState({ theme });
  }

  handleTogglePalette = () => {
    const palette = this.state.palette === 'neutral' ? 'nurvus' : 'neutral';
    if (palette === 'neutral') document.documentElement.dataset.cafPalette = palette;
    else delete document.documentElement.dataset.cafPalette;
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch {
      // Storage blocked: the palette still applies for this visit.
    }
    this.setState({ palette });
  }

  handleToggleHistoryPanel = () => {
    this.setState((prevState) => ({ showHistoryPanel: !prevState.showHistoryPanel }));
  }

  /**
   * App-wide shortcuts: Space plays/pauses the preview, plus Cmd/Ctrl ones.
   * Text fields and the code editors keep their own (so Cmd+Z there undoes
   * typing, not the animation), and Space still presses a focused button.
   */
  handleKeyDown = (e) => {
    const plain = !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
    if (e.key === ' ' && plain) {
      if (e.defaultPrevented || isActivatableTarget(e.target) || this.addElementBefore) return;
      e.preventDefault();
      this.timeline.toggle();
      return;
    }
    // Esc leaves isolation mode, unless something on top of it (a dialog,
    // a menu, the Add New Element dialog) takes this Escape.
    if (e.key === 'Escape' && this.state.isolatedPath.length) {
      if (e.defaultPrevented || isEditableTarget(e.target) || this.addElementBefore) return;
      if (document.querySelector('.MuiDialog-root, .MuiPopover-root, .MuiDrawer-modal')) return;
      e.preventDefault();
      this.handleExitIsolation();
      return;
    }
    // J / K / L: play backwards / pause / play forwards, as in video editors.
    const transport = { j: () => this.timeline.play(-1), k: () => this.timeline.pause(), l: () => this.timeline.play(1) }[e.key.toLowerCase()];
    if (transport && plain) {
      if (e.defaultPrevented || isEditableTarget(e.target) || this.addElementBefore) return;
      e.preventDefault();
      transport();
      return;
    }
    if (e.defaultPrevented || !(e.metaKey || e.ctrlKey) || e.altKey) return;
    if (isEditableTarget(e.target)) return;

    const key = e.key.toLowerCase();
    // Undo/redo would swap the document under the open Add New Element dialog
    // (dropping its draft class), so they wait until it closes.
    if ((key === 'z' || key === 'y') && this.addElementBefore) return;
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
      if (i > 0) {
        css += '\n';
      }
      // Frames one level in, their declarations two: nested like the JSON tab.
      css += `  ${keyframe} {\n${this.getCSSfromStyleObj(keyframes[keyframe], indentFormatter(2))}  }\n`;

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
    this.noteHistoryChange({ label: 'Delete layer', detail: this.getElementName(path) });
    this.setState((prevState) => {
      // Isolation follows the delete like the selection does: gone with the
      // isolated layer (or a parent), shifted when an earlier sibling goes.
      const isolatedPath = this.adjustActivePathAfterRemoval(prevState.isolatedPath, path);
      return {
        elements: this.removeElementAtPath(prevState.elements, path),
        activePath: this.adjustActivePathAfterRemoval(prevState.activePath, path),
        isolatedPath,
        ...(isolatedPath.length ? {} : { isolationTransform: null })
      };
    });
  }

  handleCloneElement() {
    this.noteHistoryChange({ label: 'Clone layer', detail: this.getElementName(this.state.activePath) });
    this.setState((prevState) => {
      return {
        elements: this.cloneInsertion(prevState.elements, prevState.activePath)
      };
    });
  }

  handleToggleHidden = (e, path) => {
    if (e?.stopPropagation) e.stopPropagation();

    const element = this.getActiveElement(path, this.state.elements);
    this.noteHistoryChange({
      label: element && element.hidden ? 'Show layer' : 'Hide layer',
      detail: this.getElementName(path)
    });
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
    // Selecting a layer outside the isolated one leaves isolation.
    this.setState({
      activePath,
      showElementContainer: activePath.length > 0,
      ...(activePath.length && !this.isInsideIsolation(activePath) ? { isolatedPath: [], isolationTransform: null } : {})
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
    this.noteHistoryChange({ label: 'Load preset', detail: preset ? preset.title : 'Empty' });
    this.setState({
      showPresets: false,
      // Reset all preset-driven fields first so nothing leaks between presets
      // (especially SVG css when switching to/from a div-based preset).
      elements: [],
      classes: {},
      keyframes: {},
      css: '',
      activePath: [],
      isolatedPath: [],
      isolationTransform: null,
      ...(preset || {})
    });
  }

  handleUpdateElements(element) {
    this.handleHideContainer();

    this.noteHistoryChange({ label: 'Add layer', detail: element && element.displayName });
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
    this.noteHistoryChange({
      key: `class:${key}`,
      record,
      label: props === false ? 'Delete class' : (this.state.classes[key] ? 'Edit class' : 'Add class'),
      detail: `.${key}`
    });
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
    this.noteHistoryChange({
      key: `keyframes:${key}`,
      record,
      label: props === false ? 'Delete keyframes' : (this.state.keyframes[key] ? 'Edit keyframes' : 'Add keyframes'),
      detail: `@keyframes ${key}`
    });
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

    const fields = Object.keys(elementPatch);
    this.noteHistoryChange({
      key: `element:${path.join('.')}`,
      // One field (the form) gets a specific name; a whole element (JSON source) is an edit.
      label: (fields.length === 1 && ELEMENT_EDIT_LABELS[fields[0]]) || 'Edit layer',
      detail: this.getElementName(path)
    });
    this.setState((prevState) => {
      return {
        elements: this.updateElementAtPath(prevState.elements, path, (el) => ({
          ...el,
          ...elementPatch
        }))
      };
    });
  }

  renderApp() {
    const { activeElement, activePath, classes, keyframes, elements, historyView } = this.state;

    const navHeight = NAV_HEIGHT;
    const containerSpacing = 20;
    const bottomBoundaryHeight = 200;
    const selectedElement = this.getActiveElement(activePath, elements);
    const elementEditorWidth = this.getElementEditorWidth();
    // The Timeline panel docks along the bottom; the side panels and the
    // preview end above it.
    const timelineMax = timelineMaxHeight();
    const timelineHeight = Math.min(this.state.timelineHeight, timelineMax);
    const dockBottom = this.getDockBottom();
    const activeKeyframes = this.state.keyframes[this.state.activeKeyframeId];
    // Only for a selected layer that animates. The keyframe-snapshot strip
    // (shown while a keyframe field has focus) takes its spot, so it steps
    // aside meanwhile.
    const showIsland = !!selectedElement && !activeKeyframes
      && this.state.timelineModel.byPath.has(activePath.join('-'));
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
          showHistoryPanel={ this.state.showHistoryPanel }
          autosave={ this.state.autosave }
          canUndo={ historyView.index > 0 }
          canRedo={ historyView.index < historyView.steps.length }
          onUndo={ this.handleUndo }
          onRedo={ this.handleRedo }
          onShowExport={ this.handleShowExport }
          onToggleLayersPanel={ this.handleToggleLayersPanel }
          onToggleElementPanel={ this.handleToggleElementPanel }
          onToggleHistoryPanel={ this.handleToggleHistoryPanel }
          showTimeline={ this.state.showTimeline }
          onToggleTimeline={ this.handleToggleTimeline }
          theme={ this.state.theme }
          onToggleTheme={ this.handleToggleTheme }
          palette={ this.state.palette }
          onTogglePalette={ this.handleTogglePalette }
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
          rootRef={ this.previewRef }
          isolatedPath={ this.state.isolatedPath }
          fitting={ !!this.state.isolationTransform }
          style={ this.getPreviewStyle(dockBottom) }
        />
        { this.state.showLayersPanel && (
          <div className="app-panel app-panel--left" style={{
            position: 'absolute',
            top: navHeight,
            bottom: dockBottom,
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
              onBeginAddElement={ this.handleBeginAddElement }
              onCancelAddElement={ this.handleCancelAddElement }
              onAddElement={ this.handleAddElement }
              timelineModel={ this.state.timelineModel }
              isolatedPath={ this.state.isolatedPath }
              onIsolate={ this.handleIsolate }
              onExitIsolation={ this.handleExitIsolation }
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
              bottom: dockBottom,
              // Docks left of the History panel when that is open, Photoshop-style.
              right: this.state.showHistoryPanel ? HISTORY_PANEL_WIDTH : 0,
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
              // Only this editor shows the preset CSS that styles the selected
              // layer in the preview (not the Add New Element dialog's).
              livePath={ activePath }
              presetCss={ this.state.css }
              defaultExpanded={ true }
              onExpandedChange={ this.handleElementEditorExpandedChange }
              visible={ true }
              onChange={ (props) => { this.handleUpdateElementAtPath(props, activePath) } }
              onSubmit={ this.handleUpdateElements }
            />
          </div>
        ) }
        { this.state.showHistoryPanel && (
          <div
            className="app-panel app-panel--history"
            style={{
              position: 'absolute',
              top: navHeight,
              bottom: dockBottom,
              right: 0,
            }}
          >
            <HistoryPanel
              steps={ historyView.steps }
              index={ historyView.index }
              trimmed={ historyView.trimmed }
              width={ HISTORY_PANEL_WIDTH }
              onJump={ this.handleJumpToHistory }
              onUndo={ this.handleUndo }
              onRedo={ this.handleRedo }
              onClose={ this.handleToggleHistoryPanel }
            />
          </div>
        ) }
        { showIsland && (
          <KeyframeIsland
            controller={ this.timeline }
            path={ activePath }
            layer={ selectedElement }
            timelineOpen={ this.state.showTimeline }
            onOpenTimeline={ this.handleToggleTimeline }
            isolated={ this.state.isolatedPath.join('-') === activePath.join('-') }
            onIsolate={ this.handleIsolate }
            onExitIsolation={ this.handleExitIsolation }
            style={ this.getIslandPosition(elementEditorWidth, dockBottom) }
          />
        ) }
        { this.state.isolatedPath.length > 0 && (
          <IsolationBar
            path={ this.state.isolatedPath }
            elements={ elements }
            fit={ this.state.isolationFit }
            onIsolate={ this.handleIsolate }
            onToggleFit={ this.handleToggleIsolationFit }
            onExit={ this.handleExitIsolation }
            style={{
              ...this.getIslandPosition(elementEditorWidth, dockBottom),
              top: navHeight + ISOLATION_BAR_GAP,
              bottom: 'auto'
            }}
          />
        ) }
        { this.state.showTimeline && (
          <div
            className="app-panel app-panel--timeline"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: timelineHeight,
            }}
          >
            <TimelinePanel
              controller={ this.timeline }
              elements={ elements }
              activePath={ activePath }
              height={ timelineHeight }
              minHeight={ TIMELINE_HEIGHT.min }
              maxHeight={ timelineMax }
              defaultHeight={ TIMELINE_HEIGHT.default }
              animatedOnly={ this.state.timelineAnimatedOnly }
              isolatedPath={ this.state.isolatedPath }
              onAnimatedOnlyChange={ this.handleTimelineAnimatedOnly }
              onResize={ this.handleTimelineResize }
              onResizeEnd={ this.handleTimelineResizeEnd }
              onSelect={ this.handleSelectElement }
              onReveal={ this.handleRevealElement }
              onClose={ this.handleToggleTimeline }
            />
          </div>
        ) }
        <AnimationContainer
          { ...commonProps }
          bottom={ dockBottom }
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

  render() {
    // MUI components (fields, buttons, sliders, dialogs) follow the theme too.
    return (
      <ThemeProvider theme={ getMuiTheme(this.state.theme, this.state.palette) }>
        { this.renderApp() }
      </ThemeProvider>
    );
  }
}
