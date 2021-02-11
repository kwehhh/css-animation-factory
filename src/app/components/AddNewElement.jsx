import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
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

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function FullScreenDialog(props) {


  console.log('AddNewElement/FullScreenDialog', props);
  const classes = useStyles();




  const [open, setOpen] = React.useState(false);

  const newClass = 'myNewClass';

  // Initial State for New Element
  const [config, setConfig] = React.useState({
    name: '',
    classes: [newClass]
  });

  // Initial State for New ...
  const [newElClass, setNewElClass] = React.useState({
    [newClass]: {}
  });


  // Initial State for New ...
  const [newClassProps, setNewClassProps] = React.useState({});

  const handleChange = (className, classProps) => {
    const props = {
      ...config,
      ...classProps
    };

    console.log('handleChange', className, classProps, config);


    setConfig(props);
  };

  const handleClassChange = (className, classProps) => {
    // const props = {
    //   ...newElClass,
    //   ...classProps
    // };

    const props = {
      ...newClassProps,
      ...classProps
    };

    console.log('handleClassChange', props, className, classProps, newClassProps);

    setNewClassProps(props);
  };

  const leftBoundary = 300;

  return (
    <Dialog fullScreen open={ props.open} onClose={ props.onClose } TransitionComponent={Transition}>
    <AppBar className={classes.appBar}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={ props.onClose }
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          Add New Element
        </Typography>
        <Button autoFocus color="inherit" onClick={ props.onClose }>
          save
        </Button>
      </Toolbar>
    </AppBar>
    <div style={{
      display: 'flex',
      flex: '1'
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
            ...props.classes,
            [newClass]: newClassProps
          } }
          onChange={ handleChange }
          onClassChange={ handleClassChange }
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
        classes={ classes }
        elements={ [config] } />
      <div style={{display:'flex', flexGrow: '1'}}>3</div>
    </div>

  </Dialog>
  );
}