import React from "react";
import ReactDOM from "react-dom";
import App from './app/App.jsx';
import ball from './samples/ball.json';
import submarine from './samples/submarine.json';

const wrapper = document.getElementById('container');
wrapper ? ReactDOM.render(<App data={ submarine } />, wrapper) : false;

if (module.hot) {
  // module.hot.accept('./print.js', function() {
    console.log('Accepting dasdsad the updated printMe module!');
    // printMe();
  // })
}