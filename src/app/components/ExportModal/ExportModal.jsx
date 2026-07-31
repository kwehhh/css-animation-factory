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

function escapeHtmlAttr(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getClassName(classes) {
  if (!classes || !classes.length) return '';
  return classes.join(' ').trim();
}

// React stores SVG/HTML attributes in camelCase; convert back to markup names.
// Structural SVG attrs (viewBox, preserveAspectRatio, gradient*) are camelCase
// in markup too, so they pass through unchanged.
const REACT_TO_MARKUP = {
  className: 'class',
  clipPath: 'clip-path',
  clipRule: 'clip-rule',
  fillRule: 'fill-rule',
  fillOpacity: 'fill-opacity',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeMiterlimit: 'stroke-miterlimit',
  strokeDasharray: 'stroke-dasharray',
  strokeOpacity: 'stroke-opacity',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
  xlinkHref: 'xlink:href',
  xmlSpace: 'xml:space'
};

function markupAttrName(name) {
  return REACT_TO_MARKUP[name] || name;
}

function renderAttrs(el) {
  const parts = [];
  const className = getClassName(el.classes);
  if (className) parts.push(`class="${escapeHtmlAttr(className)}"`);

  const attrs = el.attributes || {};
  Object.keys(attrs).forEach((key) => {
    if (key === 'class' || key === 'className') return; // handled via classes
    parts.push(`${markupAttrName(key)}="${escapeHtmlAttr(attrs[key])}"`);
  });

  return parts.length ? ` ${parts.join(' ')}` : '';
}

function renderElementsToHtml(elements = [], depth = 0) {
  const indent = '  '.repeat(depth);

  return (elements || [])
    .map((el) => {
      if (!el || el.hidden) return '';
      const tag = el.tag || 'div';
      const attrs = renderAttrs(el);
      const children = renderElementsToHtml(el.elements || [], depth + 1);

      if (!children.trim()) {
        return `${indent}<${tag}${attrs}></${tag}>\n`;
      }

      return `${indent}<${tag}${attrs}>\n${children}${indent}</${tag}>\n`;
    })
    .join('');
}

function buildExportHtml(elements = []) {
  const inner = renderElementsToHtml(elements, 1).trimEnd();
  return `<div class="caf-animation-root">\n${inner}\n</div>\n`;
}

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

