# figure
Reactive template literals for React

### Example

```javascript
import figure from '...';

const { html, dyn } = figure({ createElement });

const global = createContext({});

function App() {
  const [name, setName] = useState('world');

  const context = {};

  return html`
    ${dyn(global.Provider, { value: context }), html`
      <h1>Hello ${name}!</h1>
      <p>Some description text.</p>
    `}
  `;
}

render(createElement(App), document.querySelector('#root'));
```
