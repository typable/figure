export const defCss = ({html, compose, feed}) => {
  return (strings, ...props) => {
    const [css, refs] = compose(strings, props);
    return html`
      <style type="text/css">
        ${feed(css, refs).join('')}
      </style>
    `;
  };
}

export const defStyle = ({compose, feed}) => {
  return (strings, ...props) => {
    const [css, refs] = compose(strings, props);
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
      styles[key] = feed(value, refs).join('');
    }
    return styles;
  };
}
