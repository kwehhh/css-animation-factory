import React from "react";
import ElementContainer from './app/ElementContainer.jsx';
import "./App.scss";

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      elements: [],
      showElementContainer: true
    };

    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
  }

  // renderNewElementContainer() {
  //   return (
  //     <div>
  //       <div>
  //         Name
  //         <input value={ this.state.name } />
  //       </div>
  //       <div>
  //         HTML
  //         <input />
  //       </div>
  //       <div>
  //         CSS
  //         <input />
  //       </div>
  //       <button>
  //         Add Element
  //       </button>
  //     </div>
  //   );
  // }

  handleShowContainer() {
    this.setState({showElementContainer: true});
  }

  handleHideContainer() {
    this.setState({showElementContainer: false});
  }

  render() {
    return (
      <div>
        <ElementContainer visible={ this.state.showElementContainer } onSubmit={ this.handleHideContainer } />
      </div>
    );
  }
}
