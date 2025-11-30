export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  
  // CSS global
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
    '@/assets/css/global.css'
  ],
  
  // Build configuration
  build: {
    transpile: ['vuetify']
  },

  // ✅ ADICIONE: Configuração do Nitro para o Prisma
  nitro: {
    plugins: ['~/server/plugins/prisma.ts']
  },

  // Configuração do Vite para SCSS
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

  // Configuração do Vuetify
  vuetify: {
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#1867C0',
            secondary: '#5CBBF6',
            accent: '#005CAF',
          }
        }
      }
    }
  },

  plugins: [
    '~/plugins/mask.ts'
  ],
  
  compatibilityDate: '2024-11-12'
})