# figure
The vanilla alternative for writing JSX-based React applications

### Example

```javascript
import figure from '...';

// initialize figure
const { dict } = figure(React.createElement);

// add your component to the dictionary
const html = dict({
  el: {
    button: Button,
  },
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

// render your App component as usual
const root = document.querySelector('#root');
ReactDOM.render(React.createElement(App), root);
```
