import React from "react";
import {
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  MuiDialogTitle,
  MuiMuiDialogContent,
  MuiMuiDialogActions,
  Modal,
  Select,
  Slider,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  IconButton,
  CloseIcon
} from '@material-ui/core';

export default class EditFields extends React.Component {

  constructor() {
    super();

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(key, value) {
    if (this.props.onChange) {
      this.props.onChange(key, value);
    }
  }

  renderValueSlider({ key, value, label }) {
    return (
      <div>
        <TextField
          onChange={ (e) => { this.handleChange(key, e.target.value) } }
          value={ value }
          id={ key }
          label={ label } />
        <Slider
          onChange={
            (e, value) => { this.handleChange(key, `${value}px`) }
          }
          value={ parseInt(value, 10) }
          aria-labelledby="continuous-slider"
        />
      </div>
    );
  }

  render() {
    const {
      background,
      width,
      height
    } = this.props;

    console.log('render', this.props);

    return (
      <div>
        {
          this.renderValueSlider({
            key: 'width',
            value: width,
            label: 'Width'
          })
        }
        {
          this.renderValueSlider({
            key: 'height',
            value: height,
            label: 'Height'
          })
        }
        <TextField
          onChange={ (e) => { this.handleChange('background', e.target.value) } }
          value={ background }
          id="standard-basic"
          label="Background" />
      </div>
    );
  }
}