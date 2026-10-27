// The whole animation as JSON, in the same shape as a preset file
// (src/data/*.json): what you copy can be pasted back in, and a preset file
// (`svg` + `css` instead of `elements`) can be pasted as well.

/** The document (elements, classes, keyframes, css) as formatted JSON. */
function animationToJson(doc) {
  const { elements = [], classes = {}, keyframes = {}, css = '' } = doc || {};
  return `${JSON.stringify({ elements, classes, keyframes, css }, null, 2)}\n`;
}

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

// A pasted animation renders as real DOM: nothing in it may run code (event
// handlers, javascript: links, scripts and embeds) or break React (its own
// props, a `style` that isn't an object).
const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed'];
const REACT_PROPS = ['children', 'dangerouslySetInnerHTML', 'key', 'ref'];

function checkAttributes(attributes, at) {
  if (!isPlainObject(attributes)) return `${at} must be an object of name: value`;
  for (const name of Object.keys(attributes)) {
    const value = attributes[name];
    if (/^on/i.test(name) || REACT_PROPS.includes(name)) return `${at}.${name} isn't allowed in an animation`;
    if (name === 'style') return `${at}.style isn't supported: style a layer with classes`;
    if (!['string', 'number'].includes(typeof value)) return `${at}.${name} must be text or a number`;
    if (/^\s*javascript:/i.test(String(value))) return `${at}.${name} can't be a javascript: link`;
  }
  return null;
}

function checkElements(list, where) {
  if (!Array.isArray(list)) return `${where} must be a list of layers`;
  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    const at = `${where}[${i}]`;
    if (!isPlainObject(el)) return `${at} must be an object (a layer)`;
    if (el.tag !== undefined) {
      if (typeof el.tag !== 'string' || !/^[a-zA-Z][a-zA-Z0-9:-]*$/.test(el.tag)) return `${at}.tag must be a tag name, like "div" or "path"`;
      if (BLOCKED_TAGS.includes(el.tag.toLowerCase())) return `${at}.tag: <${el.tag}> isn't allowed in an animation`;
    }
    if (el.displayName !== undefined && typeof el.displayName !== 'string') return `${at}.displayName must be text`;
    if (el.classes !== undefined && (!Array.isArray(el.classes) || el.classes.some((c) => typeof c !== 'string'))) {
      return `${at}.classes must be a list of class names`;
    }
    if (el.attributes !== undefined) {
      const problem = checkAttributes(el.attributes, `${at}.attributes`);
      if (problem) return problem;
    }
    if (el.elements !== undefined) {
      const problem = checkElements(el.elements, `${at}.elements`);
      if (problem) return problem;
    }
  }
  return null;
}

// { name: { property: value } }: classes, and each @keyframes' frames.
function checkRules(rules, at) {
  if (!isPlainObject(rules)) return `${at} must be an object`;
  for (const name of Object.keys(rules)) {
    const decls = rules[name];
    if (!isPlainObject(decls)) return `${at}["${name}"] must be an object of property: value`;
    for (const prop of Object.keys(decls)) {
      if (!['string', 'number'].includes(typeof decls[prop])) return `${at}["${name}"].${prop} must be text or a number`;
    }
  }
  return null;
}

/**
 * Reads pasted JSON into a document. `expandPreset` turns a preset's `svg`
 * and `css` into layers, classes and keyframes (App.expandPreset). Throws an
 * Error saying what is wrong and where.
 */
function readAnimationJson(text, expandPreset = (preset) => preset) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Not valid JSON: ${err.message}`);
  }
  if (!isPlainObject(data)) throw new Error('Expected an object with "elements" (or a preset\'s "svg")');
  if (data.elements === undefined && typeof data.svg !== 'string') {
    throw new Error('Expected an "elements" list (or a preset\'s "svg")');
  }
  if (data.css !== undefined && typeof data.css !== 'string') throw new Error('"css" must be text');

  let doc;
  try {
    doc = expandPreset(data);
  } catch (err) {
    throw new Error(`Couldn't read its "svg" / "css": ${err.message}`);
  }
  const problem = checkElements(doc.elements, 'elements')
    || checkRules(doc.classes || {}, 'classes');
  if (problem) throw new Error(problem);
  if (doc.keyframes !== undefined && !isPlainObject(doc.keyframes)) throw new Error('"keyframes" must be an object');
  for (const name of Object.keys(doc.keyframes || {})) {
    const frames = checkRules(doc.keyframes[name], `keyframes["${name}"]`);
    if (frames) throw new Error(frames);
  }
  if (data.svg && !doc.elements.length) throw new Error('"svg" has no <svg> element in it');

  return {
    title: typeof data.title === 'string' ? data.title : '',
    elements: doc.elements,
    classes: doc.classes || {},
    keyframes: doc.keyframes || {},
    css: doc.css || '',
  };
}

/** How many layers a tree holds, nested ones included. */
function countLayers(elements = []) {
  return elements.reduce((n, el) => n + 1 + countLayers(el.elements || []), 0);
}

export { animationToJson, readAnimationJson, countLayers };
