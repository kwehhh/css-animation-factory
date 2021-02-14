import Divider from '@material-ui/core/Divider';
import React from 'react';
import EditFields from './EditFields.jsx';

export default class KeyframesEditor extends React.Component {

  render() {
    const { name, keyframes, ...props } = this.props;
    console.log('KeyframesEditor', name, keyframes);
    // TODO
    // 1) Make these shaped like rounded edge containers
    // 2) Way to make vertical slider with each point showing where each timeliner marker i to 100% (visual indicator)
    // 3) Collapse each keyframe
    return (
      <div className="stacking-20">
        {
          Object.keys(keyframes).map((keyframe) => {
            return (
              <EditFields
                key={ keyframe }
                name={ keyframe }
                { ...keyframes[keyframe] }
                { ...props }
              />
            );
          })
        }
        <Divider />
      </div>
    );
  }
}