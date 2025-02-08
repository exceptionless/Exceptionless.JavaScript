<script>
  import { Exceptionless } from "@exceptionless/browser";

  let message = $state("");
  let errorInfo = $state("");

  async function submitMessage() {
    await Exceptionless.submitLog("Hello, world!");
    errorInfo = "";
    message = "Hello, world!";
  };

  async function tryCatchExample() {
    try {
      throw new Error("Caught in the try/catch");
    } catch (error) {
      message = "";
      if (error instanceof Error) {
        errorInfo = error.message;
        await Exceptionless.submitException(error);
      }
    }
  };

  function unhandledExceptionExample() {
    throw new Error("Unhandled exception");
  };
</script>

<div class="App">
  <header class="App-header">
    <div class="container">
      <h1 class="App-title">Exceptionless Svelte Sample</h1>
      <div>
        <p>
          Throw an uncaught error and make sure Exceptionless tracks it.
        </p>
        <button onclick={unhandledExceptionExample}>
          Throw unhandled error
        </button>
      </div>
      <p>
        The following buttons simulated handled events outside the
        component.
      </p>
      <button onclick={submitMessage}>Submit Message</button>
      {#if message}
        <p>
          Message sent to Exceptionless:{" "}
          <code>{message}</code>
        </p>
      {/if}
      <button onclick={tryCatchExample}>Try/Catch Example</button>
      {#if errorInfo}
        <p>
          Error message sent to Exceptionless:{" "}
          <code>{errorInfo}</code>
        </p>
      {/if}
    </div>
  </header>
</div>

<style>
.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.container {
  max-width: 85%;
  margin: auto;
}
</style>
