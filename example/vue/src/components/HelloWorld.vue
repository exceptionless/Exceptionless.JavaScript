<template>
  <div>
    <h1>{{ msg }}</h1>

    <p>
      This simple example will allow you to test the Exceptionless client configuration by submitting messages and errors. 
    </p>

    <button @click="throwError">Simulate Error</button>
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
import { defineProps, reactive } from 'vue'

defineProps({
  msg: String
})

const state = reactive({ error: "" })

const throwError = () => {
  try {
    throw new Error("Whoops, it broke");
  } catch (error) {
    state.error = error.message;
    Exceptionless.submitException(error);
  }
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
