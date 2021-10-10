import React from "react";
import _ from 'lodash';
import { Tooltip } from '@material-ui/core';
import { Button, ButtonGroup } from '@nurvus/ui';
import AddNewElement from './AddNewElement.jsx';
import AddIcon from '@material-ui/icons/Add';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import RemoveRedEyeIcon from '@material-ui/icons/RemoveRedEye';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import IconButton from '@material-ui/core/IconButton';

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

  renderElement(props, i) {
    console.log('renderElement', props);

    if (props) {
      const { elements, name } = props;
      let className = '';
      let style = {};
      if (i === this.props.activeElement) {
        className = 'active';
        style = {};
      }

      // TODO: Add Title label on top "ELEMENTS"
      return (
        <div
          key={ i }
          className={ `menu-item ${className}` }
          onClick={ () => { this.props.onClick(i) } }
          style={ {
            padding: '5px 20px',
            alignItems: 'center',
            justifyContent: 'space-between',
            display:'flex',
            flexDirection: 'column',
            ...style
          } }
        >
          <div className="item flex-20" style={{ display: 'flex' }}>
            <div style={{ display: 'flex' }}>
              { name }
            </div>
            <div className="flex-0" style={{display:'flex'}}>
              <Tooltip title="Hide Element">
                <IconButton
                  edge="start"
                  color="inherit"
                  size="small"
                >
                  <RemoveRedEyeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lock Element">
                <IconButton
                  edge="start"
                  color="inherit"
                  size="small"
                >
                  <LockOpenIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          { this.renderElements(elements) }
        </div>
      );
    }

    return null;
  }

  renderElements(elements) {
    console.log('renderElements', elements);

    if (elements) {
      return (
        <div className="elements">
          { elements.map((element, i) => this.renderElement(element, i)) }
        </div>
      );
    }

    return null;
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
    // console.log('render', this.props);
    // REFERENCE ADOBE FLASH OR OBS FOR ACTIONS
    // ADD MULTI SELECT/DRAGGING/ ETC
    // ADD LIST FOR CLASSES AND KEYFRAMES (MAYBE CATEGORIZE THEM FOR THEIR ACCESS)

    const { activeElement, elements } = this.props;
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
            <ButtonGroup>
              <Tooltip title="Add New Element">
                <Button onClick={ this.handleOpenModal }>
                  <AddIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Clone Selected Element">
                <Button onClick={ () => { this.props.onClone(this.props.activeElement) } } disabled={ !_.isNumber(activeElement) }>
                  <FileCopyIcon />
                </Button>
              </Tooltip>
            </ButtonGroup>
            {/* [ADD NEW GROUP] [GROUP EL EMENTS]  [DELETE ELEMENT] */}
          </div>
          { this.renderAddNewElementContainer() }
          { this.renderElements(elements) }
        </div>
      </div>
    );
  }
}
