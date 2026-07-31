/**
 * Convert a raw SVG string into the app's element-tree format so it becomes an
 * editable Layers tree (instead of an opaque markup blob).
 *
 * Element shape: { name, tag, attributes?, classes?, elements? }
 *   - `tag`        the DOM/SVG node name (svg, g, path, polygon, …)
 *   - `attributes` DOM attributes (id, d, points, viewBox, transform, …),
 *                  renamed to React's camelCase where required
 *   - `classes`    from the node's `class` attribute (rendered as className)
 *   - `elements`   child nodes (recursively)
 */

// Hyphen/colon SVG attributes React expects in camelCase form.
const ATTR_RENAME = {
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-opacity': 'strokeOpacity',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace'
};

function reactAttrName(name) {
  return ATTR_RENAME[name.toLowerCase()] || name;
}

function nodeToElement(node) {
  const tag = node.tagName;
  const attributes = {};
  const classes = [];
  let name = tag;

  Array.from(node.attributes).forEach((attr) => {
    const an = attr.name;
    if (an === 'class') {
      attr.value.split(/\s+/).filter(Boolean).forEach((c) => classes.push(c));
      return;
    }
    // Inline `style` strings would need object conversion for React; skip for
    // now (these SVGs style via classes, not inline style).
    if (an === 'style') {
      return;
    }
    if (an === 'id') {
      attributes.id = attr.value;
      name = attr.value; // use id as the human-readable layer name when present
      return;
    }
    attributes[reactAttrName(an)] = attr.value;
  });

  const element = { name, tag };
  if (classes.length) element.classes = classes;
  if (Object.keys(attributes).length) element.attributes = attributes;

  const children = Array.from(node.children).map(nodeToElement);
  if (children.length) element.elements = children;

  return element;
}

/**
 * @param {string} svgString - raw `<svg>…</svg>` markup
 * @returns {Array} element tree (single root svg element), or [] if unparseable
 */
export function svgToElements(svgString) {
  if (!svgString || typeof svgString !== 'string') return [];
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return [];
  return [nodeToElement(svg)];
}

export default svgToElements;
