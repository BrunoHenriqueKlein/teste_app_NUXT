<template>
  <div class="fill-height pa-0 d-flex align-center justify-center login-container w-100">
    <v-row no-gutters class="fill-height justify-center align-center">
      <v-col cols="12" class="d-flex align-center justify-center">
            <v-card variant="flat" class="pa-8 mx-auto custom-card glass-effect" max-width="450" width="100%">
              <v-card-text class="text-center pa-0">
                <v-img
                  :src="logo"
                  alt="Logo SOMEH"
                  :width="250"
                  :height="120"
                  class="mx-auto mb-4"
                  contain
                />
                <h2 class="text-h4 mb-2">Redefinir Senha</h2>
                <p class="text-body-1 text-medium-emphasis mb-6">
                  Digite sua nova senha
                </p>
              </v-card-text>

              <v-form @submit.prevent="resetPassword" ref="resetForm" class="mt-4">
                <v-text-field
                  v-model="password"
                  label="Nova Senha"
                  type="password"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  required
                  :rules="[
                    v => !!v || 'Senha é obrigatória',
                    v => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres'
                  ]"
                  class="mb-4"
                ></v-text-field>

                <v-text-field
                  v-model="confirmPassword"
                  label="Confirmar Nova Senha"
                  type="password"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock-check"
                  required
                  :rules="[
                    v => !!v || 'Confirmação é obrigatória',
                    v => v === password || 'As senhas não coincidem'
                  ]"
                  class="mb-6"
                ></v-text-field>

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  class="mt-2 mb-3"
                >
                  Redefinir Senha
                </v-btn>

                <div class="text-center">
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="$router.push('/login')"
                    class="mt-2"
                  >
                    Voltar para o Login
                  </v-btn>
                </div>
              </v-form>

              <v-alert
                v-if="message"
                :type="alertType"
                variant="tonal"
                class="mt-4"
              >
                {{ message }}
              </v-alert>
            </v-card>
          </v-col>
    </v-row>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Importar logo
import logo from '@/assets/imagens/logo-someh-fundo-claro.png'

// Estado
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const alertType = ref('info')
const resetForm = ref(null)
const token = ref('')

// Verificar token na URL
onMounted(() => {
  token.value = route.query.token
  
  if (!token.value) {
    message.value = 'Token inválido ou expirado'
    alertType.value = 'error'
  }
})

// Função para redefinir senha
const resetPassword = async () => {
  const { valid } = await resetForm.value.validate()
  
  if (!valid) {
    message.value = 'Por favor, preencha todos os campos corretamente'
    alertType.value = 'error'
    return
  }
  
  if (!token.value) {
    message.value = 'Token inválido ou expirado'
    alertType.value = 'error'
    return
  }
  
  loading.value = true
  message.value = ''

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value
      }
    })

    if (response.success) {
      message.value = '✅ Senha redefinida com sucesso! Redirecionando para login...'
      alertType.value = 'success'
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      message.value = response.message || 'Erro ao redefinir senha'
      alertType.value = 'error'
    }
  } catch (err) {
    message.value = err.data?.message || 'Erro ao redefinir senha'
    alertType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Mesmos estilos da página de login */
.login-container {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
}

.fill-height {
  height: 100vh;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}
</style>