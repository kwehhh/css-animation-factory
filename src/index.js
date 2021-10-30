import React from "react";
import ReactDOM from "react-dom";
import App from './app/App.jsx';
import manifest from './data/manifest.json';
import ball from './data/ball.json';
import submarine from './data/submarine.json';

ReactDOM.render(
  <App manifest={ manifest } />,
  // <App data={ submarine } />,
  document.body.appendChild(document.createElement('div'))
);
