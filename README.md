# segment
Reactive template literals for React

### Example

```javascript
import {segment, html, css} from './segment.js';

segment({createElement});

const Counter = () => {
  const [count, setCount] = useState(0);

  const style = css`
    .counter { ... }
  `;

  return html`
    <div class="counter">
      ${style}
      <button @click="${() => setCount(count - 1)}">-</button>
      <p>${count}</p>
      <button @click="${() => setCount(count + 1)}">+</button>
    </div>
  `;
}

render(createElement(Counter), document.querySelector('#app'));
```
