import { defineNuxtPlugin } from '#app'
import { createMask } from 'vue-the-mask'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('mask', createMask)
})