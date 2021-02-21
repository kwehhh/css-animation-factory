import React from 'react';
import classNames from 'classnames';
import './Container.scss';

export default class Container extends React.Component {

  constructor(props) {
    super();
    this.state = {
      visible: props.visible,
      animationActive: (props.visible)
    };

    this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
    this.handleVisibleChange = this.handleVisibleChange.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    console.log('getDerivedStateFromProps', props, state);

    if (props.visible) {
      return {
        animationActive: true
      }
    }

    return null;
  }

  getAnimation() {
    const { visible } = this.props;
    const { animationActive } = this.state;

    console.log('getAnimation', visible, animationActive);

    let animation;
    if (visible === true) {
      animation = 'slide-up';
    } else if (visible === false) {
      animation = 'slide-down';
    }

    return animation;
  }

  handleVisibleChange(visible) {
    this.setState({visible});
  }

  handleAnimationEnd(animationActive) {
    this.setState({animationActive});
  }

  render() {
    const { children, className, style, visible } = this.props;
    const { animationActive } = this.state;


    console.log('render', this.props, this.state);

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