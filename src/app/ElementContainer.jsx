import React from "react";
import {Controlled as CodeMirror} from 'react-codemirror2';
require('codemirror/mode/css/css');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
// import "./App.scss";

export default class ElementContainer extends React.Component {

  constructor() {
    super();
    // this.state = {
    //   name: 'ball',
    //   value: '.ball {\n  background: blue;\n  width: 50px;\n  height: 50px;\n}'
    // };

    // this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value, key) {

    console.log('handleChange', value, key);
    this.props.onChange({
      [key]: value
    });
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
    // const { name } = this.state;
    const { elContainerWidth, elementProps, visible, onSubmit } = this.props;
    if (elementProps && visible) {

      const { animation } = elementProps;


      let elKeyframes = [];
      if (animation && animation.keyframes) {
        elKeyframes = animation.keyframes;
      }


      // console.log('ElementContainer', elementProps);

      // SUGGESTIONS
      // ADD APPROPRIATE SLIDERS FOR PROPS. EG HEIGHT/WIDTH
      return (
        <div 
          className="stacking-10"        
          style={{
            color: 'white',
            position: 'absolute',
            width: elContainerWidth,
            background: 'purple',
            top: '20px',
            padding: '20px',
            right: '20px',
            borderRadius: '10px'
        }}>


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
            CSS
            <CodeMirror
              value={ elementProps.css }
              options={{
                mode: 'css',
                theme: 'material',
                lineNumbers: true
              }}
              onBeforeChange={(editor, data, value) => {
                // this.setState({value});
                // console.log('onBeforeChange', editor, data, value);
                this.handleChange(value, 'css')
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
                this.handleChange(value, 'keyframes')
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
