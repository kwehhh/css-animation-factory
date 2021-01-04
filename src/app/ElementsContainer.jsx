import React from "react";
import { Button } from '@material-ui/core';

export default class ElementSContainer extends React.Component {

  constructor() {
    super();
    this.state = {
      name: 'ball'
    };
  }

  renderElements() {
    // console.log('renderElements', this.props);
    return this.props.elements.map((element, i) => {
      
      if (element) {
        const { name } = element;
        // console.log(element);


        let className = '';
        let style = {};
        if (i === this.props.activeElement) {
          className = 'active';
          style = {
            background: 'red'
          };
        }

        return (
          <div 
            className={ className } 
            onClick={ () => { this.props.onClick(i) } }
            style={ style }
          >
            { name } [HIDE] [LOCK]
          </div>
        );
      }
    });
  }

  render() {
    // console.log(this.props);
    // REFERENCE ADOBE FLASH OR OBS FOR ACTIONS
    // ADD MULTI SELECT/DRAGGING/ ETC
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '20px',
        padding: '20px 0'
      }}>
          
        <div
          className="container"        
          style={ {
            width: '120px',
            maxHeight: '100%',
            overflowY: 'auto'
          } }
        >
          <div>
            <Button onClick={ () => { this.props.onClone(this.props.activeElement) } } color="primary">
              Clone Element
            </Button>
            [ADD NEW ELEMENT] [GROUP ELEMENTS] [ADD NEW GROUP] [DELETE ELEMENT]
          </div>
          { this.renderElements() }
        </div>
      </div>
    );
  }
}
