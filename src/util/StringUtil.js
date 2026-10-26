const convertCamelToKebabCase = (str) => {
  const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
// console.log(camelToSnakeCase('animationName')); // <--- convert obs to this format... for style
  return camelToSnakeCase(str);
}


/**
 * A DOM id that is unique per field, e.g. fieldId('class', 'me404', 'width')
 * → "caf-class-me404-width". Shared ids (the old "standard-basic") break
 * <label for> and get flagged by the browser.
 */
const fieldId = (...parts) => ['caf', ...parts].join('-').replace(/[^A-Za-z0-9_-]+/g, '_');

export { convertCamelToKebabCase, fieldId };