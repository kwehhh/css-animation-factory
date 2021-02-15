import React from "react";
import _ from 'lodash';
import { Button } from '@material-ui/core';
import AddNewElement from './AddNewElement.jsx';


const NEW_EL_NAME = 'myNewElement';
const NEW_CLASS_NAME = 'myNewClass';
const NEW_KEYFRAMES_NAME = 'myNewKeyframes';

export default class ElementsContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      modalVisible: false,
      // Initial State for New Element
      initialElProps: {
        name: NEW_EL_NAME,
        classes: [NEW_CLASS_NAME]
      }
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  handleOpenModal() {
    // const { initialElProps } = this.state;
    // const { name, el } = initialElProps;

    // borrowed from:
    // https://css-tricks.com/making-css-animations-feel-natural/
    const keyframes = {
      '0%':   { transform: 'scale(1,1)      translateY(0)' },
      '10%':  { transform: 'scale(1.1,.9)   translateY(0)' },
      '30%':  { transform: 'scale(.9,1.1)   translateY(-100px)' },
      '50%':  { transform: 'scale(1.05,.95) translateY(0)' },
      '57%':  { transform: 'scale(1,1)      translateY(-7px)' },
      '64%':  { transform: 'scale(1,1)      translateY(0)' },
      '100%': { transform: 'scale(1,1)      translateY(0)' }
    };

    const props = {
      width: '50px',
      height: '50px',
      background: 'red',
      borderRadius: '10px',
      animationName: NEW_KEYFRAMES_NAME,
      animationDuration: '2s',
      animationIterationCount: 'infinite',
      animationDirection: 'normal',
      animationTimingFunction: 'cubic-bezier(0.280, 0.840, 0.420, 1)'
    };

    // Assign temp vals to CSS builder
    // TODO: Batch both these to a single setState call
    this.props.onClassChange(NEW_CLASS_NAME, props);
    this.props.onKeyframesChange(NEW_KEYFRAMES_NAME, keyframes);
    this.setState({modalVisible: true});
  }

  handleCloseModal() {
    // const { initialElProps } = this.state;
    // const { name, el } = initialElProps;

    // Assign temp vals to CSS builder
    this.props.onKeyframesChange(NEW_CLASS_NAME, false);
    this.props.onClassChange(NEW_KEYFRAMES_NAME, false);
    this.setState({modalVisible: false});
  }

  renderElements() {
    // console.log('renderElements', this.props);
    const elements = this.props.elements.map((element, i) => {

      if (element) {
        const { name } = element;
        // console.log(element);


        let className = '';
        let style = {};
        if (i === this.props.activeElement) {
          className = 'active';
          style = {};
        }

        return (
          <div
            className={ `menu-item ${className}` }
            onClick={ () => { this.props.onClick(i) } }
            style={ {
              paddingTop: '5px',
              paddingBottom: '5px',
              ...style
            } }
          >
            { name } [HIDE] [LOCK]
          </div>
        );
      }
    });;

    return (
      <div>
        { elements }
      </div>
    )
  }

  renderAddNewElementContainer() {
    return (
      <AddNewElement
        { ...this.props }
        element={ this.state.initialElProps }
        classes={ this.props.classes }
        open={ this.state.modalVisible }
        onClose={ this.handleCloseModal }
      />
    );
  }

  render() {
    console.log('render', this.props);
    // REFERENCE ADOBE FLASH OR OBS FOR ACTIONS
    // ADD MULTI SELECT/DRAGGING/ ETC
    // ADD LIST FOR CLASSES AND KEYFRAMES (MAYBE CATEGORIZE THEM FOR THEIR ACCESS)

    const { activeElement } = this.props;
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '20px',
        padding: '20px 0'
      }}>

        <div
          className="container"
          style={ {
            width: this.props.width,
            maxHeight: '100%',
            overflowY: 'auto',
            padding: '20px 0'
          } }
        >
          <div style={{ padding: '0px 20px 20px 20px' }}>
            <Button
              className="nv-btn"
              size="small"
              variant="contained"
              color="primary"
              onClick={ this.handleOpenModal }
            >
              + New Element
            </Button>
            <Button
              className="nv-btn"
              size="small"
              variant="contained"
              color="primary"
              disabled={ !_.isNumber(activeElement) }
              onClick={ () => { this.props.onClone(this.props.activeElement) } }
              style={ {
                width: '100%'
              } }
            >
              Clone Element
            </Button>
            [ADD NEW ELEMENT] [ADD NEW GROUP] [GROUP ELEMENTS]  [DELETE ELEMENT]
          </div>
          { this.renderAddNewElementContainer() }
          { this.renderElements() }
        </div>
      </div>
    );
  }
}
