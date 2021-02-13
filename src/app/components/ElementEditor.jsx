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
  IconButton,
  CloseIcon
} from '@material-ui/core';
import TransferList from './TransferList.jsx';
import EditFields from './Editor/EditFields.jsx';
import KeyframesEditor from './Editor/KeyframesEditor.jsx';
import {Controlled as CodeMirror} from 'react-codemirror2';
import { getCSSfromStyleObj } from '../../util/CSSUtil.js';
require('codemirror/mode/css/css');
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

  constructor() {
    super();
    this.state = {
      editor: {},
      position: 'none',
      showModal: false
    };

    this.handleToggleCodeView = this.handleToggleCodeView.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
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
    elClasses.forEach((className) => {
      if (classes && classes[className]) {
        filtered[className] = classes[className];
      }
    });

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
      console.log('getStyleObjFromCM', obj);


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
      console.log('handleToggleCodeView', css);
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
    console.log('handleChange', value, key);

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
            console.log('onBeforeChange', editor, data, value);
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
            console.log('onBeforeChange', editor, data, value);
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
    } else {
      console.log('ERRRO');
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
            // this.setState({value});
            // console.log('onBeforeChange', editor, data, value);
            this.handleChange(value, 'keyframes');
          }}
        />
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
                size="small"
                label={ item }
                onDelete={
                  () => {
                    console.log('delete', i, this.props);
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
    // add class
    // 1) add new class
    // 2) auto assign to existing element
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
          className="stacking-10 container"
          style={ {
            width: this.props.width,
            maxHeight: '100%',
            overflowY: 'auto',
            ...this.props.style
          } }
        >
          { this.customizedDialogs() }
          <div>
            Name
            <input
              style={{
                display: 'block',
                background: 'hsl(280deg 100% 20%)',
                width: '100%',
                padding: '10px',
                border: 'none',
                color: 'white'
              }}
              value={ elementProps.name }
              onChange={ (e) => { this.handleChange(e.target.value, 'name') } }
            />
          </div>
          { this.renderClassesTags(elementProps.classes) }
          { this.renderClassProperties(this.getElementClassProps(classes, elementProps.classes)) }
          { this.renderElementKeyframes(elementProps.keyframes) }
          <KeyframesEditor { ...this.props } />
        </div>
      );
    }

    return null;
  }
}
