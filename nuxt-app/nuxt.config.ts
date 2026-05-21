export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,

  app: {
    head: {
      script: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js' }
      ]
    }
  },

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

  // Configuração do Vite para SCSS e Host
  vite: {
    server: {
      allowedHosts: ['somehsystem.tail0ddfd0.ts.net']
    },
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