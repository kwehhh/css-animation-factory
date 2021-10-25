import React from "react";
import ReactDOM from "react-dom";
import App from './app/App.jsx';
import ball from './samples/ball.json';
import submarine from './samples/submarine.json';

ReactDOM.render(
  <App data={ submarine } />,
  document.body.appendChild(document.createElement('div'))
);
