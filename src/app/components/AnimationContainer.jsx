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


  renderKeyframes() {
    const { keyframes } = this.props;

    if (keyframes) {
      return Object.keys(keyframes).map((key) => {
        return <div key={ key } />;
      });
    }

    return null;
  }

  render() {

    console.log('render', this.props);



    // Animation Container
    return (
      <div
        className="container"
        style={{
        position: 'absolute',
        height: '200px',
        left: 0,
        bottom: 0,
        right: 0
      }}>
        { this.renderKeyframes() }
      </div>
    );


    const { name } = this.state;
    const { visible, onSubmit } = this.props;

    if (visible) {
      return (
        <div style={{
          position: 'absolute',
          height: '200px',
          left: 0,
          bottom: 0,
          right: 0
        }}>
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
