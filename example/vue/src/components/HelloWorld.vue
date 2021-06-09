<template>
  <div>
    <h1>{{ msg }}</h1>

    <p>
      This simple example will allow you to test the Exceptionless client configuration by submitting messages and errors.
    </p>

    <button @click="throwError">Simulate Error</button>
    <button @click="throwUnhandledError" style="margin-left: 10px">Simulate Unhandled Error</button>
    <div v-if="state.error">
      <p>
        Error message sent to Exceptionless:
      </p>
      <div style="margin-top: 20px;">
        <code style="padding: 20px; background: #282828; color: #fff;">{{state.error}}</code>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, reactive } from 'vue';
import { Exceptionless } from "@exceptionless/vue";

defineProps({
  msg: String
})

const state = reactive({ error: "" })

const throwError = async () => {
  try {
    throw new Error("Whoops, it broke");
  } catch (error) {
    state.error = error.message;
    await Exceptionless.submitException(error);
  }
}

const throwUnhandledError = () => {
    throw new Error("Unhandled Vue Error");
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
