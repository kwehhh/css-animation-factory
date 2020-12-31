import React from "react";
import _ from 'lodash';
import {Controlled as CodeMirror} from 'react-codemirror2';
require('codemirror/mode/css/css');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
// import "./App.scss";


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
  
export default class ElementContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      editor: {}
    };

    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
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

  handleChange(value, key) {
    // console.log('handleChange', value, key);
    this.props.onChange({
      [key]: value
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

  render() {
    const { editor } = this.state;
    const { elContainerWidth, elementProps, visible, onSubmit } = this.props;
    if (elementProps && visible) {

      const { animation } = elementProps;


      let elKeyframes = [];
      if (animation && animation.keyframes) {
        elKeyframes = animation.keyframes;
      }


      // console.log('ElementContainer', editor);
      this.getStyleObjFromCM(editor);

      // SUGGESTIONS
      // ADD APPROPRIATE SLIDERS FOR PROPS. EG HEIGHT/WIDTH
      return (
        <div 
          className="stacking-10 container"        
          style={ {
            width: elContainerWidth,
            right: '20px',
          } }
        >
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
          <div>
            PROPERTIES <span>TOGGLE CODE VIEW</span>
            <CodeMirror
              value={ elementProps.css }
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
          </div>
          <div>
            KEYFRAMES
            <CodeMirror
              value={ elementProps.keyframes }
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
        </div>
      );
    }

   // Add Element
  //   <button onClick={ this.handleSubmit }>
  //   Add Element
  // </button>

    return null;
  }


  // render() {
  //   return (
  //     <div>
  //       { this.renderNewElementContainer() }
  //     </div>
  //   );
  // }
}
