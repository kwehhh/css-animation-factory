import React from "react";
import ReactDOM from "react-dom";
import App from './app/App.jsx';
import manifest from './data/manifest.json';

ReactDOM.render(
  <App manifest={ manifest } />,
  document.body.appendChild(document.createElement('div'))
);
