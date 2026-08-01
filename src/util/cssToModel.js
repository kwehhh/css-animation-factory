/**
 * Parse a raw CSS string into the app's editable model:
 *   - `classes`   { className: { camelProp: value } }   (single `.class {}` rules)
 *   - `keyframes` { name: { '0%': { camelProp: value } } } (`@keyframes name {}`)
 *   - `rest`      CSS that doesn't fit the model (id/grouped selectors, other
 *                 at-rules) — kept verbatim so it can still be injected.
 *
 * Lets SVG presets (which style via a raw `css` blob) expose their `.st*`
 * classes + keyframes to the Element Editor, while id-based animation rules
 * (`#moon { … }`, grouped `transform-box` rules) pass through as `rest`.
 */

function stripComments(css) {
  return (css || '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function findMatchingBrace(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function camelize(prop) {
  // Leave CSS custom properties (--foo) untouched.
  if (prop.startsWith('--')) return prop;
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseDeclarations(body) {
  const out = {};
  const re = /([-\w]+)\s*:\s*([^;]+?)\s*;/g;
  let m;
  // ensure trailing declaration without ; is caught
  const src = body.trim().endsWith(';') ? body : `${body};`;
  while ((m = re.exec(src))) {
    const key = (m[1] || '').trim();
    const value = (m[2] || '').trim();
    if (key) out[camelize(key)] = value;
  }
  return out;
}

function parseKeyframesBody(body) {
  const frames = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i += 1;
    if (i >= body.length) break;
    const braceIdx = body.indexOf('{', i);
    if (braceIdx === -1) break;
    const selector = body.slice(i, braceIdx).trim(); // e.g. "0%" or "4%,20%"
    const closeIdx = findMatchingBrace(body, braceIdx);
    if (closeIdx === -1) break;
    const decls = parseDeclarations(body.slice(braceIdx + 1, closeIdx));
    if (selector) frames[selector] = decls;
    i = closeIdx + 1;
  }
  return frames;
}

export function cssToModel(cssText) {
  const src = stripComments(cssText);
  const classes = {};
  const keyframes = {};
  let rest = '';

  let i = 0;
  while (i < src.length) {
    const braceIdx = src.indexOf('{', i);
    if (braceIdx === -1) {
      rest += src.slice(i);
      break;
    }
    const selector = src.slice(i, braceIdx).trim();
    const closeIdx = findMatchingBrace(src, braceIdx);
    if (closeIdx === -1) {
      rest += src.slice(i);
      break;
    }
    const body = src.slice(braceIdx + 1, closeIdx);
    const rawRule = src.slice(i, closeIdx + 1);

    if (/^@keyframes\s+/.test(selector)) {
      const name = selector.replace(/^@keyframes\s+/, '').trim();
      if (name) keyframes[name] = parseKeyframesBody(body);
    } else if (/^\.[-_a-zA-Z0-9]+$/.test(selector)) {
      classes[selector.slice(1)] = parseDeclarations(body);
    } else {
      // id selectors, grouped selectors, other at-rules — keep verbatim
      rest += `${rawRule}\n`;
    }

    i = closeIdx + 1;
  }

  return { classes, keyframes, rest: rest.trim() };
}

export default cssToModel;
