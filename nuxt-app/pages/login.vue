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

                <!-- Link para Esqueci Senha - VISÍVEL -->
                <div class="text-right mb-4">
                  <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    @click="showForgotPassword = true"
                    class="text-caption"
                  >
                    <v-icon size="small" class="mr-1">mdi-lock-reset</v-icon>
                    Esqueci minha senha
                  </v-btn>
                </div>

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
                :type="errorColor"
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

      <!-- Dialog de Registro SIMPLIFICADO -->
      <v-dialog v-model="showRegister" max-width="500">
        <v-card class="custom-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Criar Conta</span>
            <v-btn icon @click="closeRegister" class="custom-card">
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

              <!-- Campo de Departamento -->
              <v-select
                v-model="registerDepartment"
                label="Departamento"
                :items="departments"
                variant="outlined"
                prepend-inner-icon="mdi-office-building"
                required
                class="mb-4"
              ></v-select>

              <!-- Campo de Role -->
              <v-select
                v-model="registerRole"
                label="Função"
                :items="roles"
                variant="outlined"
                prepend-inner-icon="mdi-account-cog"
                class="mb-4"
              ></v-select>

              <!-- BOTÕES VISÍVEIS -->
              <div class="d-flex flex-column gap-3 mt-6">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="registerLoading"
                  block
                  size="large"
                >
                  <v-icon left>mdi-account-plus</v-icon>
                  Criar Conta
                </v-btn>
                
                <v-btn
                  variant="outlined"
                  color="grey-darken-1"
                  @click="closeRegister"
                  block
                  size="large"
                >
                  Cancelar
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Modal de Recuperação de Senha -->
      <v-dialog v-model="showForgotPassword" max-width="500">
        <v-card class="custom-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Recuperar Senha</span>
            <v-btn 
              icon 
              @click="closeForgotPassword" 
              class="custom-card"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-6">
            <div v-if="!passwordResetSent">
              <p class="text-body-1 mb-4">
                Digite seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
              </p>
              
              <v-form @submit.prevent="requestPasswordReset">
                <v-text-field
                  v-model="forgotEmail"
                  label="E-mail"
                  type="email"
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  required
                  class="mb-6"
                ></v-text-field>

                <div class="d-flex flex-column gap-3">
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    :loading="forgotLoading"
                    block
                  >
                    <v-icon left>mdi-send</v-icon>
                    Enviar Link de Recuperação
                  </v-btn>
                  
                  <v-btn
                    variant="outlined"
                    color="grey-darken-1"
                    @click="closeForgotPassword"
                    block
                  >
                    Voltar ao Login
                  </v-btn>
                </div>
              </v-form>
            </div>
            
            <div v-else class="text-center py-6">
              <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
              <h3 class="text-h5 mb-2">E-mail Enviado!</h3>
              <p class="text-body-1 mb-4">
                Enviamos um link de recuperação para <strong>{{ forgotEmail }}</strong>.
                Verifique sua caixa de entrada.
              </p>
              <v-btn
                color="primary"
                @click="closeForgotPassword"
                block
              >
                Voltar ao Login
              </v-btn>
            </div>
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
import { ref } from 'vue'

// Estado do login
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const errorColor = ref('error')

// Estado do registro
const showRegister = ref(false)
const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerDepartment = ref('ADMINISTRATIVO')
const registerRole = ref('USER')
const registerLoading = ref(false)

// Estado para recuperação de senha
const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotLoading = ref(false)
const passwordResetSent = ref(false)

// Listas para selects
const departments = [
  { title: 'Administrativo', value: 'ADMINISTRATIVO' },
  { title: 'Vendas', value: 'VENDAS' },
  { title: 'Engenharia', value: 'ENGENHARIA' },
  { title: 'Compras', value: 'COMPRAS' },
  { title: 'PCP', value: 'PCP' },
  { title: 'Qualidade', value: 'QUALIDADE' },
  { title: 'Estoque', value: 'ESTOQUE' },
  { title: 'Montagem', value: 'MONTAGEM' },
  { title: 'Expedição', value: 'EXPEDICAO' }
]

const roles = [
  { title: 'Usuário', value: 'USER' },
  { title: 'Vendas', value: 'VENDAS' },
  { title: 'Engenheiro', value: 'ENGENHEIRO' },
  { title: 'Comprador', value: 'COMPRADOR' },
  { title: 'PCP', value: 'PCP' },
  { title: 'Qualidade', value: 'QUALIDADE' },
  { title: 'Estoque', value: 'ESTOQUE' },
  { title: 'Gerente', value: 'GERENTE' },
  { title: 'Administrador', value: 'ADMIN' }
]

// Função de login
const handleLogin = async () => {
  loading.value = true
  error.value = ''
  errorColor.value = 'error'

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
    errorColor.value = 'error'
  } finally {
    loading.value = false
  }
}

// Funções para o modal de registro
const closeRegister = () => {
  showRegister.value = false
  resetRegisterForm()
}

const resetRegisterForm = () => {
  registerName.value = ''
  registerEmail.value = ''
  registerPassword.value = ''
  registerDepartment.value = 'ADMINISTRATIVO'
  registerRole.value = 'USER'
}

// Função de registro SIMPLIFICADA
const handleRegister = async () => {
  // Validação básica
  if (!registerName.value || !registerEmail.value || !registerPassword.value || !registerDepartment.value) {
    error.value = 'Por favor, preencha todos os campos obrigatórios'
    errorColor.value = 'error'
    return
  }
  
  if (registerPassword.value.length < 6) {
    error.value = 'A senha deve ter pelo menos 6 caracteres'
    errorColor.value = 'error'
    return
  }
  
  registerLoading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: registerName.value,
        email: registerEmail.value,
        password: registerPassword.value,
        department: registerDepartment.value,
        role: registerRole.value
      }
    })

    if (response.success) {
      showRegister.value = false
      resetRegisterForm()
      
      // Mostrar mensagem de sucesso
      error.value = '✅ Cadastro realizado com sucesso! Faça login.'
      errorColor.value = 'success'
      
      // Autofill do email no login
      email.value = response.user.email
    }
  } catch (err) {
    error.value = err.data?.message || 'Erro ao cadastrar'
    errorColor.value = 'error'
  } finally {
    registerLoading.value = false
  }
}

// Funções para recuperação de senha
const closeForgotPassword = () => {
  showForgotPassword.value = false
  passwordResetSent.value = false
  forgotEmail.value = ''
}

const requestPasswordReset = async () => {
  if (!forgotEmail.value) {
    error.value = 'Por favor, insira um e-mail válido'
    errorColor.value = 'error'
    return
  }
  
  forgotLoading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: forgotEmail.value
      }
    })

    if (response.success) {
      passwordResetSent.value = true
    } else {
      error.value = response.message || 'Erro ao solicitar recuperação de senha'
      errorColor.value = 'error'
    }
  } catch (err) {
    error.value = err.data?.message || 'Erro ao solicitar recuperação de senha'
    errorColor.value = 'error'
  } finally {
    forgotLoading.value = false
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

.gap-3 {
  gap: 12px;
}

/* Melhorando o efeito glass */
.glass-effect {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.custom-card {
  border-radius: 12px !important;
}
</style>