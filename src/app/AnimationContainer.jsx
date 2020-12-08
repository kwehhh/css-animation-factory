import React from "react";
// import "./App.scss";

export default class AnimationContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      name: 'ball'
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit() {
    this.props.onSubmit({
      name: this.state.name
    });
  }

  render() {


    return (
      <div>
        container
      </div>
    );


    const { name } = this.state;
    const { visible, onSubmit } = this.props;

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
