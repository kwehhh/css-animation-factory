import React from "react";

export default class Preview extends React.Component {

  constructor() {
    super();
    // this.state = {
    //   activeElement: null,
    //   // activeElement: 0,
    //   elements: [
    //     {
    //       name: 'ballz',
    //       css: '.ballz {\n  background: blue;\n  width: 50px;\n  height: 50px;\n}'
    //     },
    //     {
    //       name: 'two'
    //     }
    //   ],
    //   showElementContainer: true
    // };

    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
  }

  // getCSS() {
  //   let css = '';
  //   this.state.elements.forEach((element) => {
  //     // const { }
  //     if (element.css) {
  //       css = `${css}\n${element.css}`;
  //     }

  //   });

  //   return css;
  // }

 /**
   * // Extract to utils.....
   * @param {array}
   * @returns {string}
   */
  getClassNames(classes) {
    if (classes) {
      return classes.join(' ');
    }

    return '';
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

  renderElement(props, i) {
    const { elements, name, classes } = props;

    // console.log('renderElement', props);

    return (
      <div key={ `${name}-${i}` } className={ this.getClassNames(classes) }>
        { this.renderElements(elements) }
      </div>
    );
  }

  renderElements(elements) {
    if (elements) {
      return elements.map((element, i) => this.renderElement(element, i));
    }

    return null;
  }

  // Leftoundary/rightboundary defaiult = 0
  render() {
    const {
      leftBoundaryWidth,
      rightBoundaryWidth,
      elements,
      previewContainerWidth,
      topBoundaryHeight,
      style
    } = this.props;


    // console.log('render', this.props);

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: topBoundaryHeight || 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...style
        }}
        className="preview">
        { this.renderElements(elements) }
      </div>
    );
  }
}
