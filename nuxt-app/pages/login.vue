<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <v-row no-gutters class="fill-height">
          <!-- Lado Esquerdo - Formulário -->
          <v-col cols="12" md="6" class="d-flex align-center justify-center">
            <v-card variant="flat" class="pa-8" max-width="450">
              <v-card-text class="text-center pa-0">
                <v-icon 
                  icon="mdi-factory" 
                  size="64" 
                  color="primary" 
                  class="mb-4"
                ></v-icon>
                <h1 class="text-h4 font-weight-bold mb-2">Sistema de Produção</h1>
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
                class="mt-4"
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

          <!-- Lado Direito - Banner -->
          <v-col cols="12" md="6" class="d-none d-md-flex">
            <div class="login-banner fill-height d-flex align-center justify-center">
              <div class="text-center text-white pa-8">
                <v-icon icon="mdi-cog" size="80" class="mb-4"></v-icon>
                <h2 class="text-h3 font-weight-bold mb-4">Controle de Produção</h2>
                <p class="text-h6 font-weight-regular">
                  Gerencie suas ordens de produção de forma eficiente
                </p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Dialog de Registro -->
      <v-dialog v-model="showRegister" max-width="500">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Criar Conta</span>
            <v-btn icon @click="showRegister = false">
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
                >
                  Cancelar
                </v-btn>
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
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
.login-banner {
  background: linear-gradient(135deg, var(--v-primary-base), var(--v-secondary-base));
}

.fill-height {
  height: 100vh;
}

.gap-2 {
  gap: 8px;
}
</style>
