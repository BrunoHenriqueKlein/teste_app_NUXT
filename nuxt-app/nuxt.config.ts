export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  
  // CSS global - FORMA CORRETA
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
    '@/assets/css/global.css' // APENAS o CSS global
    // REMOVIDA a importação do SCSS aqui
  ],
  
  // Build configuration
  build: {
    transpile: ['vuetify']
  },

  // Configuração do Vite para SCSS (CORRIGIDA)
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/scss/variables.scss" as *;
          `
        }
      }
    }
  },

  // Configuração do Vuetify com SUAS cores
  vuetify: {
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#1867C0', // SUA COR PRIMARY
            secondary: '#5CBBF6', // SUA COR SECONDARY
            accent: '#005CAF', // SUA COR ACCENT
          }
        }
      }
    }
  },

  // Adicionar o plugin de máscara
  plugins: [
    '~/plugins/mask.ts'
  ],
  
  // Configuração de compatibilidade
  compatibilityDate: '2024-11-12'
})