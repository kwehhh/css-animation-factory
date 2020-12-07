import React from "react";
// import "./App.scss";

export default class ElementContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      name: 'ball'
    };
  }

  render() {
    const { name, visible, onSubmit } = this.props;

    if (visible) {
      return (
        <div>
          <div>
            Name
            <input value={ name } />
          </div>
          <div>
            HTML
            <input />
          </div>
          <div>
            CSS
            <input />
          </div>
          <button onClick={ onSubmit }>
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
