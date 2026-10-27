import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
} from '@material-ui/core';
import { Controlled as CodeMirror } from 'react-codemirror2';
require('codemirror/mode/css/css');
require('codemirror/mode/xml/xml');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import { buildExportHtml } from '../../../util/HtmlUtil.js';

function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      return navigator.clipboard.writeText(text).catch(() => {});
    }
  } catch (e) {
    // fall through to legacy fallback
  }

  // Legacy fallback for older browsers / permission issues.
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch (e) {
    // ignore
  }
}

export default function ExportModal({ open, onClose, elements, css }) {
  const html = buildExportHtml(elements);
  const compiledCss = (css || '').trim() + '\n';

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Export</DialogTitle>
      <DialogContent dividers>
        <div
          style={{
            display: 'flex',
            gap: 'var(--caf-space-12)',
            alignItems: 'stretch',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--caf-space-8)',
              }}
            >
              <div className="caf-title">HTML</div>
              <Tooltip title="Copy HTML">
                <span>
                  <Button size="small" onClick={() => copyToClipboard(html)}>
                    Copy
                  </Button>
                </span>
              </Tooltip>
            </div>
            <CodeMirror
              value={html}
              options={{
                mode: 'xml',
                theme: 'material',
                lineNumbers: true,
                readOnly: true,
              }}
              onBeforeChange={() => {}}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--caf-space-8)',
              }}
            >
              <div className="caf-title">CSS</div>
              <Tooltip title="Copy CSS">
                <span>
                  <Button size="small" onClick={() => copyToClipboard(compiledCss)}>
                    Copy
                  </Button>
                </span>
              </Tooltip>
            </div>
            <CodeMirror
              value={compiledCss}
              options={{
                mode: 'css',
                theme: 'material',
                lineNumbers: true,
                readOnly: true,
              }}
              onBeforeChange={() => {}}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

