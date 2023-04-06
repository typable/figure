# figure
Reactive template literals for React

### Example

```javascript
import figure from '...';

// initialize figure
const { dict } = figure({ createElement });

// add your components to a bundle
const ElementBundle = {
  button: Button,
};

// add your bundles to the dictionary
const html = dict({
  el: ElementBundle,
});

function App() {
  return html`
    <main>
      <el:button
        type="primary"
        on:click=${() => console.log('It works!')}
      >
        <span>Click me</span>
      </el:button>
    </main>
  `;
}

function Button() {
  return html`
    <button
      on:click=${props?.onClick}
      class="btn btn--${props?.type}"
    >
      ${props?.children}
    </button>
  `;
}

render(createElement(App), document.querySelector('#root'));
```
