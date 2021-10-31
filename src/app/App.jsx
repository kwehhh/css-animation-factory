import React from "react";
import { Helmet } from "react-helmet";
import { Menu, Layout, Link } from '@nurvus/ui';
import { Drawer } from '@material-ui/core';
import AnimationContainer from './components/AnimationContainer/AnimationContainer.jsx';
import ElementEditor from './components/ElementEditor.jsx';
import Layers from './components/Layers.jsx';
import Preview from './components/Preview.jsx';
import { convertCamelToKebabCase } from '../util/StringUtil.js';
import "./App.scss";
import { constant } from "lodash";

export default class App extends React.Component {

  constructor(props) {
    super();

    const { data } = props;
    this.state = {
      // Current Selected Layer/Element
      activePath: [],
      // activePath: [0, 0, 0],
      // Defaults
      classes: {},
      keyframes: {},
      elements: [],
      // Assign
      ...data,
      // activeElement: null,
      // FOR TESTING....
      activeElement: 0,
      activeKeyframesId: null,
      // activeKeyframesId: 'orbit',
      showElementContainer: true,
      showPresets: false,
    };

    // console.log('constructor', props, this.state);
    this.handleCloneElement = this.handleCloneElement.bind(this);
    this.handleSelectElement = this.handleSelectElement.bind(this);
    this.handleSelectKeyframes = this.handleSelectKeyframes.bind(this);
    this.handleShowContainer = this.handleShowContainer.bind(this);
    this.handleHideContainer = this.handleHideContainer.bind(this);
    this.handleShowPresets = this.handleShowPresets.bind(this);
    this.handleHidePresets = this.handleHidePresets.bind(this);
    this.handleUpdateClass = this.handleUpdateClass.bind(this);
    this.handleUpdateElements = this.handleUpdateElements.bind(this);
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
    this.handleUpdateKeyframes = this.handleUpdateKeyframes.bind(this);
  }

  /**
   *
   * @param {*} path
   * @param {*} elements
   * @returns {object|null}
   */
  getActiveElement(path, elements) {
    if (path.length) {
      const element = path.reduce((nextElement, index) => {
        return nextElement.elements[index];
      }, { elements });

      // console.log('getActiveElement', element, path, elements);
      return element;
    }

    return null;
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

  // Fetch JSON Preset
  componentDidMount() {
    const file = `data/${this.props.manifest.files[0]}`;
    const data = fetch(file).then(res => res.json()).then(data => {
      this.setState(prevState => {
        return {
          ...prevState,
          ...data
        }
      });
    });
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

  cloneInsertion(elements = [], path = []) {
    if (path.length) {
      const [index, ...nextPath] = path;
      const newElements = [...elements];
      const refElement = newElements[index];
      const extraProps = refElement.elements ? { elements: this.cloneInsertion(refElement.elements, nextPath) } : {};
      const newElement = {
        ...refElement,
        ...extraProps
      };
      newElements[index] = newElement;

      // Clone Element
      if (path.length === 1) {
        newElements.push(newElement);
      }

      return newElements;
    }

    return elements;
  }

  handleCloneElement() {
    this.setState((prevState) => {
      return {
        elements: this.cloneInsertion(prevState.elements, prevState.activePath)
      };
    });
  }

  /**
   * New/Update ....
   * @param {array} path - ...
   */
   handleSelectElement(path) {
    console.log('handleSelectElement', path);

    let activePath = path;
    if (activePath.join('') === this.state.activePath.join('')) {
      activePath = [];
    }

    this.setState({
      activePath
    });
  }

  handleSelectKeyframes(activeKeyframeId) {
    console.log('handleSelectKeyframes', activeKeyframeId);
    this.setState({activeKeyframeId});
  }

  handleShowContainer() {
    this.setState({showElementContainer: true});
  }

  handleHideContainer() {
    this.setState({showElementContainer: false});
  }

  handleShowPresets() {
    this.setState({showPresets: true});
  }

  handleHidePresets() {
    this.setState({showPresets: false});
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

 /**
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
    const { activeElement, activePath, classes, keyframes, elements } = this.state;
    console.log('render', {
      state: this.state,
      props: this.props
    });

    const containerSpacing = 20;
    const elContainerWidth = 350;
    const elElementsContainerWidth = 180;
    const commonProps = {
      activePath,
      classes,
      keyframes,
      elements,
      onClassChange: this.handleUpdateClass,
      onKeyframesChange: this.handleUpdateKeyframes,
      onSelectKeyframes: this.handleSelectKeyframes
    };

    return (
      <div>
        <Helmet>
          <style>{ this.getDisplayCSS() }</style>
          <meta charSet="utf-8" />
        </Helmet>
        <div style={{
          height: 30,
          position: 'fixed',
          background: '#403960',
          color: 'white',
          width: '100%',
          padding: '5px 10px'
        }}>
          <Layout display="flex" alignItems="center" justifyContent="space-between">
            <div>CSS Animation Factory</div>
            <Link onClick={ this.handleShowPresets }>Presets</Link>
          </Layout>
        </div>
        <Preview
          { ...commonProps }
          leftBoundaryWidth={ containerSpacing + elElementsContainerWidth }
          rightBoundaryWidth={ _.isNumber(activeElement) ? containerSpacing + elContainerWidth : 0 }
        />
        <div style={{
        position: 'absolute',
        top: 30,
        bottom: 0,
        left: '20px',
        padding: '20px 0'
      }}>
        <Layers
          { ...commonProps }
          activeElement={ activeElement }
          onClick={ this.handleSelectElement }
          onClone={ this.handleCloneElement }
          width={ elElementsContainerWidth }
        />
      </div>
        <div
          style={{
            position: 'absolute',
            top: 30,
            bottom: 0,
            right: '20px',
            padding: '20px 0'
          }}
        >
          <ElementEditor
            { ...commonProps }
            width={ elContainerWidth }
            element={ this.getActiveElement(activePath, elements) }
            elementProps={ this.getActiveElement(activePath, elements) }
            visible={ this.state.showElementContainer }
            onChange={ (props) => { this.handleUpdateElement(props, activeElement) } }
            onSubmit={ this.handleUpdateElements }
          />
        </div>
        <AnimationContainer
          { ...commonProps }
          keyframes={ this.state.keyframes[this.state.activeKeyframeId] }
          keyframesId={ this.state.activeKeyframeId }
          element={ this.getActiveElement(activePath, elements) }
        />
        <Drawer
          anchor="right"
          open={ this.state.showPresets }
          onClose={ this.handleHidePresets }
        >
          <Link onClick={ this.handleHidePresets }>Close Presets</Link>
          <Menu
            items={ [
              {
                label: 'Item 1',
              },
              {
                label: 'Item 2'
              },
              {
                label: 'Item 3'
              },
              {
                label: 'Item 4'
              }
            ] }
          />

        </Drawer>
      </div>
    );
  }
}
