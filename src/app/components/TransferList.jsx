import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 'auto',
  },
  cardHeader: {
    padding: theme.spacing(1, 2),
  },
  list: {
    width: 200,
    height: 230,
    backgroundColor: theme.palette.background.paper,
    overflow: 'auto',
  },
  button: {
    margin: theme.spacing(0.5, 0),
  },
}));

function not(a, b) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a, b) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

function union(a, b) {
  return [...a, ...not(b, a)];
}

export default function TransferList(props) {
  const classes = useStyles();
  const [checked, setChecked] = React.useState([]);


  
  const assigned = [];
  const unassigned = [];
  const keyMap = [];
  Object.keys(props.classes).forEach((item, i) => {
    console.log(item, i);

    keyMap.push(item);
    if (props.setClasses.indexOf(item) !== -1) {
      assigned.push(i);
    } else {
      unassigned.push(i);
    }
  });

  




  // Unassigned Classes
  const [left, setLeft] = React.useState(unassigned);
  // Assigned Classes
  const [right, setRight] = React.useState(assigned);


  console.log('TransferList', left, right, keyMap, props);

  // const [left, setLeft] = React.useState([0, 1, 2, 3]);
  // const [right, setRight] = React.useState([4, 5, 6, 7]);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const numberOfChecked = (items) => intersection(checked, items).length;

  const handleToggleAll = (items) => () => {
    if (numberOfChecked(items) === items.length) {
      setChecked(not(checked, items));
    } else {
      setChecked(union(checked, items));
    }
  };


  const handleChange = (type) => {
    let assigned;
    if (type) {
      if (type === 'right') {
        assigned = right.concat(leftChecked);
        setRight(assigned);
        setLeft(not(left, leftChecked));
        setChecked(not(checked, leftChecked));
    
        
      } else if (type === 'left') {
        assigned = not(right, rightChecked);
        setLeft(left.concat(rightChecked));
        setRight(assigned);
        setChecked(not(checked, rightChecked));
      }

      const assignedNames = assigned.map((item) => {
        return keyMap[item];
      });

      // console.log('assignedNames', assignedNames);
      props.onChange(assignedNames);
    }


  };

  const handleCheckedRight = () => {
    const assigned = right.concat(leftChecked);
    setRight(assigned);
    setLeft(not(left, leftChecked));
    setChecked(not(checked, leftChecked));

    props.onChange(assigned);
  };

  // combine with top ^
  const handleCheckedLeft = () => {
    const assigned = not(right, rightChecked);
    setLeft(left.concat(rightChecked));
    setRight(assigned);
    setChecked(not(checked, rightChecked));

    props.onChange(assigned);
  };



  // TODO: For each Item, Show tooltip describing what the class contains so their is direction what it does
  const customList = (title, items) => (
    <Card>
      <CardHeader
        className={classes.cardHeader}
        avatar={
          <Checkbox
            onClick={handleToggleAll(items)}
            checked={numberOfChecked(items) === items.length && items.length !== 0}
            indeterminate={numberOfChecked(items) !== items.length && numberOfChecked(items) !== 0}
            disabled={items.length === 0}
            inputProps={{ 'aria-label': 'all items selected' }}
          />
        }
        title={title}
        subheader={`${numberOfChecked(items)}/${items.length} selected`}
      />
      <Divider />
      <List className={classes.list} dense component="div" role="list">
        {items.map((value) => {
          const labelId = `transfer-list-all-item-${value}-label`;

          return (
            <ListItem key={value} role="listitem" button onClick={handleToggle(value)}>
              <ListItemIcon>
                <Checkbox
                  checked={checked.indexOf(value) !== -1}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={ keyMap[value] } />
            </ListItem>
          );
        })}
        <ListItem />
      </List>
    </Card>
  );

  return (
    <Grid container spacing={2} justify="center" alignItems="center" className={classes.root}>
      <Grid item>{customList('Unassigned Classes', left)}</Grid>
      <Grid item>
        <Grid container direction="column" alignItems="center">
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={ () => { handleChange('right') } }
            disabled={leftChecked.length === 0}
            aria-label="move selected right"
          >
            &gt;
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={ () => { handleChange('left') } }
            disabled={rightChecked.length === 0}
            aria-label="move selected left"
          >
            &lt;
          </Button>
        </Grid>
      </Grid>
      <Grid item>{customList('Assigned Classes', right)}</Grid>
    </Grid>
  );
}
