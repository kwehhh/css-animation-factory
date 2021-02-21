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
      // Defaults
      classes: {},
      keyframes: {},
      elements: [],
      // Assign
      ...data,
      // activeElement: null,
      // FOR TESTING....
      activeElement: 0,
      activeKeyframes: null,
      // activeKeyframes: 'orbit',
      showElementContainer: true
    };

    // console.log('constructor', props, this.state);
    this.handleCloneElement = this.handleCloneElement.bind(this);
    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleSelectKeyframes = this.handleSelectKeyframes.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleUpdateClass = this.handleUpdateClass.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
    this.handleUpdateKeyframes = this.handleUpdateKeyframes.bind(this);
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

  handleSelectKeyframes(activeKeyframes) {
    console.log('handleSelectKeyframes', activeKeyframes);
    this.setState({activeKeyframes});
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
   * New/Update ....
   * @param {string} key - ...
   * @param {object|false} props - .... false = DELETE!!!
   */
  handleUpdateClass(key, props) {
    this.setState((prevState) => {
      const newClasses = {
        ...prevState.classes,
      };

      console.log('handleUpdateClass', newClasses, key, props);

      // delete
      if (props === false) {
        delete newClasses[key];
      // Add/ update
      } else {
        newClasses[key] = props;
      }

      return {
        classes: newClasses
      };
    });
  }

    /*
   * New/Update ....
   * @param {string} key - ...
   * @param {object|false} props - .... false = DELETE!!!
   */
  handleUpdateKeyframes(key, props) {
    this.setState((prevState) => {
      const newKeyframes = {
        ...prevState.keyframes,
      };

      // delete
      if (props === false) {
        delete newKeyframes[key];
      // Add/ update
      } else {
        newKeyframes[key] = props;
      }

      console.log('handleUpdateKeyframes', newKeyframes, key, props);

      return {
        keyframes: newKeyframes
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
    const { activeElement, classes, keyframes, elements } = this.state;

    const containerSpacing = 20;
    const elContainerWidth = 350;
    const elElementsContainerWidth = 180;


    const universalProps = {
      classes,
      keyframes,
      elements,
      onClassChange: this.handleUpdateClass,
      onKeyframesChange: this.handleUpdateKeyframes,
      onSelectKeyframes: this.handleSelectKeyframes
    };


    console.log('render', this.state);

    // TODO: Keep everything OBJ based for now even if possible performance issues. Easier for devs and to work with function wise. Later look into optimatial performacne.
    return (
      <div>
        <Helmet>
          <style>{ this.getDisplayCSS() }</style>
          <meta charSet="utf-8" />
          <title>CSS Animation Factory</title>
        </Helmet>
        <Preview
          { ...universalProps }
          leftBoundaryWidth={ containerSpacing + elElementsContainerWidth }
          rightBoundaryWidth={ _.isNumber(activeElement) ? containerSpacing + elContainerWidth : 0 }
        />
        <ElementsContainer
          { ...universalProps }
          activeElement={ activeElement }
          onClick={ this.handleSelectElement }
          onClone={ this.handleCloneElement }
          width={ elElementsContainerWidth }
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: '20px',
            padding: '20px 0'
          }}
        >
          <ElementEditor
            { ...universalProps }
            width={ elContainerWidth }
            element={ elements[activeElement] }
            elementProps={ elements[activeElement] }
            visible={ this.state.showElementContainer }
            onChange={ (props) => { this.handleUpdateElement(props, activeElement) } }
            onSubmit={ this.handleUpdateElements }
          />
        </div>
        <AnimationContainer
          { ...universalProps }
          keyframes={ this.state.keyframes[this.state.activeKeyframes] }
          element={ elements[activeElement] }
        />
      </div>
    );
  }
}
