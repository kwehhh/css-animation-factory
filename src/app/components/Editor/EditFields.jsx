import React from "react";
import {
  Slider,
  TextField,
} from '@material-ui/core';

export default class EditFields extends React.Component {

  constructor() {
    super();
    this.state = {
      sliderValues: {}
    };
    this._rafId = null;
    this._pending = null;

    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
  }

  componentWillUnmount() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this._pending = null;
  }

  handleChange(key, value) {
    if (this.props.onChange) {
      this.props.onChange(key, value);
    }
    if (this.props.onFocus) {
      this.props.onFocus();
    }
  }



  handleBlur() {
    // console.log('handleBlur', this.props);
    if (this.props.onBlur) {
      // TODO: Create some method to avoid triggering this if not needed
      // this.props.onBlur();
    }
  }

  handleFocus() {
    // console.log('handleFocus', this.props);
    if (this.props.onFocus) {
      this.props.onFocus();
    }
  }

  renderValueSlider({ key, value, label }) {
    const safeValue = value ?? '';
    const numeric = parseInt(String(safeValue || '').replace(/px$/, ''), 10);
    const hasNumber = Number.isFinite(numeric);
    const liveValue = this.state.sliderValues[key];
    const sliderValue = Number.isFinite(liveValue) ? liveValue : (hasNumber ? numeric : 0);

    // If this property isn't numeric (or missing), don't render a slider for it.
    // This avoids confusing "blank" inputs for classes like `animation-orbit`.
    if (!hasNumber) {
      return null;
    }

    return (
      <div>
        <TextField
          onBlur={ this.handleBlur }
          onFocus={ this.handleFocus }
          onChange={ (e) => { this.handleChange(key, e.target.value) } }
          value={ safeValue }
          id={ key }
          label={ label } />
        <Slider
          onChange={ (e, next) => {
            const nextNumber = Array.isArray(next) ? next[0] : next;
            if (Number.isFinite(nextNumber)) {
              this.setState((prevState) => ({
                sliderValues: { ...prevState.sliderValues, [key]: nextNumber }
              }));

              // Live update while dragging, throttled to animation frames.
              this._pending = { key, value: nextNumber };
              if (!this._rafId) {
                this._rafId = requestAnimationFrame(() => {
                  this._rafId = null;
                  const pending = this._pending;
                  this._pending = null;
                  if (pending) {
                    this.handleChange(pending.key, `${pending.value}px`);
                  }
                });
              }
            }
          } }
          onChangeCommitted={ (e, next) => {
            const nextNumber = Array.isArray(next) ? next[0] : next;
            if (Number.isFinite(nextNumber)) {
              // Ensure last committed value is applied.
              this.handleChange(key, `${nextNumber}px`);
            }
          } }
          value={ sliderValue }
          min={ 0 }
          max={ 400 }
          aria-labelledby="continuous-slider"
        />
      </div>
    );
  }

  render() {
    const {
      background,
      width,
      height,
      name,
      transform
    } = this.props;

    // console.log('render', this.props);

    return (
      <div>
        { name != null && (
          <div>
            <TextField
                onChange={ (e) => { this.handleChange('name', e.target.value) } }
                onBlur={ this.handleBlur }
                onFocus={ this.handleFocus }
                value={ name }
                id="name"
                label="Name" />
          </div>
        ) }
        <div style={{ background: 'var(--caf-surface-2)', padding: 10, borderRadius: 10, border: '1px solid var(--caf-border)' }} >
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
          { background != null && (
            <TextField
              onBlur={ this.handleBlur }
              onFocus={ this.handleFocus }
              onChange={ (e) => { this.handleChange('background', e.target.value) } }
              value={ background }
              id="standard-basic"
              label="Background" />
          ) }
          { transform != null && (
            <TextField
              onBlur={ this.handleBlur }
              onFocus={ this.handleFocus }
              onChange={ (e) => { this.handleChange('transform', e.target.value) } }
              value={ transform }
              id="transform"
              label="Transform" />
          ) }
        </div>
      </div>
    );
  }
}