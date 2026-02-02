import React from "react";
import _, { filter } from 'lodash';
import {
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  MuiDialogTitle,
  MuiMuiDialogContent,
  MuiMuiDialogActions,
  Modal,
  Select,
  Slider,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  IconButton,
  CloseIcon
} from '@material-ui/core';
import TransferList from './TransferList.jsx';
import EditFields from './Editor/EditFields.jsx';
import KeyframesEditor from './Editor/KeyframesEditor.jsx';
import {Controlled as CodeMirror} from 'react-codemirror2';
import { getCSSfromStyleObj } from '../../util/CSSUtil.js';
import UnfoldMoreIcon from '@material-ui/icons/UnfoldMore';
import UnfoldLessIcon from '@material-ui/icons/UnfoldLess';
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
  }

  componentDidUpdate(prevProps) {
    // Reset editor buffers only when selection changes (not when element props update).
    // This prevents cursor jumping while doing live updates.
    if (!_.isEqual(prevProps.activePath, this.props.activePath)) {
      this.setState({
        sourceText: {
          json: this.getGeneratedSourceValue('json', this.props.elementProps),
          css: this.getGeneratedSourceValue('css', this.props.elementProps)
        },
        sourceError: { json: null, css: null }
      });
    }
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

  getSourcePayload(elementProps) {
    const resolvedClasses = this.getElementClassProps(this.props.classes, elementProps?.classes);

    const keyframeNames = [];
    if (elementProps?.classes) {
      elementProps.classes.forEach((className) => {
        const classProps = this.props.classes?.[className];
        if (classProps?.animationName) {
          keyframeNames.push(classProps.animationName);
        }
      });
    }

    const keyframes = {};
    keyframeNames.forEach((name) => {
      if (this.props.keyframes?.[name]) {
        keyframes[name] = this.props.keyframes[name];
      }
    });

    return {
      element: elementProps,
      resolvedClasses,
      keyframes
    };
  }

  getCompiledCss(elementProps) {
    const resolvedClasses = this.getElementClassProps(this.props.classes, elementProps?.classes);

    const blocks = [];
    if (resolvedClasses) {
      Object.keys(resolvedClasses).forEach((className) => {
        blocks.push(`.${className} {\n${getCSSfromStyleObj(resolvedClasses[className])}}`);
      });
    }

    const keyframeNames = [];
    if (elementProps?.classes) {
      elementProps.classes.forEach((className) => {
        const classProps = this.props.classes?.[className];
        if (classProps?.animationName) {
          keyframeNames.push(classProps.animationName);
        }
      });
    }

    keyframeNames.forEach((name) => {
      const kf = this.props.keyframes?.[name];
      if (!kf) return;

      let framesCss = '';
      Object.keys(kf).forEach((pct, i) => {
        const formatter = (attr, value) => `  ${attr}: ${value};\n`;
        const propsCss = getCSSfromStyleObj(kf[pct], formatter);
        framesCss += `${pct} {\n${propsCss}}\n`;
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Tabs
          value={ this.state.sourceMode }
          onChange={ this.handleSourceModeChange }
          variant="fullWidth"
          style={{ color: '#fff', marginBottom: 10 }}
        >
          <Tab value="json" label="JSON" style={{ color: '#fff' }} />
          <Tab value="css" label="Compiled CSS" style={{ color: '#fff' }} />
        </Tabs>
        { err && (
          <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            { err }
          </div>
        ) }
        <div style={{ border: '1px solid rgba(255,255,255,0.15)', flex: 1, minHeight: 0 }}>
          <CodeMirror
            value={ this.state.sourceText?.[mode] || this.getGeneratedSourceValue(mode, elementProps) }
            options={{
              mode: this.state.sourceMode === 'css' ? 'css' : 'javascript',
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
          Name
          <input
            style={{
              display: 'block',
              background: 'var(--caf-input-bg)',
              width: '100%',
              padding: '10px',
              border: 'none',
              color: 'var(--caf-text)'
            }}
            value={ elementProps.name }
            onChange={ (e) => { this.handleChange(e.target.value, 'name') } }
          />
        </div>
        { this.renderClassesTags(elementProps.classes) }
        { this.renderClassProperties(this.getElementClassProps(classes, elementProps.classes)) }
        { this.renderKeyframesEditors() }
      </React.Fragment>
    );
  }

  // make this slide from bottom like a horizontal sidebar panel
  customizedDialogs() {
    // const [open, setOpen] = React.useState(false);
    const open = true;

    // const handleClickOpen = () => {
    //   this.setState({showModal: true});
    // };
    const handleClose = () => {
      this.setState({showModal: false});
    };



  //   <Button variant="outlined" color="primary" onClick={handleClickOpen}>
  //   Assign Classes
  // </Button>

    return (
      <div>
        <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={ this.state.showModal }>
          <DialogTitle id="customized-dialog-title" onClose={handleClose}>
            Assign Classes to { this.props.elementProps.name }
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












  getElementClassProps(classes, elClasses) {
    const filtered = {};
    if (elClasses) {
      elClasses.forEach((className) => {
        if (classes && classes[className]) {
          filtered[className] = classes[className];
        }
      });
    }


    // console.log('getElementClassProps', filtered);

    return filtered;
  }

  getPropsFromMap(src, map) {
    // console.log('getPropsFromMap', src, map);

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

        // if (_.isObject(item)) {
        //   console.log(item, index);
        // }
      });


      if (newMap.length > 0) {
              // now extract
        const prop = {
          [camelize(newMap[0].value)]: newMap[1].value
        };

        // console.log('getPropsFromMap', prop);
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
      // const tags = [];
      // const variables = [];
      const markers = [];
      styles.forEach((item, i) => {
        if (item === 'tag') {
          // console.log('getPropsFromLine', styles[i - 1]);
          // tags.push(styles[i - 1]);
          markers.push({
            name: 'key',
            index: styles[i - 1]
          });
        }
        if (item === 'variable-3' || item === 'number') {
          // console.log('getPropsFromLine', styles[i - 1]);
          // variables.push(styles[i - 1]);
          markers.push({
            name: 'value',
            index: styles[i - 1]
          });
        }
        // if (item === 'number') {
        //   // console.log('getPropsFromLine', styles[i - 1]);
        //   // variables.push(styles[i - 1]);
        //   markers.push({
        //     name: 'value',
        //     index: styles[i - 1]
        //   });
        // }
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
      // console.log('handleToggleCodeView', css);
    }


    // const css = getCSSfromStyleObj(this.props.elementProps.props);

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

  // handleSubmit() {
  //   this.props.onSubmit({
  //     name: this.state.name
  //   });
  // }

  renderKeyFrames(keyframes) {
    return keyframes.map((keyframe, i) => {
      return (
        <CodeMirror
          value={ keyframe }
          options={{
            mode: 'css',
            theme: 'material',
            lineNumbers: true
          }}
          onBeforeChange={(editor, data, value) => {
            // this.setState({value});
            // console.log('onBeforeChange', editor, data, value);
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
            onChange={
              (key, value) => { this.props.onClassChange(name, { ...props, [key]: value }) }
            }
          />
        </div>
        <div>
          <div>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={ position }
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
            value={ borderRadius }
            id="standard-basic"
            label="Border Radius" />
          <Slider value={ parseInt(borderRadius, 10) } onChange={ (e, value) => { this.props.onClassChange(name, { ...props, borderRadius: `${value}px` }) } }  aria-labelledby="continuous-slider" />
          { /* TODO: PROVIDE COLOR PICKER */ }
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, background: e.target.value }) } }
            value={ background }
            id="standard-basic"
            label="Background" />
            { /* TODO: OPTION TO LOCK ASPECT RATIO for W/H */ }
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, width: e.target.value }) } }
            value={ width }
            id="standard-basic"
            label="Width" />
          <Slider value={ parseInt(width, 10) } onChange={ (e, value) => { this.props.onClassChange(name, { ...props, width: `${value}px` }) } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, height: e.target.value }) } }
            value={ height }
            id="standard-basic"
            label="Height" />
          <Slider value={ parseInt(height, 10) } onChange={ (e, value) => { this.props.onClassChange(name, { ...props, height: `${value}px` }) } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationName: e.target.value }) } }
            value={ animationName }
            id="standard-basic"
            label="Animation Name" />
          <Divider />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationDelay: e.target.value }) } }
            value={ animationDelay }
            id="standard-basic"
            label="Animation Delay" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationDirection: e.target.value }) } }
            value={ animationDirection }
            id="standard-basic"
            label="Animation Direction" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationIterationCount: e.target.value }) } }
            value={ animationIterationCount }
            id="standard-basic"
            label="Animation Iteration Count" />
          <TextField
            onChange={ (e) => { this.props.onClassChange(name, { ...props, animationTimingFunction: e.target.value }) } }
            value={ animationTimingFunction }
            id="standard-basic"
            label="Animation Timing Function" />
        </div>
      </div>
    );
  }


  // REMOVE ENTIRE BLOCK
  // NEED TO EXTRACT OUT LOGIC FOR CM VIEW USAGE
  renderElementProperties(css) {

    // console.log('renderElementProperties', css);

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
            // this.setState({value});
            // console.log('onBeforeChange', editor, data, value);
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
              id="demo-simple-select"
              value={ position }
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
            value={ borderRadius }
            id="standard-basic"
            label="Border Radius" />
          <Slider value={ parseInt(borderRadius, 10) } onChange={ (e, value) => { this.handleChange({ ...css, borderRadius: `${value}px` }, 'props') } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, background: e.target.value }, 'props') } }
            value={ background }
            id="standard-basic"
            label="Background" />
            { /* TODO: OPTION TO LOCK ASPECT RATIO for W/H */ }
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, width: e.target.value }, 'props') } }
            value={ width }
            id="standard-basic"
            label="Width" />
          <Slider value={ parseInt(width, 10) } onChange={ (e, value) => { this.handleChange({ ...css, width: `${value}px` }, 'props') } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, height: e.target.value }, 'props') } }
            value={ height }
            id="standard-basic"
            label="Height" />
          <Slider value={ parseInt(height, 10) } onChange={ (e, value) => { this.handleChange({ ...css, height: `${value}px` }, 'props') } }  aria-labelledby="continuous-slider" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationName: e.target.value }, 'props') } }
            value={ animationName }
            id="standard-basic"
            label="Animation Name" />
          <Divider />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationDelay: e.target.value }, 'props') } }
            value={ animationDelay }
            id="standard-basic"
            label="Animation Delay" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationDirection: e.target.value }, 'props') } }
            value={ animationDirection }
            id="standard-basic"
            label="Animation Direction" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationIterationCount: e.target.value }, 'props') } }
            value={ animationIterationCount }
            id="standard-basic"
            label="Animation Iteration Count" />
          <TextField
            onChange={ (e) => { this.handleChange({ ...css, animationTimingFunction: e.target.value }, 'props') } }
            value={ animationTimingFunction }
            id="standard-basic"
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

  // REMOVE AFTER CODEMIRROR IS EXTRACTED
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
            // this.setState({value});
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


      const keyframeNames = [];

      // Get Keyframes from class
      // Use this... push it up, to get it up and store the animation details....
      classes.forEach((key) => {
        // console.log('map', this.props.classes[key]);

        if (this.props.classes[key] && this.props.classes[key].animationName) {
          keyframeNames.push(this.props.classes[key].animationName);
        }
      });


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
            Object.keys(classes).map((item) => this.renderProperties(item, classes[item]))
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

    // return 'hi';

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
              background: '#2e2442',
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
                  style={{ color: '#fff', flex: 1 }}
                >
                  <Tab value="source" label="Source" style={{ color: '#fff' }} />
                  <Tab value="edit" label="Edit" style={{ color: '#fff' }} />
                </Tabs>
              ) }
              <IconButton
                size="small"
                onClick={ this.handleToggleExpanded }
                style={{ color: '#fff' }}
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

    return null;
  }
}
