// Importações do Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Importar estilos do Vuetify
import 'vuetify/styles'

export default defineNuxtPlugin((nuxtApp) => {
  const themeCookie = useCookie('theme', { default: () => 'light' })

  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: themeCookie.value || 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#1867C0', // Azul SOMEH padrão
            secondary: '#5CBBF6',
            accent: '#005CAF',
            error: '#D32F2F',
            info: '#1976D2',
            success: '#388E3C',
            warning: '#FBC02D',
            background: '#F5F5F5',
            surface: '#FFFFFF',
          }
        },
        dark: {
          dark: true,
          colors: {
            primary: '#516475', // Cinza-Azulado solicitado
            secondary: '#37474F',
            accent: '#607D8B',
            error: '#CF6679',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
            background: '#000000', // Preto Puro
            surface: '#394149ff',  // Superfície levemente mais clara que o fundo
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})