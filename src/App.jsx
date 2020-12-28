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

    // start here
    const style = {
      position: 'relative',
      borderRadius: '100%',
      background: 'blue',
      width: '50px',
      height: '50px',
      animationName: 'ball',
      animationDuration: '4s',
      animationIterationCount: 'infinite',
      animationDirection: 'alternate'
    };

    const keyframes = {
      from: {
        top: '0px',
        background: 'green'
      },
      to: {
        width: '80px',
        height: '80px',
        top: '200px',
        background: 'blue'
      }
    };

    this.state = {
      // activeElement: null,
      activeElement: 0,
      elements: [
        {
          name: 'ball',
          css: this.getElementCSS('ball', style),
          keyframes: this.getKeyframesCSS('ball', keyframes),
          // ON INIT... CONVERT STYLE TO CSS DIRECTLY... (SEND THIS TO APP AS PROPS....)
          // style: {
          //   position: 'relative',
          //   background: 'blue',
          //   width: '50px',
          //   height: '50px',
          //   animationName: 'ball',
          //   animationDuration: '4s'
          // },
        
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

  convertCamelToKebabCase(str) {
    const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
// console.log(camelToSnakeCase('animationName')); // <--- convert obs to this format... for style
    return camelToSnakeCase(str);
  }

  getCSSfromStyleObj(style) {
    let css = '';
    Object.keys(style).forEach((attr) => {
      // console.log(attr);
      css += `  ${this.convertCamelToKebabCase(attr)}: ${style[attr]};\n`;
    });

    return css;
  }

  getCSS() {
    let css = '';
    this.state.elements.forEach((element) => {

      if (element.style) {
        css += `.${element.name} {\n`;
        css += this.getCSSfromStyleObj(element.style);
        css += '}';
      // deprecate
      } else if (element.css) {
        css = `${css}\n${element.css}`;
      }


      if (element.keyframes) {
        css += element.keyframes;
      }

      // // css
      // if (element.css) {
      //   css = `${css}\n${element.css}`;
      // }

      // animation
      // if (element && element.animation && element.animation.properties) {
      //   css += `.${element.name} { animation-name: ${element.name}; animation-duration: ${element.animation.properties.duration}; }`;
      // }

      // keyframes
      // if (element && element.animation && element.animation.keyframes) {
      //   css += `@keyframes ${element.name} { ${this.getKeyframes(element.animation.keyframes)} }`;
      // }
    });

    // console.log('getCSS', css);
    return css;
  };

  // getCSSfromStyleObj(styleProps) {
  //   return this.getCSSfromStyleObj(styleProps);
  // }

  // here ....
  getElementCSS(name, style) {
    let css = '';
    css += `.${name} {\n`;
    css += this.getCSSfromStyleObj(style);
    css += `}\n`; 

    return css;
  }

  createCSSBlock(blockName, cssBlock) {
    return `${blockName} {\n ${cssBlock} }`;
  }

  getKeyframesCSS(name, keyframes) {
    let css = '';

    Object.keys(keyframes).forEach((keyframe) => {
      css += this.createCSSBlock(keyframe, this.getCSSfromStyleObj(keyframes[keyframe]));

      // console.log('keyframeCSS', keyframeCSS, keyframe, keyframes, name);
    });



    css = this.createCSSBlock(`@keyframes ${name}`, css);


    // css += `.${name} {\n`;
    // css += this.getCSSfromStyleObj(style);
    // css += `}\n`; 

    console.log('getKeyframesCSS', css);

    return css;
  }

  getElementCSSKeyframes() {

  }

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

    const containerSpacing = 20;
    const elContainerWidth = 350;
    const previewContainerWidth = elContainerWidth - containerSpacing;


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
          elContainerWidth={ elContainerWidth }
          elementProps={ elements[activeElement] }
          visible={ this.state.showElementContainer } 
          onChange={ (props) => { this.handleUpdateElement(props, activeElement) } }
          onSubmit={ this.handleUpdateElements } 
        />
        <AnimationContainer />
        <Preview previewContainerWidth={ previewContainerWidth } elements={ elements }  />
      </div>
    );
  }
}
