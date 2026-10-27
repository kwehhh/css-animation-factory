import React from 'react';
import { FullPageModal, Layout } from '@nurvus/ui';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ElementEditor from './ElementEditor.jsx';
import Preview from './Preview.jsx';

export default class AddNewElement extends React.Component {

  constructor(props) {
    super();

    const { element, draft } = props;

    const localProps = {
      width: '50px',
      height: '50px',
      background: 'red',
      borderRadius: '10px'
    };

    this.state = {
      // Initial State for New Element
      element,
      config: {
        displayName: element.displayName,
        classes: [draft.className]
      },
      // Initial State for New ...
      // Set these props as default...
      newClassProps: localProps
    };

    // Need to lift this up so there is no double render
    // Init
    // props.onClassChange(newClass, localProps);


    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  // Change to Element
  handleChange(newProp) {
    this.setState((prevState) => {
      const nextConfig = {
        ...prevState.config,
        ...newProp
      };
      return {
        config: nextConfig,
        element: {
          ...(prevState.element || {}),
          ...nextConfig
        }
      };
    });
  };


  // Change to Classes -- this is the only thing that links to Preview live CSS
  handleClassChange(className, classProps) {
    const { newClassProps } = this.state;
    const localProps = {
      ...newClassProps,
      ...classProps
    };

    // Into the document so the preview shows it, but as a draft: Save turns
    // the whole dialog into one "Add layer" step, Cancel rolls it back.
    this.props.onClassChange(className, localProps, { record: false });
  };

  // Escape cancels, like the close button. (The dialog is mounted only while
  // open, so the listener lives exactly as long as it does.)
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
    // A dialog or menu opened from inside this one (Assign Classes, a select)
    // closes on the same Escape: let it, and keep this one open. MUI stops
    // the event only among React handlers, so check for it here.
    if (document.querySelector('.MuiDialog-root, .MuiPopover-root')) return;
    this.props.onCancel();
  }

  render() {
    const leftBoundary = 300;
    const { config, newClassProps } = this.state;
    const { keyframes, ...props } = this.props;

    const headerHeight = '60px';

    return (
      <FullPageModal
        visible={ this.props.open }
        title="Add New Element"
        headerActions={ (
          <Layout itemSpacing={ 0 } display="flex">
            <Button autoFocus color="inherit" onClick={ () => this.props.onSave(this.state.element) }>
              Save
            </Button>
            <IconButton
              edge="start"
              color="inherit"
              onClick={ this.props.onCancel }
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Layout>
        ) }
      >
        <div style={{
          display: 'flex',
          flex: '1',
          top: headerHeight,
          bottom: 0,
          position: 'absolute',
          left: 0,
          right: 0
        }}>
          <div style={{
            display:'flex',
            flexGrow: '1',
            minWidth: leftBoundary,
            maxWidth: leftBoundary
            }}>
            <ElementEditor
              { ...props }
              idScope="new-element"
              classes={ {
                ...this.props.classes
              } }
              keyframes={ keyframes }
              onChange={ this.handleChange }
              onClassChange={ this.handleClassChange }
              elementProps={ config }
              width={ leftBoundary }
              style={{
                borderRadius: 0
              }}
            />
          </div>
          <Preview
            leftBoundaryWidth={ leftBoundary }
            rightBoundaryWidth={ 0 }
            elements={ [this.state.element] }
          />
        </div>
      </FullPageModal>
    );
  }
}
