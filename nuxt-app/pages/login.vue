<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0 d-flex align-center justify-center login-container">
        <v-row no-gutters class="fill-height">
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
                <p class="text-body-1 text-medium-emphasis mb-6">
                  Faça login para acessar o sistema
                </p>
              </v-card-text>

              <v-form @submit.prevent="handleLogin" class="mt-4">
                <v-text-field
                  v-model="email"
                  label="E-mail"
                  type="email"
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  required
                  class="mb-4"
                ></v-text-field>

                <v-text-field
                  v-model="password"
                  label="Senha"
                  type="password"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  required
                  class="mb-2"
                ></v-text-field>

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  class="mt-2"
                >
                  <template v-slot:loader>
                    <v-progress-circular
                      indeterminate
                      size="20"
                      color="white"
                    ></v-progress-circular>
                  </template>
                  Entrar
                </v-btn>
              </v-form>

              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mt-4 custom-card"
              >
                {{ error }}
              </v-alert>

              <v-divider class="my-6"></v-divider>

              <div class="text-center">
                <v-btn
                  variant="text"
                  color="primary"
                  @click="showRegister = true"
                >
                  Criar nova conta
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Dialog de Registro -->
      <v-dialog v-model="showRegister" max-width="500">
        <v-card class="custom-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Criar Conta</span>
            <v-btn icon @click="showRegister = false" class="custom-card">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="registerName"
                label="Nome completo"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                required
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="registerEmail"
                label="E-mail"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                required
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="registerPassword"
                label="Senha"
                type="password"
                variant="outlined"
                prepend-inner-icon="mdi-lock"
                required
                class="mb-4"
              ></v-text-field>

              <div class="d-flex gap-2">
                <v-btn
                  variant="outlined"
                  block
                  @click="showRegister = false"
                  class="custom-card"
                >
                  Cancelar
                </v-btn>
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
                  class="custom-card"
                >
                  Cadastrar
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
definePageMeta({
  layout: false
})

// Importar a logo
import logo from '@/assets/imagens/logo-someh-fundo-claro.png'

// Estado do login
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Estado do registro
const showRegister = ref(false)
const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

// Função de login
const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (response.success) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      window.location.href = '/'
    }
  } catch (err) {
    error.value = err.data?.message || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}

// Função de registro
const handleRegister = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: registerName.value,
        email: registerEmail.value,
        password: registerPassword.value
      }
    })

    if (response.success) {
      showRegister.value = false
      registerName.value = ''
      registerEmail.value = ''
      registerPassword.value = ''
      error.value = 'Cadastro realizado com sucesso! Faça login.'
    }
  } catch (err) {
    error.value = err.data?.message || 'Erro ao cadastrar'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
}

.fill-height {
  height: 100vh;
}

.gap-2 {
  gap: 8px;
}

/* Melhorando o efeito glass */
.glass-effect {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}
</style>