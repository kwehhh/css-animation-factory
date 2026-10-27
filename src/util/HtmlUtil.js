// Layers → HTML markup. Shared by Export and the Element Editor's HTML tab,
// so the tab shows exactly what Export writes.

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

/** One element and what is inside it. Hidden children are left out, as in Export. */
function renderElementToHtml(el, depth = 0) {
  const indent = '  '.repeat(depth);
  const tag = el.tag || 'div';
  const attrs = renderAttrs(el);
  const children = renderElementsToHtml(el.elements || [], depth + 1);

  if (!children.trim()) {
    return `${indent}<${tag}${attrs}></${tag}>\n`;
  }

  return `${indent}<${tag}${attrs}>\n${children}${indent}</${tag}>\n`;
}

function renderElementsToHtml(elements = [], depth = 0) {
  return (elements || [])
    .map((el) => (!el || el.hidden ? '' : renderElementToHtml(el, depth)))
    .join('');
}

function buildExportHtml(elements = []) {
  const inner = renderElementsToHtml(elements, 1).trimEnd();
  return `<div class="caf-animation-root">\n${inner}\n</div>\n`;
}

export { escapeHtmlAttr, markupAttrName, renderElementToHtml, renderElementsToHtml, buildExportHtml };
