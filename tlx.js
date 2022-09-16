const parser = new DOMParser();
let counter = 1000;
let tlx = null;

export const createTlx = (createElement) => {
  function parse(parts, ...props) {
    const [html, refs] = ltr(parts, props);
    const dom = parser.parseFromString(html, 'text/html');
    const node = dom.body.childNodes[0] ?? dom.head.childNodes[0];
    const elements = render(node, refs);
    if(elements.length !== 1) {
      throw 'invalid VDOM structure!';
    }
    return elements[0];
  }

  function render(node, refs) {
    if(node.nodeType === Node.TEXT_NODE) {
      return apply(node.textContent, refs);
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
            attributes[`on${event.substr(0, 1).toUpperCase()}${event.substr(1)}`] = refs[ref];
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
            styles[key] = apply(value, refs).join('');
          }
          attributes[key] = styles;
        }
        else {
          attributes[key] = apply(value, refs).join('');
        }
      }
    }
    const children = [];
    (node.childNodes ?? []).forEach((child) => children.push(...render(child, refs)));
    return [createElement(tag, attributes, ...children)];
  }
  
  tlx = parse;
  return tlx;
}

export const css = (parts, ...props) => {
  const [css, refs] = ltr(parts, props);
  return tlx`
    <style type="text/css">
      ${apply(css, refs).join('')}
    </style>
  `;
}

export const style = (parts, ...props) => {
  const [css, refs] = ltr(parts, props);
  const styles = {};
  for(const item of css.split(';')) {
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
    styles[key] = apply(value, refs).join('');
  }
  return styles;
}

function apply(value, refs) {
  let values = [];
  const expr = /\$tlx-\d+/g;
  let match = null;
  let last = 0;
  while((match = expr.exec(value)) !== null) {
    const index = match.index;
    values.push(value.substring(last, index));
    let refValue = refs[match[0]];
    if(refValue instanceof Function) {
      refValue = refValue();
    }
    values.push(refValue);
    last = index + match[0].length;
  }
  values.push(value.substring(last));
  return values;
}

function ltr(parts, props) {
  let string = '';
  const refs = {};
  for(let i = 0; i < parts.length; i++) {
    string += parts[i];
    if(props[i] !== undefined) {
      const id = `$tlx-${counter}`;
      refs[id] = props[i];
      string += id ?? '';
      counter++;
    }
  }
  return [string.trim(), refs];
}
