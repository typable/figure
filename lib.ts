import { Options, Props, ReactElement, ReactFunction, Refs, Slices, Values, Dict } from './types.ts';

export default function figure({ createElement }: Options) {

  // the parser for interpreting HTML
  const parser = new DOMParser();
  // the counter for creating unique references
  let count = 0;

  /**
   * Returns the a function for rendering HTML.
   * @param {Dict} dict - The dictionary for resolving React components.
   * @return {Function} The function for rendering HTML.
   */
  function dict(dict?: Dict): (slices: Slices, ...values: Values) => ReactElement[] {

    /**
     * Converts the template literal HTML syntax into React elements.
     * @param {Slices} slices - The template literal slices
     * @param {Values} values - The template literal values
     * @return {ReactElement[]} The converted HTML as React elements.
     */
    function html(slices: Slices, ...values: Values): ReactElement[] {
      const [html, refs] = compose(slices, values);
      let dom;
      try {
        dom = parser.parseFromString(html, 'text/html');
      }
      catch (error) {
        console.error(error);
        throw 'Invalid DOM structure!';
      }
      // collect all nodes from head and body
      const nodes = [...dom.head.childNodes, ...dom.body.childNodes];
      return nodes.map((node) => render(node, refs, dict ?? {}));
    }

    return html;
  }

  /**
   * Joins the template literal slices together and replaces the values with references.
   * The values are being mapped to there corresponding references and with the populated
   * HTML string returned.
   *
   * @param {Slices} slices - The template literal slices
   * @param {Values} values - The template literal values
   * @return {[string, Refs]} The joined HTML string and the values mapped to there references.
   */
  function compose(slices: Slices, values: Values): [string, Refs] {
    if (slices == null) {
      // handle dyn function without body
      return ['', {}];
    }
    const refs: Refs = {};
    let slice = '';
    for (let i = 0; i < slices.length; i++) {
      slice += slices[i];
      if (values[i] != null) {
        const uid = `$fig-${count++}`;
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
   * @param {Refs} refs - The values mapped to there references
   * @return {ReactElement[]} The string populated with the passed values
   */
  function feed(slice: string, refs: Refs): ReactElement[] {
    const expr = /\$fig-\d+/g;
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

  /**
   * Converts a HTML node into a React element.
   *
   * @param {Node} node - The HTML node
   * @param {Refs} refs - The values mapped to there references
   * @return {ReactElement[]} The converted HTML node as React element
   */
  function render(node: Node, refs: Refs, dict: Dict): ReactElement[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      if (text.textContent == null) {
        // ignore empty text nodes
        return [];
      }
      return feed(text.textContent, refs);
    }
    if (node.nodeType === Node.COMMENT_NODE) {
      // ignore comments
      return [];
    }
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const props: Props = {};
    // iterate over each attribute and add it to the props
    for (const attribute of element.attributes) {
      const key = attribute.name;
      const slice = attribute.textContent;
      if (slice == null) {
        // ignore empty attribute values
        continue;
      }
      let isDynamic = false;
      for (const ref in refs) {
        if (slice === ref) {
          let match = null;
          if ((match = /^on:(\w+)$/.exec(key)) !== null) {
            // add event to props
            const event = match[1];
            props[`on${event.substring(0, 1).toUpperCase()}${event.substring(1)}`] = refs[ref];
          }
          else {
            // add attribute to props
            props[key] = refs[ref];
          }
          isDynamic = true;
          break;
        }
      }
      if (!isDynamic) {
        if (key === 'style') {
          // convert style attribute into object format
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
          props[key] = styles;
        }
        else {
          props[key] = feed(slice, refs).join('');
        }
      }
    }
    const children: ReactElement[] = [];
    // recursively render all child nodes
    (node.childNodes ?? []).forEach((child) => children.push(...render(child, refs, dict)));
    const domain = tag.split(':');
    // look up tag name in dictionary
    // deno-lint-ignore no-explicit-any
    const component: ReactFunction | undefined = domain.reduce((dict: any, level) => {
      return dict?.[level];
    }, dict);
    // use React component or tag name
    return [createElement(component ?? tag, props, ...children)];
  }

  return { dict };
}
