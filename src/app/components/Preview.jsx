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

  handleElementPointerDown = (e, path) => {
    // Stop here so only the innermost element under the pointer is selected.
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
        // Lets the timelines map a running animation back to its layer.
        'data-caf-path': nextPath.join('-'),
        // Isolation mode shows only this layer (see IsolationBar.scss).
        'data-caf-isolated': this.isIsolated(nextPath) ? '' : undefined,
        // ONE event per press (mouse, touch and pen). Binding mousedown + click
        // (+ touchstart) selected on press and then again on release, and the
        // second select toggled it straight back off.
        onPointerDown: (e) => this.handleElementPointerDown(e, nextPath)
      },
      this.renderElements(elements, nextPath)
    );
  }

  isIsolated(path) {
    const { isolatedPath } = this.props;
    return !!(isolatedPath && isolatedPath.length) && path.join('-') === isolatedPath.join('-');
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
      isolatedPath,
      fitting,
      style
    } = this.props;
    const isolating = !!(isolatedPath && isolatedPath.length);


    return (
      <div
        ref={ this.props.rootRef }
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
        className={ `preview${isolating ? ' is-isolating' : ''}${fitting ? ' is-fitting' : ''}` }>
        { this.renderElements(elements) }
      </div>
    );
  }
}
