import { convertCamelToKebabCase } from './StringUtil.js';
const getCSSfromStyleObj = (style, formatter) => {
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
};

/**
 * getCSSfromStyleObj formatter: one declaration per line, `depth` levels in
 * (2 spaces each), the way the JSON tab and code formatters lay things out.
 */
const indentFormatter = (depth = 1) => (attr, value) => `${'  '.repeat(depth)}${attr}: ${value};\n`;

export { getCSSfromStyleObj, indentFormatter };