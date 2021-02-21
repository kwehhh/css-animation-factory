import Divider from '@material-ui/core/Divider';
import React from 'react';
import EditFields from './EditFields.jsx';

export default class KeyframesEditor extends React.Component {

  constructor() {
    super();

    this.handleKeyframeUpdate = this.handleKeyframeUpdate.bind(this);
  }


  handleKeyframeUpdate(id, attr, value) {
    const { name, keyframes } = this.props;
    const newKeyframe = {
      ...keyframes[id],
      [attr]: value
    };
    const newKeyframes = {
      ...keyframes,
      [id]: newKeyframe
    };

    console.log('handleKeyframeUpdate', name, newKeyframes, id, attr, value);
    this.props.onKeyframesChange(name, newKeyframes);
  }

  render() {
    const { name, keyframes, ...props } = this.props;
    // console.log('KeyframesEditor', name, this.props);





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
                onBlur={ () => { this.props.onSelectKeyframes(null); } }
                onFocus={ () => { this.props.onSelectKeyframes(name); } }
                onChange={ (attr, value) => { this.handleKeyframeUpdate(keyframe, attr, value) } }
                { ...keyframes[keyframe] }
              />
            );
          })
        }
        <Divider />
      </div>
    );
  }
}