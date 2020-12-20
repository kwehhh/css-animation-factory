import React from "react";
import {Helmet} from "react-helmet";
import AnimationContainer from './app/AnimationContainer.jsx';
import ElementContainer from './app/ElementContainer.jsx';
import ElementsContainer from './app/ElementsContainer.jsx';
import Preview from './app/Preview.jsx';
import "./App.scss";

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      // activeElement: null,
      activeElement: 0,
      elements: [
        {
          name: 'ball',
          css: '.ball {\n  background: blue;\n  width: 50px;\n  height: 50px;\n}',
          animation: {
            properties: {},
            keyframes: [
              'from {top: 0px;}',
              'to {top: 200px;}'
            ]
          }
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

  render() {
    const { activeElement, elements } = this.state;

    return (
      <div>    
        <Helmet>
          <style>{ this.getCSS() }</style>
          <meta charSet="utf-8" />
          <title>CSS Animation Factory</title>
        </Helmet>
        <ElementsContainer 
          activeElement={ activeElement }
          onClick={ this.handleSelectElement }
          elements={ elements } 
        />
        <ElementContainer 
          elementProps={ elements[activeElement] }
          visible={ this.state.showElementContainer } 
          onChange={ (props) => { this.handleUpdateElement(props, activeElement) } }
          onSubmit={ this.handleUpdateElements } 
        />
        <AnimationContainer />
        <Preview elements={ elements }  />
      </div>
    );
  }
}
