## Exceptionless Browser

This package provides native JavaScript support for applications that are built in vanilla HTML and JS.

### Installation

**Package Managers**

`npm install @exceptionless/browser`

or

`yarn add @exceptionless/browser`


### Configuration

```js
await Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
  c.setUserIdentity("12345678", "Blake");
  c.useSessions();
  c.defaultTags.push("Example", "JavaScript");
});
```
