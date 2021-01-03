import React from "react";
// import "./App.scss";

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
      <div
        className="stacking-10 container"        
        style={ {
          width: '100px',
          left: '20px',
        } }
      >
        { this.renderElements() }
        <div>
          [CLONE ELEMENT] [ADD NEW ELEMENT] [GROUP ELEMENTS] [ADD NEW GROUP] [DELETE ELEMENT]
        </div>

      </div>
    );
  }
}
