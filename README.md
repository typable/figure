# figure
Reactive template literals for React

### Example

```javascript
import {figure, html, css} from '...';

figure({ createElement });

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
