import React from "react";
import { Helmet } from "react-helmet";
import { Menu, Link } from '@unfocused/nurvus-ui';
import { Drawer } from '@material-ui/core';
import _ from "lodash";
import AnimationContainer from './components/AnimationContainer/AnimationContainer.jsx';
import AppHeader from './components/AppHeader/AppHeader.jsx';
import ElementEditor from './components/ElementEditor.jsx';
import Layers from './components/Layers.jsx';
import Preview from './components/Preview.jsx';
import { convertCamelToKebabCase } from '../util/StringUtil.js';
import "./App.scss";

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
      showLayersPanel: true,
      showElementContainer: true,
      isElementEditorExpanded: true,
      showPresets: false,
      presets: []
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
    this.handleUpdateElementAtPath = this.handleUpdateElementAtPath.bind(this);
    this.handleUpdateKeyframes = this.handleUpdateKeyframes.bind(this);
    this.handleElementEditorExpandedChange = this.handleElementEditorExpandedChange.bind(this);
  }

  handleToggleLayersPanel = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({ showLayersPanel: !prevState.showLayersPanel }));
  }

  handleToggleElementPanel = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({ showElementContainer: !prevState.showElementContainer }));
  }

  handleElementEditorExpandedChange(isExpanded) {
    this.setState({ isElementEditorExpanded: !!isExpanded });
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
    const { files } = this.props.manifest;
    const file = `data/${files[0]}`;
    const data = fetch(file).then(res => res.json()).then(data => {
      this.setState(prevState => {
        return {
          ...prevState,
          ...data
        }
      });
    });
    Promise.all(files.map(file => fetch(`data/${file}`))).then(responses => {
      return Promise.all(responses.map(res => res.json()));
    }).then(presets => {
      this.setState({presets: presets.map((preset, i) => {
        return {
          ...preset,
          src: files[i]
        };
      })});
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
      const newElement = { ...refElement, ...extraProps };

      // Clone Element
      if (path.length === 1) {
        const getNameRoot = (name = '') => name.replace(/\s+\d+$/, '');
        const getNextName = (rootName, siblings) => {
          const root = getNameRoot(rootName);
          let max = 0;

          siblings.forEach((sibling) => {
            const siblingName = sibling?.name || '';
            if (siblingName === root) {
              max = Math.max(max, 1);
              return;
            }

            const match = siblingName.match(new RegExp(`^${_.escapeRegExp(root)}\\s+(\\d+)$`));
            if (match) {
              max = Math.max(max, parseInt(match[1], 10));
            }
          });

          return { root, max, next: `${root} ${max + 1}` };
        };

        const { root, max, next } = getNextName(newElement.name, newElements);

        // If this is the first duplicate, rename original to "<root> 1"
        if (max <= 1 && newElement.name === root) {
          newElements[index] = { ...newElement, name: `${root} 1` };
        } else {
          newElements[index] = newElement;
        }

        // Ensure the clone is a distinct object (no shared references)
        const cloneElement = _.cloneDeep(newElements[index]);
        cloneElement.name = next;
        newElements.push(cloneElement);
      } else {
        newElements[index] = newElement;
      }

      return newElements;
    }

    return elements;
  }

  updateElementAtPath(elements = [], path = [], updater) {
    if (!path.length) return elements;

    const [index, ...rest] = path;
    const nextElements = [...elements];
    const current = nextElements[index];

    if (!current) return elements;

    if (!rest.length) {
      nextElements[index] = updater(current);
      return nextElements;
    }

    const childElements = current.elements || [];
    nextElements[index] = {
      ...current,
      elements: this.updateElementAtPath(childElements, rest, updater)
    };
    return nextElements;
  }

  removeElementAtPath(elements = [], path = []) {
    if (!path.length) return elements;
    const [index, ...rest] = path;
    const nextElements = [...elements];
    const current = nextElements[index];
    if (!current) return elements;

    if (!rest.length) {
      nextElements.splice(index, 1);
      return nextElements;
    }

    const childElements = current.elements || [];
    nextElements[index] = {
      ...current,
      elements: this.removeElementAtPath(childElements, rest)
    };
    return nextElements;
  }

  adjustActivePathAfterRemoval(activePath = [], removedPath = []) {
    if (!activePath.length || !removedPath.length) return activePath;

    // If the removed path is a prefix of the active path, clear selection.
    const isPrefix = removedPath.every((v, i) => activePath[i] === v);
    if (isPrefix) return [];

    // If same parent, and active index is after removed index, decrement it.
    if (activePath.length === removedPath.length) {
      const parentMatches = removedPath.slice(0, -1).every((v, i) => activePath[i] === v);
      if (parentMatches) {
        const removedIdx = removedPath[removedPath.length - 1];
        const activeIdx = activePath[activePath.length - 1];
        if (activeIdx > removedIdx) {
          return [...activePath.slice(0, -1), activeIdx - 1];
        }
      }
    }

    return activePath;
  }

  handleRemoveElement = (e, path) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({
      elements: this.removeElementAtPath(prevState.elements, path),
      activePath: this.adjustActivePathAfterRemoval(prevState.activePath, path)
    }));
  }

  handleCloneElement() {
    this.setState((prevState) => {
      return {
        elements: this.cloneInsertion(prevState.elements, prevState.activePath)
      };
    });
  }

  handleToggleHidden = (e, path) => {
    if (e?.stopPropagation) e.stopPropagation();

    this.setState((prevState) => {
      return {
        elements: this.updateElementAtPath(prevState.elements, path, (el) => ({
          ...el,
          hidden: !el.hidden
        }))
      };
    });
  }

  /**
   * New/Update ....
   * @param {array} path - ...
   */
   handleSelectElement(path) {
    let activePath = path;
    const isSamePath = _.isEqual(activePath, this.state.activePath);
    if (isSamePath) {
      activePath = [];
    }

    // If the user selects a layer, ensure the Element Editor panel is visible.
    // (If they clicked the already-selected layer to deselect, don't force it open.)
    this.setState({
      activePath,
      showElementContainer: activePath.length ? true : this.state.showElementContainer
    });
  }

  handleSelectKeyframes(activeKeyframeId) {
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

  handleHidePresets(e, path) {
    this.setState({
      showPresets: false
    });
  }

  /**
   * Handle set preset
   * @param {object} e - event
   * @param {array} path - preset index
   */
  handleSetPreset = (e, path) => {
    let extraProps = {};
    if (path) {
      extraProps = {
        ...this.state.presets[path]
      };
    }

    this.setState({
      showPresets: false,
      ...extraProps
    });
  }

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

      return {
        keyframes: newKeyframes
      };
    });
  }

  handleUpdateElementAtPath(elementPatch, path = []) {
    if (!path.length) return;

    this.setState((prevState) => {
      return {
        elements: this.updateElementAtPath(prevState.elements, path, (el) => ({
          ...el,
          ...elementPatch
        }))
      };
    });
  }

  render() {
    const { activeElement, activePath, classes, keyframes, elements } = this.state;

    const navHeight = 32;
    const containerSpacing = 20;
    const elContainerWidth = 350;
    const elElementsContainerWidth = 180;
    const bottomBoundaryHeight = 200;
    const elementEditorWidth = this.state.isElementEditorExpanded ? elContainerWidth * 2 : elContainerWidth;
    const commonProps = {
      activePath,
      classes,
      keyframes,
      elements,
      onClassChange: this.handleUpdateClass,
      onKeyframesChange: this.handleUpdateKeyframes,
      onSelectKeyframes: this.handleSelectKeyframes
    };

    const menuItems = this.state.presets.map(preset => ({ label: preset.title }));
    // <link href="assets/font/DancingScript-Medium.ttf" rel="stylesheet"></link>


    // <link rel="preconnect" href="https://fonts.googleapis.com" />
    // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    // <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&display=swap" rel="stylesheet"></link>
    return (
      <div className="app-root">
        <Helmet>
          <style>{ this.getDisplayCSS() }</style>
          <meta charSet="utf-8" />
        </Helmet>
        <AppHeader
          navHeight={ navHeight }
          showLayersPanel={ this.state.showLayersPanel }
          showElementContainer={ this.state.showElementContainer }
          onToggleLayersPanel={ this.handleToggleLayersPanel }
          onToggleElementPanel={ this.handleToggleElementPanel }
          onShowPresets={ this.handleShowPresets }
        />
        <Preview
          { ...commonProps }
          leftBoundaryWidth={ 0 }
          rightBoundaryWidth={ 0 }
          topBoundaryHeight={ navHeight }
          bottomBoundaryHeight={ bottomBoundaryHeight }
          onSelectElement={ this.handleSelectElement }
        />
        { this.state.showLayersPanel && (
          <div className="app-panel app-panel--left" style={{
            position: 'absolute',
            top: navHeight,
            bottom: 0,
            left: 0,
            padding: 'var(--caf-space-0)',
          }}>
            <Layers
              { ...commonProps }
              activeElement={ activeElement }
              onClick={ this.handleSelectElement }
              onClone={ this.handleCloneElement }
              onToggleHidden={ this.handleToggleHidden }
              onRemove={ this.handleRemoveElement }
              width={ elElementsContainerWidth }
            />
          </div>
        ) }
        { this.state.showElementContainer && (
          <div
            className="app-panel app-panel--right"
            style={{
              position: 'absolute',
              top: navHeight,
              bottom: 0,
              right: 0,
              padding: 'var(--caf-space-0)',
            }}
          >
            <ElementEditor
              { ...commonProps }
              width={ elementEditorWidth }
              style={{
                padding: 'var(--caf-space-4) var(--caf-nav-pad-x)',
              }}
              element={ this.getActiveElement(activePath, elements) }
              elementProps={ this.getActiveElement(activePath, elements) }
              defaultExpanded={ true }
              onExpandedChange={ this.handleElementEditorExpandedChange }
              visible={ true }
              onChange={ (props) => { this.handleUpdateElementAtPath(props, activePath) } }
              onSubmit={ this.handleUpdateElements }
            />
          </div>
        ) }
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
            items={ menuItems }
            onClick={ this.handleSetPreset }
          />

        </Drawer>
      </div>
    );
  }
}
