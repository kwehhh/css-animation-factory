import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { copyToClipboard } from '../../../util/clipboard.js';
require('codemirror/mode/javascript/javascript');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import './AnimationJsonDialog.scss';

/**
 * The whole animation as JSON, in the same shape as a preset file: view and
 * copy it, or paste one in and Import, which replaces the animation as one
 * undo step. `getJson()` gives the animation's JSON; `onImport(text)` returns
 * an error message, or null when the import worked.
 */
export default function AnimationJsonDialog({ open, getJson, onImport, onClose }) {
  return (
    <Dialog open={ !!open } onClose={ onClose } fullWidth maxWidth="md" aria-labelledby="caf-json-title">
      <DialogTitle id="caf-json-title">Animation JSON</DialogTitle>
      {/* Mounted only while open: each open starts from the animation as it is then. */}
      <JsonBody getJson={ getJson } onImport={ onImport } onClose={ onClose } />
    </Dialog>
  );
}

function JsonBody({ getJson, onImport, onClose }) {
  const [original] = React.useState(getJson);
  const [text, setText] = React.useState(original);
  const [error, setError] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const edited = text !== original;

  return (
    <React.Fragment>
      <DialogContent dividers className="caf-json">
        <p className="caf-json-note">
          The whole animation: its layers, classes, keyframes and the preset&apos;s own CSS, in the format of a preset file.
          Copy it to keep or share. To load one, paste it here (a preset file works too) and choose Import: it replaces
          the current animation, and Undo brings that back.
        </p>
        { error && <div className="caf-json-error" role="alert">{ error }</div> }
        <div className="caf-json-code">
          <CodeMirror
            value={ text }
            options={{
              mode: { name: 'javascript', json: true },
              theme: 'material',
              lineNumbers: true,
            }}
            editorDidMount={ (editor) => editor.setSize(null, '100%') }
            onBeforeChange={ (editor, data, value) => {
              setText(value);
              setError(null);
              setCopied(false);
            } }
          />
        </div>
      </DialogContent>
      <DialogActions>
        <span className="caf-json-status" aria-live="polite">{ copied ? 'Copied' : '' }</span>
        <Button onClick={ () => { copyToClipboard(text); setCopied(true); } }>Copy</Button>
        { edited && (
          <Button onClick={ () => { setText(original); setError(null); } } title="Back to the current animation">
            Revert
          </Button>
        ) }
        <Button onClick={ onClose }>Close</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={ !edited }
          title={ edited ? 'Replace the current animation with this JSON (Undo brings it back)' : 'Paste or edit JSON first' }
          onClick={ () => setError(onImport(text)) }
        >
          Import
        </Button>
      </DialogActions>
    </React.Fragment>
  );
}
