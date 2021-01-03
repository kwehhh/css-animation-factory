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

export { getCSSfromStyleObj };