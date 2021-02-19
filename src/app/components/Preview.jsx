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

  renderElements(elements) {
    return elements.map((element) => {
      const { name, classes } = element;

      // let classNames;
      // if (classes) {
      //   classNames = classes.join(' ');
      // }

      // console.log('renderElements', element);
      return (
        <div key={ name } className={ this.getClassNames(classes) } />
      );
    });
  }

  // Leftoundary/rightboundary defaiult = 0
  render() {
    const {
      leftBoundaryWidth,
      rightBoundaryWidth,
      elements,
      previewContainerWidth,
      style
    } = this.props;


    console.log('render', this.props);

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: '0',
          left: leftBoundaryWidth,
          bottom: '0',
          right: rightBoundaryWidth,
          ...style
        }}
        className="preview">
        { this.renderElements(elements) }
      </div>
    );
  }
}
