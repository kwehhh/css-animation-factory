import React from "react";
import {UnControlled as CodeMirror} from 'react-codemirror2';
require('codemirror/mode/css/css');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
// import "./App.scss";

export default class ElementContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      name: 'ball',
      value: '.ball {\n  background: blue;\n  width: 50px;\n  height: 50px;\n}'
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit() {
    this.props.onSubmit({
      name: this.state.name
    });
  }

  render() {
    const { name } = this.state;
    const { elementProps, visible, onSubmit } = this.props;



    


    if (visible) {
      return (
        <div>


          <div>
            Name
            <input value={ elementProps.name } />
          </div>
          <div>
            HTML
            <input />
          </div>
          <div>
            CSS
            <CodeMirror
              value={this.state.value}
              options={{
                mode: 'css',
                theme: 'material',
                lineNumbers: true
              }}
              onBeforeChange={(editor, data, value) => {
            
              }}
              onChange={(editor, data, value) => {
              }}
            />
          </div>
          <div className={ this.state.name }>
              preview
          </div>
          <button onClick={ this.handleSubmit }>
            Add Element
          </button>
        </div>
      );
    }

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
