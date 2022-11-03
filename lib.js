const parser = new DOMParser();
let count = 1000;
let create = null;

const figure = ({createElement}) => {
  create = createElement;
}

const html = (strings, ...props) => {
  const elements = parse(strings, ...props);
  if(elements.length === 0) {
    throw 'No DOM element was returned!';
  }
  if(elements.length > 1) {
    console.warn('Only one DOM element can be returned!');
  }
  return elements[0];
}

const parse = (strings, ...props) => {
  const [html, refs] = compose(strings, props);
  let dom;
  try {
    dom = parser.parseFromString(html, 'text/html');
  }
  catch(error) {
    console.error(error);
    throw 'Invalid DOM structure!';
  }
  const nodes = [...dom.head.childNodes, ...dom.body.childNodes];
  return nodes.map((node) => render(node, refs));
}

/**
 * Joins the template literal strings together and replaces the properties with references.
 * The properties are being mapped to there corresponding references and with the populated
 * HTML string returned.
 *
 * @param {string[]} strings - The template literal strings
 * @param {any[]} props - The template literal properties
 * @return {any[]} The joined HTML string and the properties mapped to there references.
 */
const compose = (strings, props) => {
  if(strings === undefined) {
    // handles dyn function without body
    return ['', {}];
  }
  const refs = {};
  let string = '';
  for(let i = 0; i < strings.length; i++) {
    string += strings[i];
    if(props[i] !== undefined) {
      const uid = `$seg-${count++}`;
      refs[uid] = props[i];
      string += uid ?? '';
    }
  }
  return [string.trim(), refs];
}

/**
 * Injects the properties into the corresponding reference locations of the string.
 *
 * @param {string} string - The string containing references
 * @param {any[]} refs - The properties mapped to there references
 * @return {any[]} The string populate with the passed properties
 */
const feed = (string, refs) => {
  const expr = /\$seg-\d+/g;
  let values = [];
  let match = null;
  let last = 0;
  while((match = expr.exec(string)) !== null) {
    const index = match.index;
    const uid = match[0];
    values.push(string.substring(last, index));
    let value = refs[uid];
    if(value instanceof Function) {
      value = value();
    }
    values.push(value);
    last = index + uid.length;
  }
  values.push(string.substring(last));
  return values;
}

const dyn = (element, props) => {
  return (strings, ...childProps) => {
    return create(element, props, ...parse(strings, ...childProps));
  };
}

const render = (node, refs) => {
  if(node.nodeType === Node.TEXT_NODE) {
    return feed(node.textContent, refs);
  }
  if(node.nodeType === Node.COMMENT_NODE) {
    return [];
  }
  const tag = node.tagName;
  const attributes = {};
  for(const attribute of node.attributes) {
    const key = attribute.name;
    const value = attribute.textContent;
    let isDynamic = false;
    for(const ref in refs) {
      if(value === ref) {
        let match = null;
        if((match = /^@(\w+)$/.exec(key)) !== null) {
          const event = match[1];
          attributes[`on${event.substring(0, 1).toUpperCase()}${event.substring(1)}`] = refs[ref];
        }
        else {
          attributes[key] = refs[ref];
        }
        isDynamic = true;
        break;
      }
    }
    if(!isDynamic) {
      if(key === 'style') {
        const styles = {};
        for(const item of value.split(';')) {
          if(item.trim().length === 0) {
            break;
          }
          let [key, value] = item.split(':');
          key = key.trim();
          let match = null;
          if((match = /-(\w)/.exec(key)) !== null) {
            const char = match[1];
            key = key.replace(`-${char}`, char.toUpperCase());
          }
          value = value.trim();
          styles[key] = feed(value, refs).join('');
        }
        attributes[key] = styles;
      }
      else {
        attributes[key] = feed(value, refs).join('');
      }
    }
  }
  const children = [];
  (node.childNodes ?? []).forEach((child) => children.push(...render(child, refs)));
  return [create(tag, attributes, ...children)];
}

import {defCss, defStyle} from './mods.js';

const css = defCss({html, compose, feed});
const style = defStyle({html, compose, feed});

export { figure, html, dyn, css, style };
