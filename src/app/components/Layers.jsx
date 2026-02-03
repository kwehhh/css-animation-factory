import React from "react";
import _ from 'lodash';
import { Layout, Menu, Text } from '@unfocused/nurvus-ui';
import { Tooltip } from '@material-ui/core';
import AddNewElement from './AddNewElement.jsx';
import AddIcon from '@material-ui/icons/Add';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import RemoveRedEyeIcon from '@material-ui/icons/RemoveRedEye';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import IconButton from '@material-ui/core/IconButton';

const NEW_EL_NAME = 'myNewElement';
const NEW_CLASS_NAME = 'myNewClass';
const NEW_KEYFRAMES_NAME = 'myNewKeyframes';

export default class Layers extends React.Component {

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
    // Assign temp vals to CSS builder
    this.props.onKeyframesChange(NEW_CLASS_NAME, false);
    this.props.onClassChange(NEW_KEYFRAMES_NAME, false);
    this.setState({modalVisible: false});
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

  getMenuItems(elements, path = []) {
    if (elements) {
      return elements.map((item, i) => {
        const nextPath = [...path, i];
        return {
          ...item,
          label: item.name,
          path: nextPath,
          items: this.getMenuItems(item.elements, nextPath)
        }
      });
    }

    return [];

  }

  render() {
    // console.log('render', this.props);
    // REFERENCE ADOBE FLASH OR OBS FOR ACTIONS
    // ADD MULTI SELECT/DRAGGING/ ETC
    // ADD LIST FOR CLASSES AND KEYFRAMES (MAYBE CATEGORIZE THEM FOR THEIR ACCESS)
    const { activeElement, elements } = this.props;
    const overflowStyle = {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    };

    const itemRenderer = (item) => {
      const { label, hidden, path } = item;
      const handleToggleHidden = (e) => this.props.onToggleHidden?.(e, path);
      const handleRemove = (e) => this.props.onRemove?.(e, path);

      return (
        <Layout display="flex" alignItems="center" justifyContent="space-between">
          <Text className="caf-text-xs" style={ overflowStyle }>{ label }</Text>
          <Layout display="flex" alignItems="center" justifyContent="space-between">
            <IconButton className="caf-iconbtn-xs" size="small" onClick={ handleToggleHidden }>
              { hidden ? <VisibilityOffIcon fontSize="small" /> : <RemoveRedEyeIcon fontSize="small" /> }
            </IconButton>
            <IconButton className="caf-iconbtn-xs" size="small" onClick={ handleRemove } title="Remove">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton className="caf-iconbtn-xs" size="small" onClick={ (e) => e.stopPropagation() } title="Lock (stub)">
              <LockOpenIcon fontSize="small" />
            </IconButton>
          </Layout>
        </Layout>
      );
    };

    return (
      <div
        className="container"
        style={ {
          width: this.props.width,
          maxHeight: '100%',
          overflowY: 'auto',
          padding: 'var(--caf-space-16) var(--caf-space-0)'
        } }
      >
        <div style={{ padding: 'var(--caf-space-0) var(--caf-space-16) var(--caf-space-16) var(--caf-space-16)' }}>
          <Layout>
            <div className="caf-title">Layers</div>
            <Layout display="flex" alignItems="center" itemSpacing={ 0 }>
              <Tooltip title="JSON Data">
                <span style={{ display: 'inline-flex' }}>
                  <IconButton
                    className="caf-iconbtn-nav"
                    size="small"
                    onClick={ (e) => e.stopPropagation() }
                    aria-label="JSON Data"
                  >
                    <DesktopWindowsIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Add New Element">
                <span style={{ display: 'inline-flex' }}>
                  <IconButton
                    className="caf-iconbtn-nav"
                    size="small"
                    onClick={ this.handleOpenModal }
                    aria-label="Add New Element"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Clone Selected Layer">
                <span style={{ display: 'inline-flex' }}>
                  <IconButton
                    className="caf-iconbtn-nav"
                    size="small"
                    onClick={ this.props.onClone }
                    disabled={ !this.props.activePath.length }
                    aria-label="Clone Selected Layer"
                  >
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Layout>
          </Layout>
          {/* [ADD NEW GROUP] [GROUP EL EMENTS]  [DELETE ELEMENT] */}
        </div>
        <Menu
          activePath={ this.props.activePath }
          items={ this.getMenuItems(elements) }
          itemRenderer={ itemRenderer }
          onClick={ (e, path) => this.props.onClick(path) }
        />
        { this.renderAddNewElementContainer() }
      </div>
    );
  }
}
