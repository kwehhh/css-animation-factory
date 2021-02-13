import { Edit } from '@material-ui/icons';
import React from 'react';
import EditFields from './EditFields.jsx';

export default class KeyframesEditor extends React.Component {

  render() {
    const { name, keyframes } = this.props;
    console.log('KeyframesEditor', name, keyframes);
    return <EditFields { ...this.props } />;
  }
}