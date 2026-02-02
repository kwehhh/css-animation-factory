import React from 'react';
import { FullPageModal, Layout } from '@unfocused/nurvus-ui';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import ElementEditor from './ElementEditor.jsx';
import Preview from './Preview.jsx';

const newClass = 'myNewClass';

export default class AddNewElement extends React.Component {

  constructor(props) {
    super();

    const { element } = props;

    const localProps = {
      width: '50px',
      height: '50px',
      background: 'red',
      borderRadius: '10px'
    };

    this.state = {
      // Initial State for New Element
      element,
      config: {
        name: props.name,

        classes: [newClass]
      },
      // borrowed from:
      // https://css-tricks.com/making-css-animations-feel-natural/
      keyframes: {
        '0%':   { transform: 'scale(1,1)      translateY(0)' },
        '10%':  { transform: 'scale(1.1,.9)   translateY(0)' },
        '30%':  { transform: 'scale(.9,1.1)   translateY(-100px)' },
        '50%':  { transform: 'scale(1.05,.95) translateY(0)' },
        '57%':  { transform: 'scale(1,1)      translateY(-7px)' },
        '64%':  { transform: 'scale(1,1)      translateY(0)' },
        '100%': { transform: 'scale(1,1)      translateY(0)' }
      },
      // Initial State for New ...
      // Set these props as default...
      newClassProps: localProps
    };

    // Need to lift this up so there is no double render
    // Init
    // props.onClassChange(newClass, localProps);


    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  // Change to Element
  handleChange(newProp) {
    const props = {
      ...config,
      ...newProp
    };

    // console.log('handleChange');
    // setConfig(props);
    // this.setState({config: props});
  };


  // Change to Classes -- this is the only thing that links to Preview live CSS
  handleClassChange(className, classProps) {
    const { newClassProps } = this.state;
    const localProps = {
      ...newClassProps,
      ...classProps
    };

    // set to globall....
    this.props.onClassChange(className, localProps);
  };

  render() {
    const leftBoundary = 300;
    const { config, newClassProps } = this.state;
    const { keyframes, ...props } = this.props;

    const headerHeight = '60px';

    return (
      <FullPageModal
        visible={ this.props.open }
        title="Add New Element"
        headerActions={ (
          <Layout itemSpacing={ 0 } display="flex">
            <Button autoFocus color="inherit" onClick={ this.props.onClose }>
              Save
            </Button>
            <IconButton
              edge="start"
              color="inherit"
              onClick={ this.props.onClose }
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Layout>
        ) }
      >
        <div style={{
          display: 'flex',
          flex: '1',
          top: headerHeight,
          bottom: 0,
          position: 'absolute',
          left: 0,
          right: 0
        }}>
          <div style={{
            display:'flex',
            flexGrow: '1',
            minWidth: leftBoundary,
            maxWidth: leftBoundary
            }}>
            <ElementEditor
              { ...props }
              classes={ {
                ...this.props.classes
              } }
              keyframes={
                {
                  ...keyframes,
                 [newClass]: this.state.keyframes
                }
              }
              onChange={ this.handleChange }
              onClassChange={ this.handleClassChange }
              elementProps={ config }
              width={ leftBoundary }
              style={{
                borderRadius: 0
              }}
            />
          </div>
          <Preview
            leftBoundaryWidth={ leftBoundary }
            rightBoundaryWidth={ 0 }
            elements={ [this.state.element] }
          />
        </div>
      </FullPageModal>
    );
  }
}
