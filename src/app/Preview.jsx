import React from "react";

export default class Preview extends React.Component {

  constructor() {
    super();
    this.state = {
      activeElement: null,
      // activeElement: 0,
      elements: [
        {
          name: 'ballz',
          css: '.ballz {\n  background: blue;\n  width: 50px;\n  height: 50px;\n}'
        },
        {
          name: 'two'
        }
      ],
      showElementContainer: true
    };

    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
  }

  getCSS() {
    let css = '';
    this.state.elements.forEach((element) => {
      // const { }
      if (element.css) {
        css = `${css}\n${element.css}`;
      }
      
    });

    return css;
  }

  handleSelectElement(index) {
    this.setState((prevState) => {
      let activeElement;
      if (prevState.activeElement === index) {
        activeElement = null
      } else {
        activeElement = index;
      }

      return {
        activeElement
      }
    });
  }

  handleShowContainer() {
    this.setState({showElementContainer: true});
  }

  handleHideContainer() {
    this.setState({showElementContainer: false});
  }

  // new
  handleUpdateElements(element) {
    this.handleHideContainer();

    this.setState((prevState) => {
      return {
        elements: [
          ...prevState.elements,
          element
        ]
      };
    });
  }

  handleUpdateElement(element, index) {
    // this.handleHideContainer();

    this.setState((prevState) => {
      const newElements = [
        ...prevState.elements
      ];

      newElements[index] = {
        ...newElements[index],
        ...element
      };
      
      return {
        elements: newElements
      };
    });
  }

  renderElements() {
    return this.props.elements.map((element) => {
      const { name } = element;
      return (
        <div className={ name } />
      );
    });
  }

  render() {
    return (
      <div>
        { this.renderElements() }
      </div>
    );
  }
}
