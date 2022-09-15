const parser = new DOMParser();
let counter = 1000;

function tlx(parts, ...props) {
  const [html, refs] = ltr(parts, props);
  const dom = parser.parseFromString(html, 'text/html');
  if(dom.body.childNodes.length !== 1) {
    throw 'invalid DOM structure!';
  }
  const node = dom.body.childNodes[0];
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
  const tag = node.tagName.toLowerCase();
  const attributes = {};
  for(const attribute of node.attributes) {
    const key = attribute.name;
    const value = attribute.textContent;
    let isDynamic = false;
    for(const ref in refs) {
      if(value === ref) {
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
  return [React.createElement(tag, attributes, ...children)];
}

function apply(value, refs) {
  let values = [];
  const expr = /\$tlx-\d+/g;
  let match = null;
  let last = 0;
  while((match = expr.exec(value)) !== null) {
    const index = match.index;
    values.push(value.substring(last, index));
    values.push(refs[match[0]]);
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
