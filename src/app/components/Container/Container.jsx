import React from 'react';
import classNames from 'classnames';
import './Container.scss';

export default class Container extends React.Component {

  constructor(props) {
    super();
    this.state = {
      animationActive: (props.visible)
    };

    this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
  }

  static getDerivedStateFromProps(props) {
    if (props.visible) {
      return {
        animationActive: true
      }
    }

    return null;
  }

  getAnimation() {
    const { visible } = this.props;

    let animation;
    if (visible === true) {
      animation = 'slide-up';
    } else if (visible === false) {
      animation = 'slide-down';
    }

    return animation;
  }

  handleAnimationEnd(animationActive) {
    this.setState({animationActive});
  }

  render() {
    const { children, className, style, visible } = this.props;
    const { animationActive } = this.state;

    return (
      <div
        className={ classNames(className, {hide: !visible && !animationActive }, this.getAnimation(), 'container') }
        onAnimationEnd={ () => { this.handleAnimationEnd(false) } }
        style={ style }
      >
        { children }
      </div>
    );
  }
}