const convertCamelToKebabCase = (str) => {
  const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
// console.log(camelToSnakeCase('animationName')); // <--- convert obs to this format... for style
  return camelToSnakeCase(str);
}


export { convertCamelToKebabCase };