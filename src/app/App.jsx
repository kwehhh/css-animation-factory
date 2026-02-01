import React from "react";
import { Helmet } from "react-helmet";
import { Menu, Layout, Link } from '@unfocused/nurvus-ui';
import { Drawer } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import ViewListIcon from '@material-ui/icons/ViewList';
import TuneIcon from '@material-ui/icons/Tune';
import _ from "lodash";
import AnimationContainer from './components/AnimationContainer/AnimationContainer.jsx';
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
    this.handleUpdateElement = this.handleUpdateElement.bind(this);
    this.handleUpdateKeyframes = this.handleUpdateKeyframes.bind(this);
  }

  handleToggleLayersPanel = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({ showLayersPanel: !prevState.showLayersPanel }));
  }

  handleToggleElementPanel = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    this.setState((prevState) => ({ showElementContainer: !prevState.showElementContainer }));
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

    const navHeight = 30;
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

    const menuItems = this.state.presets.map(preset => ({ label: preset.title }));
    // <link href="assets/font/DancingScript-Medium.ttf" rel="stylesheet"></link>


    // <link rel="preconnect" href="https://fonts.googleapis.com" />
    // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    // <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&display=swap" rel="stylesheet"></link>
    return (
      <div>
        <Helmet>
          <style>{ this.getDisplayCSS() }</style>
          <meta charSet="utf-8" />
        </Helmet>
        <div style={{
          height: navHeight,
          position: 'fixed',
          background: '#403960',
          color: 'white',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          boxSizing: 'border-box',
          zIndex: 9
        }}>
          <Layout display="flex" alignItems="center" justifyContent="space-between" style={{ width: '100%', height: '100%' }}>
            <div className="logo">CSS Animation Factory</div>
            <Layout display="flex" alignItems="center" style={{ height: '100%' }}>
              <IconButton size="small" onClick={ this.handleToggleLayersPanel } style={{ color: '#fff' }}>
                <ViewListIcon />
              </IconButton>
              <IconButton size="small" onClick={ this.handleToggleElementPanel } style={{ color: '#fff' }}>
                <TuneIcon />
              </IconButton>
              <Link onClick={ this.handleShowPresets }>Presets</Link>
            </Layout>
          </Layout>
        </div>
        <Preview
          { ...commonProps }
          leftBoundaryWidth={ this.state.showLayersPanel ? containerSpacing + elElementsContainerWidth : 0 }
          rightBoundaryWidth={ this.state.showElementContainer ? containerSpacing + elContainerWidth : 0 }
          topBoundaryHeight={ navHeight }
        />
        { this.state.showLayersPanel && (
          <div style={{
            position: 'absolute',
            top: navHeight,
            bottom: 0,
            left: '20px',
            padding: '20px 0'
          }}>
            <Layers
              { ...commonProps }
              activeElement={ activeElement }
              onClick={ this.handleSelectElement }
              onClone={ this.handleCloneElement }
              onToggleHidden={ this.handleToggleHidden }
              width={ elElementsContainerWidth }
            />
          </div>
        ) }
        { this.state.showElementContainer && (
          <div
            style={{
              position: 'absolute',
              top: navHeight,
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
              visible={ true }
              onChange={ (props) => { this.handleUpdateElement(props, activeElement) } }
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
