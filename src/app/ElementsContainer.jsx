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
        if (i === this.props.activeElement) {
          className = 'active';
        }

        return (
          <div 
            className={ className } 
            onClick={ () => { this.props.onClick(i) } }
          >
            { name }
          </div>
        );
      }
    });
  }

  render() {
    // console.log(this.props);
    return (
      <div
        className="stacking-10 container"        
        style={ {
          width: '100px',
          left: '20px',
        } }
      >
        { this.renderElements() }
      </div>
    );
  }
}
