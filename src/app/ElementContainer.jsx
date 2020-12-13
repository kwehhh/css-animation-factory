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

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value, key) {

    // console.log('handleChange');
    this.props.onChange({
      [key]: value
    });
  }

  handleSubmit() {
    this.props.onSubmit({
      name: this.state.name
    });
  }

  render() {
    // const { name } = this.state;
    const { elementProps, visible, onSubmit } = this.props;



    


    if (elementProps && visible) {
      // console.log('ElementContainer', elementProps);
      return (
        <div>


          <div>
            Name
            <input 
              value={ elementProps.name } 
              onChange={ (e) => { this.handleChange(e.target.value, 'name') } } 
            />
          </div>
          <div>
            HTML
            <input />
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
                console.log('onBeforeChange', editor, data, value);
                this.handleChange(value, 'css')
              }}
              onChange={(editor, data, value) => {
                console.log('onChange', editor, data, value);
                // this.handleChange(value, 'css')

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
