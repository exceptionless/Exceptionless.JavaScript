## Exceptionless React

The Exceptionless React package provides a native way to handle errors and events in React. This means errors inside your components, which tend to crash your entire app, can be sent to Exceptionless and you can be alerted. Additionally, you can use this package to catch errors throughout your non-component functions such as in Redux actions, utility functions, etc. 

### Getting Started 

To use this package, your must be using ES6 and Node 15+. 

**Install** 

NPM: 

`npm install @exceptionless/react` 

Yarn: 

`yarn add @exceptionless/react` 

### Configuration 

Inside your `index.js` file or your `App.js` file, you can configure and start Exceptionless as follows.

**Class Components**

```jsx
class App extends Component {
  async componentDidMount() {
    await Exceptionless.startup((c) => {
      c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw"; //Replace with your API key
      c.serverUrl = "http://localhost:5000"; //Remove if using the hosted version of Exceptionless
    });
  }

  render() {
    return (
      <ExceptionlessErrorBoundary>
        <div>
          // YOUR APP COMPONENTS HERE
        </div>
      </ExceptionlessErrorBoundary>
    );
  }
}

export default App;
```

### Handling Events 

While errors within the components themselves are automatically sent to Exceptionless, you will still want to handle events that happen outside the components. 

Because the Exceptionless client is a singleton, it is available anywhere in your app where you import it. Here's an example from a file we'll call `utilities.js`.

```js
export const myUtilityFunction = () => {
  try {
    //  Handle successful run of code
  } catch(e) {
    //  If there's an error, send it to Exceptionless
    Exceptionless.submitException(e);
  }
}
```

You can also sent events and logs that are not errors by simply calling the built-in methods on the Exceptionless class: 

```js
Exceptionless.submitLog("Hello, world!");
Exceptionless.submitFeatureUsage("New Shopping Cart Feature");
```
