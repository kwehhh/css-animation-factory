import React from "react";
import {Helmet} from "react-helmet";
import AnimationContainer from './components/AnimationContainer.jsx';
import ElementEditor from './components/ElementEditor.jsx';
import ElementsContainer from './components/ElementsContainer.jsx';
import Preview from './components/Preview.jsx';
import { convertCamelToKebabCase } from '../util/StringUtil.js';
import "./App.scss";

export default class App extends React.Component {

  constructor(props) {
    super();

    const { data } = props;

    this.state = {
      ...data,
      // activeElement: null,
      activeElement: 0,
      // // CSS Classes
      // // Classes will be agnostic to elements, keeps true to orginal HTML/CSS Paradigms and also benefits of app flexibility
      // classes: {
      //   'animation-std': {
      //     animationName: 'orbit',
      //     animationDuration: '4s',
      //     animationIterationCount: 'infinite',
      //     animationDirection: 'normal',
      //     animationTimingFunction: 'linear'
      //   },
      //   ball: {
      //     position: 'absolute',
      //     borderRadius: '100%',
      //     background: 'blue',
      //     width: '50px',
      //     height: '50px'
      //   },
      //   classThree: {}
      // },
      // keyframes: {
      //   orbit: {
      //     '0%': {
      //       background: 'blue',
      //       transform: 'rotate(0deg) translateX(150px) rotate(0deg)',
      //     },
      //     '50%': {
      //       background: 'orange',
      //       transform: 'rotate(180deg) translateX(150px) rotate(-180deg)',
      //     },
      //     '100%': {
      //       background: 'blue',
      //       transform: 'rotate(360deg) translateX(150px) rotate(-360deg)'
      //     }
      //   }
      // },
      // // Each Element and Keyfreames
      // // TODO: Change to 'items', items can be 'element' or 'group' type
      // elements: [
      //   {
      //     name: 'ball',
      //     classes: ['animation-std', 'ball'],
      //   }
      // ],
      showElementContainer: true
    };

    console.log('constructor', props, this.state);
    this.handleCloneElement = this.handleCloneElement.bind(this);
    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleUpdateClass = this.handleUpdateClass.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
  }

  getCSSfromStyleObj(style, formatter) {
    let css = '';
    Object.keys(style).forEach((attr) => {
      // console.log(attr);
      if (formatter) {
        css += formatter(convertCamelToKebabCase(attr), style[attr]);
      } else {
        css += `${convertCamelToKebabCase(attr)}: ${style[attr]};\n`;
      }
    });

    return css;
  }



  // CSS goes into app HEAD STYLE tag
  getDisplayCSS() {
    const { classes, elements, keyframes } = this.state;
    let displayCSS = '';

    // Generate CSS from Elements
    if (elements) {
      elements.forEach((element) => {
        const { css, keyframes, name, props } = element;

        // // Convert props to CSS
        // if (props) {
        //   let block = props;
        //   if (!_.isString(props)) {
        //     block = this.getCSSfromStyleObj(props);
        //   }

        //   displayCSS += this.createCSSBlock(`.${name}`, block);
        // }

        // !! TODO: Extract Keyframes
        if (keyframes) {
          let block = keyframes;
          if (!_.isString(keyframes)) {
            block = this.getKeyframesCSS(name, keyframes);
          }

          displayCSS += this.createCSSBlock(`@keyframes ${name}`, block);
        }
      });
    }

    // Generate CSS from Classes
    if (classes) {
      Object.keys(classes).forEach((className) => {
        const block = this.getCSSfromStyleObj(classes[className]);
        displayCSS += this.createCSSBlock(`.${className}`, block);
      });
    }

    // Generate CSS from Keyframes
    if (keyframes) {
      Object.keys(keyframes).forEach((className) => {
        // const block = this.getCSSfromStyleObj(keyframes[className]);
        const block = this.getKeyframesCSS(className, keyframes[className]);
        // displayCSS += this.createCSSBlock(`.${className}`, block);
        displayCSS += this.createCSSBlock(`@keyframes ${className}`, block);
      });
    }

    // console.log('getDisplayCSS', displayCSS);
    return displayCSS;
  };

  // getCSSfromStyleObj(styleProps) {
  //   return this.getCSSfromStyleObj(styleProps);
  // }

  // here ....
  getElementCSS(name, style) {
    let css = '';
    // css += `.${name} {\n`;
    css += this.getCSSfromStyleObj(style);
    // css += `}\n`;

    return css;
  }

  createCSSBlock(blockName, cssBlock) {
    return `${blockName} {\n${cssBlock}}\n`;
  }

  getKeyframesCSS(name, keyframes) {
    let css = '';

    Object.keys(keyframes).forEach((keyframe, i) => {
      const formatter = (attr, value) => {
        return `  ${attr}: ${value};\n`;
      };

      if (i > 0) {
        css += '\n';
      }
      css += this.createCSSBlock(keyframe, this.getCSSfromStyleObj(keyframes[keyframe], formatter));

      // console.log('keyframeCSS', keyframeCSS, keyframe, keyframes, name);
    });



    // css = this.createCSSBlock(`@keyframes ${name}`, css);


    // css += `.${name} {\n`;
    // css += this.getCSSfromStyleObj(style);
    // css += `}\n`;

    // console.log('getKeyframesCSS', css);

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

  handleCloneElement(index) {
    this.setState((prevState) => {
      const prevElements = prevState.elements;
      // UPDATE: Actually maybe not, since you could use index position for UNIQUE
      // TODO: ACTUAL COPY If same name..., add a `+1`` to name
      const clonedElement = {
        ...prevElements[index]
      };
      const newElements = [
        ...prevElements,
        clonedElement
      ];

      return {
        elements: newElements
      };
    });
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

  /*
   * Updates props of an Obj
   * @param {any} value - new value for prop
   * @param {string} key - prop to change
   */
  handleUpdateClass(key, props) {






    this.setState((prevState) => {

      const newClasses = {
        ...prevState.classes,
      };


      newClasses[key] = props;




      // const newElements = [
      //   ...prevState.elements
      // ];

      // newElements[index] = {
      //   ...newElements[index],
      //   ...element
      // };





      return {
        classes: newClasses
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
    const { activeElement, classes, elements } = this.state;

    const containerSpacing = 20;
    const elContainerWidth = 350;
    const elElementsContainerWidth = 180;
    // const previewContainerWidth = elContainerWidth - containerSpacing;

    // TODO: Keep everything OBJ based for now even if possible performance issues. Easier for devs and to work with function wise. Later look into optimatial performacne.
    return (
      <div>
        <Helmet>
          <style>{ this.getDisplayCSS() }</style>
          <meta charSet="utf-8" />
          <title>CSS Animation Factory</title>
        </Helmet>
        <Preview
          classes={ classes }
          leftBoundaryWidth={ containerSpacing + elElementsContainerWidth }
          rightBoundaryWidth={ _.isNumber(activeElement) ? containerSpacing + elContainerWidth : 0 }
          elements={ elements } />
        <ElementsContainer
          activeElement={ activeElement }
          onClick={ this.handleSelectElement }
          onClone={ this.handleCloneElement }
          elements={ elements }
          width={ elElementsContainerWidth }
        />
        <ElementEditor
          classes={ classes }
          width={ elContainerWidth }
          elementProps={ elements[activeElement] }
          visible={ this.state.showElementContainer }
          onClassChange={ this.handleUpdateClass }
          onChange={ (props) => { this.handleUpdateElement(props, activeElement) } }
          onSubmit={ this.handleUpdateElements }
        />
        <AnimationContainer />
      </div>
    );
  }
}
