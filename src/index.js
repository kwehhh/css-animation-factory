import React from "react";
import ReactDOM from "react-dom";
import CodeMirror from 'codemirror';
import App from './app/App.jsx';
import manifest from './data/manifest.json';

// Every CodeMirror editor types into its own hidden <textarea> with no id or
// name, which the browser flags (DevTools Issues). Name them all here, once,
// before any editor is created.
CodeMirror.defineInitHook((editor) => {
  const input = editor.getInputField();
  if (input && !input.name) {
    input.name = 'caf-code-editor';
  }
});

ReactDOM.render(
  <App manifest={ manifest } />,
  document.body.appendChild(document.createElement('div'))
);
