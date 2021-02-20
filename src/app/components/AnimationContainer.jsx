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

 /**
   * // Extract to utils.....
   * @param {array}
   * @returns {string}
   */
  getClassNames(classes) {
    if (classes) {
      return classes.join(' ');
    }

    return '';
  }

  handleSubmit() {
    this.props.onSubmit({
      name: this.state.name
    });
  }


  renderKeyframes() {
    const { element, keyframes } = this.props;

    console.log('renderKeyframes', this.props);

    if (keyframes) {
      return Object.keys(keyframes).map((key) => {
        return (
          <div
            key={ key }
            className={ this.getClassNames(element.classes) }
            style={{
              ...keyframes[key],
              animation: 'none',
              position: 'static',
              transform: 'none'
            }
          }
          />
        );
      });
    }

    return null;
  }

  render() {
    console.log('render', this.props);

    const { keyframes } = this.props;


    if (keyframes) {
      return (
        <div
          className="container"
          style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          left: 0,
          bottom: 0,
          right: 0,
          boxShadow: '-1px -5px 4px 0px rgba(0,0,0,0.15)'
        }}>
          <div
            className="flex-30"
            style={{
              justifyContent: 'space-between',
              display: 'flex'
            }}
          >
          { this.renderKeyframes() }
          </div>
        </div>
      );
    }

    return null;

    // Animation Container



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
