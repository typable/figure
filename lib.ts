import { CreateElement, Option, Options, Props, ReactElement, ReactFunction, Refs, Slices, Values } from './types.ts';

const parser = new DOMParser();
let count = 1000;
let create: Option<CreateElement> = null;

function figure({ createElement }: Options): void {
  create = createElement;
}

function html(slices: Slices, ...values: Values): ReactElement {
  const elements = parse(slices, ...values);
  if (elements.length === 0) {
    throw 'No DOM element was returned!';
  }
  if (elements.length > 1) {
    console.warn('Only one DOM element can be returned!');
  }
  return elements[0];
}

function parse(slices: Slices, ...values: Values): ReactElement[] {
  const [html, refs] = compose(slices, values);
  let dom;
  try {
    dom = parser.parseFromString(html, 'text/html');
  }
  catch (error) {
    console.error(error);
    throw 'Invalid DOM structure!';
  }
  const nodes = [...dom.head.childNodes, ...dom.body.childNodes];
  return nodes.map((node) => render(node, refs));
}

/**
 * Joins the template literal slices together and replaces the values with references.
 * The values are being mapped to there corresponding references and with the populated
 * HTML string returned.
 *
 * @param {string[]} slices - The template literal slices
 * @param {any[]} values - The template literal values
 * @return {any[]} The joined HTML string and the values mapped to there references.
 */
function compose(slices: Slices, values: Values): [string, Refs] {
  if (slices == null) {
    // handles dyn function without body
    return ['', {}];
  }
  const refs: Refs = {};
  let slice = '';
  for (let i = 0; i < slices.length; i++) {
    slice += slices[i];
    if (values[i] != null) {
      const uid = `$seg-${count++}`;
      refs[uid] = values[i];
      slice += uid ?? '';
    }
  }
  return [slice.trim(), refs];
}

/**
 * Injects the values into the corresponding reference locations of the string.
 *
 * @param {string} slice - The string containing references
 * @param {any[]} refs - The values mapped to there references
 * @return {any[]} The string populated with the passed values
 */
function feed(slice: string, refs: Refs): ReactElement[] {
  const expr = /\$seg-\d+/g;
  const elements: ReactElement[] = [];
  let match = null;
  let last = 0;
  while ((match = expr.exec(slice)) !== null) {
    const index = match.index;
    const uid = match[0];
    elements.push(slice.substring(last, index));
    let value = refs[uid];
    if (value instanceof Function) {
      value = value();
    }
    elements.push(value);
    last = index + uid.length;
  }
  elements.push(slice.substring(last));
  return elements;
}

function dyn(element: ReactFunction, props: Props): (slices: Slices, ...values: Values) => ReactElement {
  return (slices: Slices, ...values: Values) => {
    if (create == null) {
      throw 'Invalid state! Figure was not initialized!';
    }
    return create(element, props, ...parse(slices, ...values));
  };
}

function render(node: Node, refs: Refs): ReactElement[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text;
    if (text.textContent == null) {
      return [];
    }
    return feed(text.textContent, refs);
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return [];
  }
  const element = node as HTMLElement;
  const tag = element.tagName;
  const attributes: Props = {};
  for (const attribute of element.attributes) {
    const key = attribute.name;
    const slice = attribute.textContent;
    if (slice == null) {
      continue;
    }
    let isDynamic = false;
    for (const ref in refs) {
      if (slice === ref) {
        let match = null;
        if ((match = /^@(\w+)$/.exec(key)) !== null) {
          const event = match[1];
          attributes[`on${event.substring(0, 1).toUpperCase()}${event.substring(1)}`] = refs[ref];
        }
        else if ((match = /^\[(\w+)\]$/.exec(key)) !== null) {
          const property = match[1];
          attributes[property] = refs[ref];
        }
        else {
          attributes[key] = refs[ref];
        }
        isDynamic = true;
        break;
      }
    }
    if (!isDynamic) {
      if (key === 'style') {
        const styles: Record<string, string> = {};
        for (const item of slice.split(';')) {
          if (item.trim().length === 0) {
            break;
          }
          let [key, value] = item.split(':');
          key = key.trim();
          let match = null;
          if ((match = /-(\w)/.exec(key)) !== null) {
            const char = match[1];
            key = key.replace(`-${char}`, char.toUpperCase());
          }
          value = value.trim();
          styles[key] = feed(value, refs).join('');
        }
        attributes[key] = styles;
      }
      else {
        attributes[key] = feed(slice, refs).join('');
      }
    }
  }
  const children: ReactElement[] = [];
  (node.childNodes ?? []).forEach((child) => children.push(...render(child, refs)));
  if (create == null) {
    throw 'Invalid state! Figure was not initialized!';
  }
  return [create(tag, attributes, ...children)];
}

function css(slices: Slices, ...values: Values): ReactElement {
  const [css, refs] = compose(slices, values);
  return html`
    <style type="text/css">
      ${feed(css, refs).join('')}
    </style>
  `;
}

function style(slices: Slices, ...values: Values): Record<string, string> {
  const [css, refs] = compose(slices, values);
  const styles: Record<string, string> = {};
  for (const item of css.split(';')) {
    if (item.trim().length === 0) {
      break;
    }
    let [key, value] = item.split(':');
    key = key.trim();
    let match = null;
    if ((match = /-(\w)/.exec(key)) !== null) {
      const char = match[1];
      key = key.replace(`-${char}`, char.toUpperCase());
    }
    value = value.trim();
    styles[key] = feed(value, refs).join('');
  }
  return styles;
}

export { figure, html, dyn, css, style };
