import React from "react";
import _ from 'lodash';
import {
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Select,
  Slider,
  MenuItem,
  TextField,
  Tooltip,
  Tabs,
  Tab,
  IconButton,
} from '@material-ui/core';
import TransferList from './TransferList.jsx';
import EditFields from './Editor/EditFields.jsx';
import KeyframesEditor from './Editor/KeyframesEditor.jsx';
import {Controlled as CodeMirror} from 'react-codemirror2';
import { getCSSfromStyleObj, indentFormatter } from '../../util/CSSUtil.js';
import UnfoldMoreIcon from '@material-ui/icons/UnfoldMore';
import UnfoldLessIcon from '@material-ui/icons/UnfoldLess';
import { fieldId } from '../../util/StringUtil.js';
require('codemirror/mode/css/css');
require('codemirror/mode/javascript/javascript');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

  // global util
  const isEven = (value) => {
    if (value%2 == 0)
      return true;
    else
      return false;
  };

  function camelize(str){
    let arr = str.split('-');
    let capital = arr.map((item, index) => index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item.toLowerCase());
    // ^-- change here.
    let capitalString = capital.join("");

    // console.log(capitalString);
    return capitalString;
  }

export default class ElementEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      editor: {},
      position: 'none',
      showModal: false,
      activeTab: 'edit',
      sourceMode: 'css',
      sourceText: {
        json: '',
        css: ''
      },
      sourceError: {
        json: null,
        css: null
      },
      expanded: !!props.defaultExpanded
    };

    this.handleToggleCodeView = this.handleToggleCodeView.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleSourceModeChange = this.handleSourceModeChange.bind(this);
    this.handleToggleExpanded = this.handleToggleExpanded.bind(this);
    this.handleSourceBeforeChange = this.handleSourceBeforeChange.bind(this);

    this._sourceApplyTimer = null;
    this.sourcePaneRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    // The JSON / Compiled CSS panes follow the document: a new selection, an
    // edit in the form next to them, undo, a preset. Not while you are typing
    // in a pane (or your edit is about to apply): regenerating would reformat
    // the code under your cursor. It catches up on the next change after.
    const selectionChanged = !_.isEqual(prevProps.activePath, this.props.activePath);
    const docChanged = ['elementProps', 'classes', 'keyframes', 'presetCss'].some((key) => prevProps[key] !== this.props[key]);
    if (selectionChanged || (docChanged && !this.isEditingSource())) {
      this.syncSourceText();
    }
  }

  componentWillUnmount() {
    clearTimeout(this._sourceApplyTimer);
  }

  isEditingSource() {
    // Focus in the code editor itself; not the JSON / Compiled CSS tabs above it.
    const editor = this.sourcePaneRef.current && this.sourcePaneRef.current.querySelector('.CodeMirror');
    return !!this._sourceApplyTimer || !!(editor && editor.contains(document.activeElement));
  }

  /** Both panes from the document (a no-op when they already match it). */
  syncSourceText() {
    const json = this.getGeneratedSourceValue('json', this.props.elementProps);
    const css = this.getGeneratedSourceValue('css', this.props.elementProps);
    const { sourceText = {}, sourceError = {} } = this.state;
    if (json === sourceText.json && css === sourceText.css && !sourceError.json && !sourceError.css) return;
    this.setState({ sourceText: { json, css }, sourceError: { json: null, css: null } });
  }

  handleTabChange(e, value) {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState({ activeTab: value });
  }

  handleSourceModeChange(e, value) {
    if (e?.stopPropagation) e.stopPropagation();
    if (value) {
      this.setState((prevState) => ({
        sourceMode: value,
        sourceText: {
          ...prevState.sourceText,
          [value]: prevState.sourceText?.[value] || this.getGeneratedSourceValue(value, this.props.elementProps)
        }
      }));
    }
  }

  handleToggleExpanded(e) {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => {
      const next = !prevState.expanded;
      if (this.props.onExpandedChange) {
        this.props.onExpandedChange(next);
      }
      return { expanded: next };
    });
  }

  /**
   * The @keyframes an element's classes use: each once, and only ones that
   * exist. animation-name can be a list ("orbit, pulse") and can name
   * keyframes that don't exist (yet: a name half-typed in the field).
   */
  getKeyframeNames(classNames = []) {
    const names = [];
    classNames.forEach((className) => {
      const animationName = this.props.classes?.[className]?.animationName;
      if (!animationName) return;
      String(animationName).split(',').forEach((name) => {
        const trimmed = name.trim();
        if (this.props.keyframes?.[trimmed] && !names.includes(trimmed)) names.push(trimmed);
      });
    });
    return names;
  }

  getSourcePayload(elementProps) {
    const resolvedClasses = this.getElementClassProps(this.props.classes, elementProps?.classes);

    const keyframes = {};
    this.getKeyframeNames(elementProps?.classes).forEach((name) => {
      keyframes[name] = this.props.keyframes[name];
    });

    return {
      element: elementProps,
      resolvedClasses,
      keyframes
    };
  }

  /** The selected layer's node in the main preview (only the main editor gets `livePath`). */
  getLiveElement() {
    const { livePath } = this.props;
    if (!livePath || !livePath.length) return null;
    return document.querySelector(`.app-root > .preview [data-caf-path="${livePath.join('-')}"]`);
  }

  /**
   * The preset's own CSS rules (id rules, `#monkey .arm`, …) that match `el`,
   * found by the browser's selector matching. A rule for el::before/::after
   * counts too.
   */
  getPresetRules(el) {
    const css = this.props.presetCss;
    if (!css || !el || typeof CSSStyleSheet === 'undefined') return [];
    if (!this._presetSheet || this._presetSheet.css !== css) {
      let sheet = null;
      try {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
      } catch {
        sheet = null;
      }
      this._presetSheet = { css, sheet };
    }
    const { sheet } = this._presetSheet;
    if (!sheet) return [];
    const matches = (selector) => selector.split(',').some((part) => {
      try {
        return el.matches(part.replace(/::?(before|after)\b.*$/, '').trim() || '*');
      } catch {
        return false;
      }
    });
    const found = [];
    const visit = (rules) => Array.from(rules).forEach((rule) => {
      if (rule.selectorText) {
        if (matches(rule.selectorText)) found.push(rule);
      } else if (rule.cssRules && !rule.name) {
        visit(rule.cssRules); // @media / @supports, not @keyframes (those have a name)
      }
    });
    visit(sheet.cssRules);
    return found;
  }

  getCompiledCss(elementProps) {
    const resolvedClasses = this.getElementClassProps(this.props.classes, elementProps?.classes);

    const blocks = [];
    if (resolvedClasses) {
      Object.keys(resolvedClasses).forEach((className) => {
        blocks.push(`.${className} {\n${getCSSfromStyleObj(resolvedClasses[className], indentFormatter(1))}}`);
      });
    }

    // A layer can also be styled by the preset's own CSS (an svg preset's id
    // rules): show those too, so the pane is never blank for a layer that
    // visibly animates. As a comment: this pane only edits classes and
    // @keyframes, and the parser must not read `#monkey .arm` as a class.
    const live = this.getLiveElement();
    const presetRules = this.getPresetRules(live);
    if (presetRules.length) {
      const rules = presetRules.map((rule) => {
        const decls = rule.style.cssText.split(/;\s*/).map((d) => d.trim()).filter(Boolean);
        return `${rule.selectorText} {\n${decls.map((d) => `  ${d};`).join('\n')}\n}`;
      });
      blocks.push(`/* Also styling this layer: the preset's own CSS (read-only here)\n\n${rules.join('\n\n').replace(/\*\//g, '* /')}\n*/`);
    }

    // The @keyframes it runs: named by its classes, or by those preset rules.
    const keyframeNames = this.getKeyframeNames(elementProps?.classes);
    if (live) {
      window.getComputedStyle(live).animationName.split(',').map((name) => name.trim()).forEach((name) => {
        if (this.props.keyframes?.[name] && !keyframeNames.includes(name)) keyframeNames.push(name);
      });
    }

    keyframeNames.forEach((name) => {
      const kf = this.props.keyframes[name];

      let framesCss = '';
      Object.keys(kf).forEach((pct, i) => {
        const propsCss = getCSSfromStyleObj(kf[pct], indentFormatter(2));
        framesCss += `  ${pct} {\n${propsCss}  }\n`;
        if (i < Object.keys(kf).length - 1) framesCss += '\n';
      });

      blocks.push(`@keyframes ${name} {\n${framesCss}}`);
    });

    return `${blocks.join('\n\n')}\n`;
  }

  getGeneratedSourceValue(mode, elementProps) {
    return mode === 'css'
      ? this.getCompiledCss(elementProps)
      : JSON.stringify(this.getSourcePayload(elementProps), null, 2);
  }

  handleSourceBeforeChange(editor, data, value) {
    const mode = this.state.sourceMode;
    this.setState((prevState) => ({
      sourceText: { ...prevState.sourceText, [mode]: value },
      sourceError: { ...prevState.sourceError, [mode]: null }
    }));

    // Live-update: debounce applying until the user pauses typing briefly.
    if (this._sourceApplyTimer) clearTimeout(this._sourceApplyTimer);
    this._sourceApplyTimer = setTimeout(() => {
      this._sourceApplyTimer = null;
      this.applySourceText(mode, value);
    }, 200);
  }

  stripCssComments(cssText = '') {
    return cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  findMatchingBrace(src, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  parseDeclarations(block = '') {
    const out = {};
    const body = this.stripCssComments(block);
    const re = /([-\w]+)\s*:\s*([^;]+)\s*;?/g;
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = re.exec(body))) {
      const rawKey = (match[1] || '').trim();
      const rawValue = (match[2] || '').trim();
      if (!rawKey) continue;
      out[camelize(rawKey)] = rawValue;
    }
    return out;
  }

  parseKeyframesBlock(block = '') {
    const keyframes = {};
    const src = this.stripCssComments(block);
    let i = 0;
    while (i < src.length) {
      while (i < src.length && /\s/.test(src[i])) i += 1;
      if (i >= src.length) break;

      // Read selector (e.g. "0%" / "from" / "to") up to "{"
      const selectorStart = i;
      while (i < src.length && src[i] !== '{') i += 1;
      if (i >= src.length) break;

      const selector = src.slice(selectorStart, i).trim();
      const openIdx = i;
      const closeIdx = this.findMatchingBrace(src, openIdx);
      if (closeIdx === -1) break;

      const body = src.slice(openIdx + 1, closeIdx);
      if (selector) {
        keyframes[selector] = this.parseDeclarations(body);
      }

      i = closeIdx + 1;
    }
    return keyframes;
  }

  parseCompiledCss(cssText = '') {
    const classes = {};
    const keyframes = {};
    const src = this.stripCssComments(cssText);

    let i = 0;
    while (i < src.length) {
      while (i < src.length && /\s/.test(src[i])) i += 1;
      if (i >= src.length) break;

      // .className { ... }
      if (src[i] === '.') {
        i += 1;
        const nameStart = i;
        while (i < src.length && /[-_a-zA-Z0-9]/.test(src[i])) i += 1;
        const className = src.slice(nameStart, i).trim();

        while (i < src.length && src[i] !== '{') i += 1;
        if (i >= src.length) break;
        const openIdx = i;
        const closeIdx = this.findMatchingBrace(src, openIdx);
        if (closeIdx === -1) break;
        const body = src.slice(openIdx + 1, closeIdx);
        if (className) {
          classes[className] = this.parseDeclarations(body);
        }
        i = closeIdx + 1;
        continue;
      }

      // @keyframes name { ... }
      if (src.startsWith('@keyframes', i)) {
        i += '@keyframes'.length;
        while (i < src.length && /\s/.test(src[i])) i += 1;
        const nameStart = i;
        while (i < src.length && /[-_a-zA-Z0-9]/.test(src[i])) i += 1;
        const kfName = src.slice(nameStart, i).trim();

        while (i < src.length && src[i] !== '{') i += 1;
        if (i >= src.length) break;
        const openIdx = i;
        const closeIdx = this.findMatchingBrace(src, openIdx);
        if (closeIdx === -1) break;

        const body = src.slice(openIdx + 1, closeIdx);
        if (kfName) {
          keyframes[kfName] = this.parseKeyframesBlock(body);
        }
        i = closeIdx + 1;
        continue;
      }

      i += 1;
    }

    return { classes, keyframes };
  }

  applySourceText(mode, text) {
    try {
      if (mode === 'json') {
        const parsed = JSON.parse(text || '');
        const payload = (parsed && parsed.element) ? parsed : { element: parsed };

        if (payload.resolvedClasses && _.isObject(payload.resolvedClasses)) {
          Object.keys(payload.resolvedClasses).forEach((className) => {
            this.props.onClassChange?.(className, payload.resolvedClasses[className]);
          });
        }
        if (payload.keyframes && _.isObject(payload.keyframes)) {
          Object.keys(payload.keyframes).forEach((name) => {
            this.props.onKeyframesChange?.(name, payload.keyframes[name]);
          });
        }
        if (payload.element && _.isObject(payload.element)) {
          this.props.onChange?.(payload.element);
        }
      } else {
        const parsed = this.parseCompiledCss(text);
        Object.keys(parsed.classes).forEach((className) => {
          this.props.onClassChange?.(className, parsed.classes[className]);
        });
        Object.keys(parsed.keyframes).forEach((name) => {
          this.props.onKeyframesChange?.(name, parsed.keyframes[name]);
        });
      }
    } catch (err) {
      this.setState((prevState) => ({
        sourceError: { ...prevState.sourceError, [mode]: err?.message || String(err) }
      }));
    }
  }

  renderSourcePane(elementProps) {
    const mode = this.state.sourceMode;
    const err = this.state.sourceError?.[mode];
    return (
      <div ref={ this.sourcePaneRef } style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Tabs
          value={ this.state.sourceMode }
          onChange={ this.handleSourceModeChange }
          variant="fullWidth"
          style={{ color: 'var(--caf-text)', marginBottom: 10 }}
        >
          <Tab value="json" label="JSON" style={{ color: 'var(--caf-text)' }} />
          <Tab value="css" label="Compiled CSS" style={{ color: 'var(--caf-text)' }} />
        </Tabs>
        { err && (
          <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            { err }
          </div>
        ) }
        <div style={{ border: '1px solid var(--caf-border)', flex: 1, minHeight: 0 }}>
          <CodeMirror
            value={ this.state.sourceText?.[mode] || this.getGeneratedSourceValue(mode, elementProps) }
            options={{
              mode: this.state.sourceMode === 'css' ? 'css' : 'javascript',
              // Long CSS values (gradients, transforms) wrap instead of running
              // off the panel. JSON stays unwrapped: an SVG path's `d` is one
              // huge line that would fill the whole pane.
              lineWrapping: this.state.sourceMode === 'css',
              theme: 'material',
              lineNumbers: true,
              readOnly: false
            }}
            editorDidMount={(editor) => editor.setSize(null, '100%')}
            onBeforeChange={ this.handleSourceBeforeChange }
          />
        </div>
      </div>
    );
  }

  renderEditPane(elementProps, classes) {
    return (
      <React.Fragment>
        <div>
          <label htmlFor={ this.fid('element', 'name') }>Layer name</label>
          <input
            id={ this.fid('element', 'name') }
            title="The name in the Layers panel and the Timeline. It is not exported to the HTML or CSS."
            style={{
              display: 'block',
              background: 'var(--caf-input-bg)',
              width: '100%',
              padding: '10px',
              border: 'none',
              color: 'var(--caf-text)'
            }}
            value={ elementProps.displayName }
            onChange={ (e) => { this.handleChange(e.target.value, 'displayName') } }
          />
        </div>
        { this.renderAttributes(elementProps) }
        { this.renderClassesTags(elementProps.classes) }
        { this.renderClassProperties(this.getElementClassProps(classes, elementProps.classes)) }
        { this.renderKeyframesEditors() }
      </React.Fragment>
    );
  }

  /**
   * Edit the element's DOM node type (`tag`) and its `attributes`
   * (id, d, points, transform, viewBox, …) — the pieces that make an element
   * any DOM/SVG node. Changes flow through onChange -> updateElementAtPath.
   */
  renderAttributes(elementProps) {
    const tag = elementProps.tag || 'div';
    const attributes = elementProps.attributes || {};
    const inputStyle = {
      background: 'var(--caf-input-bg)',
      width: '100%',
      padding: '8px',
      border: 'none',
      color: 'var(--caf-text)'
    };

    const updateAttr = (key, value) => {
      this.handleChange({ ...attributes, [key]: value }, 'attributes');
    };
    const removeAttr = (key) => {
      const next = { ...attributes };
      delete next[key];
      this.handleChange(next, 'attributes');
    };

    const attrKeys = Object.keys(attributes);

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 4 }}>TAG</div>
        <input
          id={ this.fid('element', 'tag') }
          style={{ ...inputStyle, display: 'block', marginBottom: 10 }}
          value={ tag }
          onChange={ (e) => this.handleChange(e.target.value || 'div', 'tag') }
        />
        <div style={{ marginBottom: 4 }}>ATTRIBUTES</div>
        { attrKeys.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 6 }}>No attributes</div>
        ) }
        { attrKeys.map((key) => (
          <div key={ key } style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ minWidth: 64, fontSize: 12, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }} title={ key }>{ key }</span>
            <input
              id={ this.fid('element', 'attr', key) }
              aria-label={ `${key} attribute` }
              style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              value={ attributes[key] }
              onChange={ (e) => updateAttr(key, e.target.value) }
            />
            <span
              style={{ cursor: 'pointer', opacity: 0.6, padding: '0 4px' }}
              title="Remove attribute"
              onClick={ () => removeAttr(key) }
            >×</span>
          </div>
        )) }
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={ () => {
            const key = window.prompt('Attribute name (e.g. id, d, transform):');
            if (key) updateAttr(key.trim(), '');
          } }
        >
          Add attribute
        </Button>
      </div>
    );
  }

  customizedDialogs() {
    const handleClose = () => {
      this.setState({showModal: false});
    };

    return (
      <div>
        <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={ this.state.showModal }>
          <DialogTitle id="customized-dialog-title" onClose={handleClose}>
            Assign Classes to { this.props.elementProps.displayName }
          </DialogTitle>
          <DialogContent dividers>
            <TransferList
              classes={ this.props.classes }
              setClasses={ this.props.elementProps.classes }
              onChange={ (value) => { this.handleChange(value, 'classes'); } }
            />
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }












  /**
   * Unique DOM id for one of this editor's fields. Scoped per editor: the
   * "Add New Element" dialog keeps a second ElementEditor mounted (hidden),
   * so unscoped ids would exist twice.
   */
  fid(...parts) {
    return fieldId(this.props.idScope || 'editor', ...parts);
  }

  getElementClassProps(classes, elClasses) {
    const filtered = {};
    if (elClasses) {
      elClasses.forEach((className) => {
        if (classes && classes[className]) {
          filtered[className] = classes[className];
        }
      });
    }

    return filtered;
  }

  getPropsFromMap(src, map) {
    if (src && map) {
      const newMap = [];
      src.forEach((item, i) => {
      const index = i % 3;

      if (index === 1) {
        map.forEach((thing, j) => {
          if (item === thing.index) {
            newMap.push({
              ...map[j],
              value: src[i + 1].data
            });
          }
        });
      }
      });


      if (newMap.length > 0) {
              // now extract
        const prop = {
          [camelize(newMap[0].value)]: newMap[1].value
        };
        return prop;
      }


    }

    return null;

  }

  getStyleObjFromCM(editor) {
    // console.log('getStyleObjFromCM', editor);

    if (editor && editor.display && editor.display.renderedView) {
      let obj = {};
      const renderedView = editor.display.renderedView;

      renderedView.forEach((view) => {
        const { line, measure } = view;

        const indexes = this.getPropsFromLine(line);

        if (indexes && !isEven(indexes.length)) {
          // TODO: Add this to state flag at end..... Cannot toggle away from code view until resolved
          console.error('!!! MISMATCH', line);
        } else {
          const prop = this.getPropsFromMap(measure.map, indexes);

          // Note: This method corrects duplicates...
          if (prop) {
            obj = {
              ...obj,
              ...prop
            }
          }
        }


      });

      // TODO: Handle multi key value .. border: 1px solid white;
      // console.log('getStyleObjFromCM', obj);


    }
  }

  getPropsFromLine({ styles }) {
    if (styles) {
      const markers = [];
      styles.forEach((item, i) => {
        if (item === 'tag') {
          markers.push({
            name: 'key',
            index: styles[i - 1]
          });
        }
        if (item === 'variable-3' || item === 'number') {
          markers.push({
            name: 'value',
            index: styles[i - 1]
          });
        }
      });

      return markers;
    }

    return null;
  }

  handleToggleCodeView() {

    const props = this.props.elementProps.props;
    let css;
    if (!_.isString(props)) {
      css = getCSSfromStyleObj(this.props.elementProps.props);
    } else {
      // this does not work if CM was not used...
      css = this.getStyleObjFromCM(props);
    }

    this.handleChange(css, 'props');
  }

  /*
   * Updates element props (elementProps obj)
   * @param {any} value - new value for prop
   * @param {string} key - prop to change
   */
  handleChange(value, key) {
    let formatedVal = value;
    if (key === 'classes') {
      formatedVal = [
        ...this.props.elementProps.classes
      ];

      // Delete -- Remove index from array
      if (_.isNumber(value)) {
        formatedVal.splice(value, 1);
      } else if (_.isArray(value)) {
        formatedVal = value;
      }
    }

    this.props.onChange({
      [key]: formatedVal
    });
  }

  handleEditorChange(value, key) {
    if (key === 'css') {
      this.setState((prevState) => {

        return {
          editor: {
            ...prevState.editor,
            ...value
          }
        }
      });
    }
  }

  renderKeyFrames(keyframes) {
    return keyframes.map((keyframe, i) => {
      return (
        <CodeMirror
          key={ i }
          value={ keyframe }
          options={{
            mode: 'css',
            theme: 'material',
            lineNumbers: true
          }}
          onBeforeChange={(editor, data, value) => {
            const key = `animation.keyframes[${i}]`;
            this.handleChange(value, key)
          }}
        />
      )
    });
  }

  renderProperties(name, props) {

    const handleChange = (event) => {
      this.setState({
        position: event.target.value
      });
    };

    const {
       position,
       background,
       borderRadius,
       width,
       height,
       animationName,
       animationDelay,
       animationDirection,
       animationIterationCount,
       animationTimingFunction
    } = props;

    return (
      <div>
        <div>
          { name }
        </div>
        <div>
          <EditFields
            { ...props }
            idPrefix={ this.fid('class', name, 'fields') }
            onChange={
              (key, value) => { this.props.onClassChange(name, { ...props, [key]: value }) }
            }
          />
        </div>
        <div>
          <div>
            <Select
              labelId="demo-simple-select-label"
              id={ this.fid('class', name, 'position') }
              name={ this.fid('class', name, 'position') }
              value={ position ?? '' }
              onChange={handleChange}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="static">Static</MenuItem>
              <MenuItem value="relative">Relative</MenuItem>
              <MenuItem value="absolute">Absolute</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
            </Select>
              <Tooltip title="static -- Default value. Elements render in order, as they appear in the document flow. absolute ....."><span>?</span></Tooltip>
          </div>
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, borderRadius: e.target.value }) } }
            value={ borderRadius ?? '' }
            id={ this.fid('class', name, 'borderRadius') }
            label="Border Radius" />
          <Slider value={ parseInt(borderRadius, 10) } onChange={ (e, value) => { this.props.onClassChange(name, { ...props, borderRadius: `${value}px` }) } }  aria-labelledby="continuous-slider" />
          { /* TODO: PROVIDE COLOR PICKER */ }
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, background: e.target.value }) } }
            value={ background ?? '' }
            id={ this.fid('class', name, 'background') }
            label="Background" />
            { /* TODO: OPTION TO LOCK ASPECT RATIO for W/H */ }
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, width: e.target.value }) } }
            value={ width ?? '' }
            id={ this.fid('class', name, 'width') }
            label="Width" />
          <Slider value={ parseInt(width, 10) } onChange={ (e, value) => { this.props.onClassChange(name, { ...props, width: `${value}px` }) } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, height: e.target.value }) } }
            value={ height ?? '' }
            id={ this.fid('class', name, 'height') }
            label="Height" />
          <Slider value={ parseInt(height, 10) } onChange={ (e, value) => { this.props.onClassChange(name, { ...props, height: `${value}px` }) } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationName: e.target.value }) } }
            value={ animationName ?? '' }
            id={ this.fid('class', name, 'animationName') }
            label="Animation Name" />
          <Divider />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationDelay: e.target.value }) } }
            value={ animationDelay ?? '' }
            id={ this.fid('class', name, 'animationDelay') }
            label="Animation Delay" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationDirection: e.target.value }) } }
            value={ animationDirection ?? '' }
            id={ this.fid('class', name, 'animationDirection') }
            label="Animation Direction" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationIterationCount: e.target.value }) } }
            value={ animationIterationCount ?? '' }
            id={ this.fid('class', name, 'animationIterationCount') }
            label="Animation Iteration Count" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationTimingFunction: e.target.value }) } }
            value={ animationTimingFunction ?? '' }
            id={ this.fid('class', name, 'animationTimingFunction') }
            label="Animation Timing Function" />
        </div>
      </div>
    );
  }


  renderElementProperties(css) {
    let propContainer;
    if (_.isString(css)) {
      propContainer = (
        <CodeMirror
          value={ css }
          options={{
            mode: 'css',
            theme: 'material',
            lineNumbers: true
          }}
          onBeforeChange={(editor, data, value) => {
            this.handleChange(value, 'css');
            this.handleEditorChange(editor, 'css');
          }}
        />
      );
    // TODO: CONVERT PROPS TO FORM HERE!!
    } else if (css) {

      const handleChange = (event) => {
        this.setState({
          position: event.target.value
        });
      };

      const {
         position,
         background,
         borderRadius,
         width,
         height,
         animationName,
         animationDelay,
         animationDirection,
         animationIterationCount,
         animationTimingFunction
      } = css;

      propContainer = (
        <React.Fragment>
          <div>
            <Select
              labelId="demo-simple-select-label"
              id={ this.fid('element-style', 'position') }
              name={ this.fid('element-style', 'position') }
              value={ position ?? '' }
              onChange={handleChange}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="static">Static</MenuItem>
              <MenuItem value="relative">Relative</MenuItem>
              <MenuItem value="absolute">Absolute</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
            </Select>
              <Tooltip title="static -- Default value. Elements render in order, as they appear in the document flow. absolute ....."><span>?</span></Tooltip>
          </div>
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, borderRadius: e.target.value }, 'props') } }
            value={ borderRadius ?? '' }
            id={ this.fid('element-style', 'borderRadius') }
            label="Border Radius" />
          <Slider value={ parseInt(borderRadius, 10) } onChange={ (e, value) => { this.handleChange({ ...css, borderRadius: `${value}px` }, 'props') } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, background: e.target.value }, 'props') } }
            value={ background ?? '' }
            id={ this.fid('element-style', 'background') }
            label="Background" />
            { /* TODO: OPTION TO LOCK ASPECT RATIO for W/H */ }
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, width: e.target.value }, 'props') } }
            value={ width ?? '' }
            id={ this.fid('element-style', 'width') }
            label="Width" />
          <Slider value={ parseInt(width, 10) } onChange={ (e, value) => { this.handleChange({ ...css, width: `${value}px` }, 'props') } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, height: e.target.value }, 'props') } }
            value={ height ?? '' }
            id={ this.fid('element-style', 'height') }
            label="Height" />
          <Slider value={ parseInt(height, 10) } onChange={ (e, value) => { this.handleChange({ ...css, height: `${value}px` }, 'props') } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationName: e.target.value }, 'props') } }
            value={ animationName ?? '' }
            id={ this.fid('element-style', 'animationName') }
            label="Animation Name" />
          <Divider />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationDelay: e.target.value }, 'props') } }
            value={ animationDelay ?? '' }
            id={ this.fid('element-style', 'animationDelay') }
            label="Animation Delay" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationDirection: e.target.value }, 'props') } }
            value={ animationDirection ?? '' }
            id={ this.fid('element-style', 'animationDirection') }
            label="Animation Direction" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationIterationCount: e.target.value }, 'props') } }
            value={ animationIterationCount ?? '' }
            id={ this.fid('element-style', 'animationIterationCount') }
            label="Animation Iteration Count" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationTimingFunction: e.target.value }, 'props') } }
            value={ animationTimingFunction ?? '' }
            id={ this.fid('element-style', 'animationTimingFunction') }
            label="Animation Timing Function" />
        </React.Fragment>
      );
    }

    return (
      <div>
        PROPERTIES
        <Button onClick={ this.handleToggleCodeView } color="primary">
          TOGGLE CSS CODE VIEW
        </Button>
        { propContainer }
      </div>
    );
  }

  renderElementKeyframes(keyframes) {
    if (!_.isString(keyframes)) {
      return (
        <div>keyframes here</div>
      );
    }

    return (
      <div>
        KEYFRAMES
        <CodeMirror
          value={ keyframes }
          options={{
            mode: 'css',
            theme: 'material',
            lineNumbers: true
          }}
          onBeforeChange={(editor, data, value) => {
            // console.log('onBeforeChange', editor, data, value);
            this.handleChange(value, 'keyframes');
          }}
        />
      </div>
    );
  }


  renderKeyframesEditors() {
    const { element, keyframes, ...props } = this.props;






    if (element) {
      // filter by element...
      const { classes } = element;


      // Guard: SVG group/svg nodes can have no `classes`. Only keyframes that
      // exist: a missing name (half-typed in the field) used to crash the app.
      const keyframeNames = this.getKeyframeNames(classes || []);


      // console.log('renderKeyframesEditors', keyframeNames, this.props);

      return (
        <div>
          {
            keyframeNames.map((key) => {
              return (
                <KeyframesEditor
                  { ...props }
                  key={ key }
                  name={ key }
                  keyframes={ keyframes[key] }
                />
              );
            })
          }
        </div>
      );
    }

    return (
      <div>
        NO KEYFRAMES
      </div>

    );
  }

  renderClassesTags(classes) {
    // TODO:
    // 1) Add a + to add new classes
    // 2) ADd a Edit -- swap around in and out existing classes (Enhanced Transfer List) -- use this mUI component






    const handleClickOpen = () => {
      this.setState({showModal: true});
    };





    let classesEl;
    if (classes && classes.length > 0) {
      classesEl = (
        <div>
          {
            classes.map((item, i) => (
              <Chip
                key={ `${item}-${i}` }
                size="small"
                label={ item }
                onDelete={
                  () => {
                    this.handleChange(i, 'classes');
                  }
                }
              />
            ))
          }
        </div>
      );
    } else {
      classesEl = (
        <div>
          No Classes Assigned
        </div>
      );
    }
    // CONTINUE HERE
    // 1) Extract onclick to external method
    // 2) instetad of no classses assigned, replace with button 'Add new Class'
    return (
      <div>
        <div>
        CLASSES
        </div>
        <Button
          variant="outlined"
          color="primary"
          onClick={ () => {
            const newClass = 'newClass';

            const classes = [
              ...this.props.elementProps.classes,
              newClass
            ]

            // Add New Class
            this.props.onClassChange(newClass, {});
            // Apply New Class to El
            this.handleChange(classes, 'classes');
          } }
        >
          Add
        </Button>
        <Button variant="outlined" color="primary" onClick={handleClickOpen}>
          Assign Classes
        </Button>
        { classesEl }
      </div>
    );
  }


  // PROPS
  // NAME
  // classes
  // SUGGESTIONS
  // ADD APPROPRIATE SLIDERS FOR PROPS. EG HEIGHT/WIDTH
  renderClassProperties(classes) {
    // console.log('renderClassProperties', classes);

    // RENDER ELEMENT CLASSSES, NOT ALL CLASSES ---> FILTER EM (BEFORE THIS FN IS CALLED....)



    if (classes) {
      // console.log('renderClassProperties', classes);
      return (
        <div>
          {
            Object.keys(classes).map((item) => (
              <React.Fragment key={ item }>{ this.renderProperties(item, classes[item]) }</React.Fragment>
            ))
          }
        </div>
      );
    }

    return null;
  }

  render() {
    const { editor } = this.state;
    const {
      classes,
      elContainerWidth,
      elementProps,
      visible = true,
      onSubmit
    } = this.props;

    // console.log('render', this.props);

    if (elementProps && visible) {
      const { animation } = elementProps;

      let elKeyframes = [];
      if (animation && animation.keyframes) {
        elKeyframes = animation.keyframes;
      }

      // externalize style props....
      return (
        <div
          className="stacking-10 container element-editor-panel"
          style={ {
            width: this.props.width,
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...this.props.style
          } }
        >
          <div className="caf-panel-title">
            Elemental Editor
          </div>
          { this.customizedDialogs() }

          <div
            style={{
              position: 'sticky',
              top: 0,
              background: 'var(--caf-surface)',
              zIndex: 2,
              paddingBottom: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              { !this.state.expanded && (
                <Tabs
                  value={ this.state.activeTab }
                  onChange={ this.handleTabChange }
                  variant="fullWidth"
                  style={{ color: 'var(--caf-text)', flex: 1 }}
                >
                  <Tab value="source" label="Source" style={{ color: 'var(--caf-text)' }} />
                  <Tab value="edit" label="Edit" style={{ color: 'var(--caf-text)' }} />
                </Tabs>
              ) }
              <IconButton
                size="small"
                onClick={ this.handleToggleExpanded }
                style={{ color: 'var(--caf-text)' }}
                title={ this.state.expanded ? 'Collapse' : 'Expand' }
              >
                { this.state.expanded ? <UnfoldMoreIcon /> : <UnfoldLessIcon /> }
              </IconButton>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, paddingTop: 10 }}>
            { this.state.expanded ? (
              <div style={{ display: 'flex', flexDirection: 'row', height: '100%', gap: 10 }}>
                <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                  { this.renderSourcePane(elementProps) }
                </div>
                <div style={{ flex: '1 1 50%', minWidth: 0, overflowY: 'auto' }}>
                  { this.renderEditPane(elementProps, classes) }
                </div>
              </div>
            ) : this.state.activeTab === 'source' ? (
              <div style={{ height: '100%' }}>
                { this.renderSourcePane(elementProps) }
              </div>
            ) : (
              <div style={{ height: '100%', overflowY: 'auto' }}>
                { this.renderEditPane(elementProps, classes) }
              </div>
            ) }
          </div>
        </div>
      );
    }

    // Opened with nothing selected (header toggle): say so, instead of a 0px
    // panel that makes the toggle look broken.
    if (visible) {
      return (
        <div
          className="stacking-10 container element-editor-panel"
          style={ { width: this.props.width, height: '100%', ...this.props.style } }
        >
          <div className="caf-panel-title">
            Elemental Editor
          </div>
          <p className="caf-empty-note">
            Nothing selected. Click a layer, or something in the preview, to edit it.
          </p>
        </div>
      );
    }

    return null;
  }
}
