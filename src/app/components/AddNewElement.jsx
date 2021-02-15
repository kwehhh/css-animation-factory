import React from 'react';
// import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import ElementEditor from './ElementEditor.jsx';
import Preview from './Preview.jsx';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

    console.log('handleChange');
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

    console.log('handleClassChange', localProps, className, classProps, newClassProps);

    // set to globall....
    this.props.onClassChange(className, localProps);
    // set to local
    // setNewClassProps(localProps);
    // this.setState({newClassProps: localProps});
  };

  render() {
    // console.log('render', this.props);

    const leftBoundary = 300;
    const { config, newClassProps } = this.state;
    const { keyframes, ...props } = this.props;

    const headerHeight = '60px';

    return (
      <Dialog fullScreen open={ this.props.open} onClose={ this.props.onClose } TransitionComponent={Transition}>
        <AppBar style={{
          height: headerHeight,
          position: 'relative'
          }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={ this.props.onClose }
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6">
              Add New Element
            </Typography>
            <Button autoFocus color="inherit" onClick={ this.props.onClose }>
              save
            </Button>
          </Toolbar>
        </AppBar>
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
            style={{background: 'black'}}
          />
          <div style={{display:'flex', flexGrow: '1'}}>3</div>
        </div>
      </Dialog>
    );
  }
}