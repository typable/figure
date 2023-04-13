# figure

### The vanilla alternative for writing JSX-based React applications
<br/>

The figure framework offers a unique approach to writing React applications by leveraging vanilla JavaScript syntax instead of JSX, making it an excellent tool for programmers who prefer to avoid the bloat of the NodeJS/npm ecosystem. With its use of template literals, figure provides a more natural way of writing code, making it ideal for building smaller applications.

If you're looking for a more efficient way to build React applications, figure might just be the tool you need.
<br/>
<br/>

```javascript
import figure from 'https://cdn.typable.dev/figure';

const { dict } = figure(React.createElement);
const html = dict();

function App() {
  return html`
    <h1>I figured it out!</h1>
  `;
}
```
