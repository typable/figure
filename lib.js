// @ts-check

/**
 * @typedef {Object} ReactElement
 * @typedef {function(Props=): ReactElement} ReactFunction
 * @typedef {function(ReactFunction | string, Props?=, ...Object): ReactElement} ReactCreateFunction
 *
 * @typedef {TemplateStringsArray} Slices
 * @typedef {any} Value
 * @typedef {{[key: string]: any}} Refs
 * @typedef {any} Props
 * @typedef {{[key: string]: ReactFunction | Dict}} Dict
 * @typedef {{ dict: DictFunction, dyn: DynFunction }} Figure
 *
 * @typedef {function(Dict=): HTMLFunction} DictFunction
 * @typedef {function(Slices, ...Value): ReactElement[]} HTMLFunction
 * @typedef {ReactCreateFunction} DynFunction
 */

const EVENTS = [
  'onCopy',
  'onCut',
  'onPaste',
  'onCompositionEnd',
  'onCompositionStart',
  'onCompositionUpdate',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onFocus',
  'onBlur',
  'onChange',
  'onInput',
  'onInvalid',
  'onReset',
  'onSubmit',
  'onError',
  'onLoad',
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onDrag',
  'onDragEnd',
  'onDragEnter',
  'onDragExit',
  'onDragLeave',
  'onDragOver',
  'onDragStart',
  'onDrop',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp',
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerCancel',
  'onGotPointerCapture',
  'onLostPointerCapture',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerOver',
  'onPointerOut',
  'onSelect',
  'onTouchCancel',
  'onTouchEnd',
  'onTouchMove',
  'onTouchStart',
  'onScroll',
  'onWheel',
  'onAbort',
  'onCanPlay',
  'onCanPlayThrough',
  'onDurationChange',
  'onEmptied',
  'onEncrypted',
  'onEnded',
  'onLoadedData',
  'onLoadedMetadata',
  'onLoadStart',
  'onPause',
  'onPlay',
  'onPlaying',
  'onProgress',
  'onRateChange',
  'onSeeked',
  'onSeeking',
  'onStalled',
  'onSuspend',
  'onTimeUpdate',
  'onVolumeChange',
  'onWaiting',
  'onAnimationStart',
  'onAnimationEnd',
  'onAnimationIteration',
  'onTransitionEnd',
  'onToggle',
];

/**
 * Initializes the figure framework.
 *
 * @param {ReactCreateFunction} create The React createElement function
 * @returns {Figure} The util functions collected in an object
 */
export default function figure(create) {

  // the parser for interpreting HTML
  const parser = new DOMParser();
  // the counter for creating unique references
  let count = 0;

  /**
   * Returns the a function for rendering HTML.
   *
   * @param {Dict} [dict] The dictionary for resolving React components
   * @returns {HTMLFunction} The function for rendering HTML
   */
  function dict(dict) {

    /**
     * Converts the template literal HTML syntax into React elements.
     *
     * @param {Slices} slices The template literal slices
     * @param {...Value} values The template literal values
     * @returns {ReactElement[]} The converted HTML as React elements
     */
    function html(slices, ...values) {
      const [html, refs] = compose(slices, values);
      try {
        const dom = parser.parseFromString(html, 'text/html');
        // collect all nodes from head and body
        const nodes = [...dom.head.childNodes, ...dom.body.childNodes];
        return nodes.map((node) => render(node, refs, dict ?? {}));
      }
      catch (error) {
        console.error(error);
        throw 'Invalid DOM structure!';
      }
    }

    return html;
  }
  
  /**
   * Joins the template literal slices together and replaces the values with references.
   * The values are being mapped to there corresponding references and with the populated
   * HTML string returned.
   *
   * @param {Slices} slices The template literal slices
   * @param {Value[]} values The template literal values
   * @returns {[string, Refs]} The joined HTML string and the values mapped to there references
   */
  function compose(slices, values) {
    if (slices == null) {
      // handle dyn function without body
      return ['', {}];
    }
    const refs = /** @type {Refs} */ ({});
    let slice = '';
    for (let i = 0; i < slices.length; i++) {
      slice += slices[i];
      if (values[i] != null) {
        // create unique reference
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
   * @param {string} slice The string containing references
   * @param {Refs} refs The values mapped to there references
   * @returns {ReactElement[]} The string populated with the passed values
   */
  function feed(slice, refs) {
    const expr = /\$fig-\d+/g;
    const elements = /** @type {ReactElement[]} */ ([]);
    let match = null;
    let last = 0;
    while ((match = expr.exec(slice)) !== null) {
      const index = match.index;
      const uid = match[0];
      const before = slice.substring(last, index);
      // ignore empty strings
      if (before.length > 0) {
        elements.push(before);
      }
      const value = refs[uid];
      // ignore empty values
      if (value !== undefined && value !== null) {
        elements.push(value);
      }
      last = index + uid.length;
    }
    const after = slice.substring(last);
    // ignore empty strings
    if (after.length > 0) {
      elements.push(after);
    }
    return elements;
  }

  /**
   * Converts a HTML node into a React element.
   *
   * @param {Node} node The HTML node
   * @param {Refs} refs The values mapped to there references
   * @param {Dict} dict The dictionary for resolving React components
   * @returns {ReactElement[]} The converted HTML node as React element
   */
  function render(node, refs, dict) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = /** @type {Text} */ (node);
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
    const element = /** @type {HTMLElement} */ (node);
    const tag = element.tagName.toLowerCase();
    const props = /** @type {Props} */ ({});
    // iterate over each attribute and add it to the props
    for (const attribute of element.attributes) {
      const key = attribute.name;
      const slice = attribute.textContent;
      if (slice == null) {
        // ignore empty attribute values
        continue;
      }
      const values = feed(slice, refs);
      const value = values.length == 1 ? values[0] : values;
      let attr = key;
      const eventMatch = /^(\w+):(\w+)$/.exec(attr);
      if (eventMatch) {
        // camel case attribute name
        const [, pre, name] = eventMatch;
        for (const event of EVENTS) {
          // find matching event name
          if (`${pre}${name}` === event.toLowerCase()) {
            attr = event;
            break;
          }
        }
      }
      props[attr] = value instanceof Array ? value.join('') : value;
    }
    const children = /** @type {ReactElement[]} */ ([]);
    // recursively render all child nodes
    (node.childNodes ?? []).forEach((child) => children.push(...render(child, refs, dict)));
    const domains = tag.split(':');
    let component = /** @type {ReactFunction | null} */ (null);
    let layer = /** @type {Dict | ReactFunction | null} */ (dict);
    // look up tag name in dictionary
    for (const domain of domains) {
      if (layer && typeof layer === 'object' && layer[domain]) {
        // traverse sublayer
        layer = /** @type {Dict} */ (layer[domain]);
        continue;
      }
      // domain is not in layer
      layer = null;
      break;
    }
    if (layer) {
      // found component for tag
      component = /** @type {ReactFunction} */ (layer);
    }
    // use React component or tag name
    return [create(component ?? tag, props, ...children)];
  }

  return { dict, dyn: create };
}
