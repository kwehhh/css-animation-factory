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


  console.log('FN', props);
  const classes = useStyles();




  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState({
    name: '',
    classes: []
  });


  const handleChange = (results) => {



    const props = {
      ...config,
      ...results
    };


    console.log(props);


    setConfig(props);
  };


  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


//   <List>
//   <ListItem button>
//     <ListItemText primary="Phone ringtone" secondary="Titania" />
//   </ListItem>
//   <Divider />
//   <ListItem button>
//     <ListItemText primary="Default notification ringtone" secondary="Tethys" />
//   </ListItem>
// </List>

  return (
    <Dialog fullScreen open={ props.open} onClose={ props.onClose } TransitionComponent={Transition}>
    <AppBar className={classes.appBar}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={ props.onClose } aria-label="close">
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          Sound
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
      <div style={{display:'flex', flexGrow: '1'}}>
        <ElementEditor
          classes={ props.classes }
          onChange={ handleChange }
          elementProps={ config }
          style={{
            borderRadius: 0
          }}
        />
      </div>
      <div style={{display:'flex', flexGrow: '1'}}>2</div>
      <div style={{display:'flex', flexGrow: '1'}}>3</div>
    </div>

  </Dialog>
  );
}