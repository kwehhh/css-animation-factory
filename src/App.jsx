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
          css: '.ball {\n  position: relative; background: blue;\n  width: 50px;\n  height: 50px;\n}',
          style: {
            position: 'relative',
            background: 'blue',
            width: '50px',
            height: '50px',
            animationName: 'ball',
            animationDuration: '4s'
          },
        
          // flatten to soemthing like that...
          // name,
          // css,
          // duration,
          // keyframes,
          
          animation: {
            properties: {
              name: 'ball',
              duration: '4s'
            },
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

  convertCamelToKebabCase() {
    const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
console.log(camelToSnakeCase('animationName')); // <--- convert obs to this format... for style
  }

  convertStylePropsToStr(style) {
    let css = '';
    Object.keys(style).forEach((attr) => {
      // console.log(attr);
      css += `${attr}: ${style[attr]};`;
    });

    return css;
  }

  getCSS() {
    let css = '';
    this.state.elements.forEach((element) => {

      if (element.style) {
        css += `.${element.name} {`;
        css += this.convertStylePropsToStr(element.style);
        css += '}';
      // deprecate
      } else if (element.css) {
        css = `${css}\n${element.css}`;
      }

      // // css
      // if (element.css) {
      //   css = `${css}\n${element.css}`;
      // }

      // animation
      if (element && element.animation && element.animation.properties) {
        css += `.${element.name} { animation-name: ${element.name}; animation-duration: ${element.animation.properties.duration}; }`;
      }

      // keyframes
      if (element && element.animation && element.animation.keyframes) {
        css += `@keyframes ${element.name} { ${this.getKeyframes(element.animation.keyframes)} }`;
      }
    });

    console.log('getCSS', css);
    return css;
  };

    getKeyframes(keyframes) {
    let css = '';
    keyframes.forEach((keyframe) => {
      css += keyframe;
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
