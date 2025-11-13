export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  
  // CSS global - FORMA CORRETA para Vuetify 3
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  
  // Build configuration
  build: {
    transpile: ['vuetify']
  },

  // Adicionar o plugin de máscara
  plugins: [
    '~/plugins/mask.ts'
  ],
  
  // Configuração de compatibilidade
  compatibilityDate: '2024-11-12'
})