import React from "react";

export default class Preview extends React.Component {

  constructor() {
    super();

    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
  }


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

  handleElementClick = (e, path) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (this.props.onSelectElement) {
      this.props.onSelectElement(path);
    }
  }

  renderElement(props, i, path = []) {
    const { elements, tag = 'div', attributes = {}, classes, hidden } = props;

    if (hidden) {
      return null;
    }

    const nextPath = [...path, i];
    // An element can be ANY DOM/SVG node: `tag` (default 'div') + arbitrary
    // `attributes` (id, d, viewBox, points, transform, …). React switches to
    // the SVG namespace automatically for svg/g/path/etc.
    return React.createElement(
      tag,
      {
        // Key MUST be stable across renames to avoid remounting and restarting CSS animations.
        key: `path-${nextPath.join('-')}`,
        className: this.getClassNames(classes),
        ...attributes,
        onClick: (e) => this.handleElementClick(e, nextPath),
        onMouseDown: (e) => this.handleElementClick(e, nextPath),
        onTouchStart: (e) => this.handleElementClick(e, nextPath)
      },
      this.renderElements(elements, nextPath)
    );
  }

  renderElements(elements, path = []) {
    if (elements) {
      return elements.map((element, i) => this.renderElement(element, i, path));
    }

    return null;
  }

  // Leftoundary/rightboundary defaiult = 0
  render() {
    const {
      leftBoundaryWidth,
      rightBoundaryWidth,
      bottomBoundaryHeight,
      elements,
      topBoundaryHeight,
      style
    } = this.props;


    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: topBoundaryHeight || 0,
          left: leftBoundaryWidth || 0,
          right: rightBoundaryWidth || 0,
          bottom: bottomBoundaryHeight || 0,
          width: '100%',
          height: '100%',
          ...style
        }}
        className="preview">
        { this.renderElements(elements) }
      </div>
    );
  }
}
