import React from "react";
import classNames from 'classnames';
import Container from '../Container/Container.jsx';

export default class AnimationContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      animationState: 'open',
      name: 'ball'
    };

    this.handleChangeAnimationState = this.handleChangeAnimationState.bind(this);
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

  handleChangeAnimationState(animationState) {
    this.setState({animationState});
  }

  handleSubmit() {
    this.props.onSubmit({
      name: this.state.name
    });
  }


  renderKeyframes() {
    const { element, keyframes } = this.props;

    console.log('renderKeyframes', this.props);

    if (element && keyframes) {
      return Object.keys(keyframes).map((key) => {
        return (
          <div>
            <div>{ key }</div>
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
          </div>
        );
      });
    }

    return null;
  }

  render() {
    const { element, keyframes } = this.props;

    const isVisible = Boolean(element && keyframes) || false;

    console.log('render', isVisible, this.props);


    return (
      <Container
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
        }}
        visible={ isVisible }
      >
        <div
        >
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
      </Container>
    );
  }
}
