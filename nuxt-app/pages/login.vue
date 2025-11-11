<template>
  <div class="login-container">
    <div class="login-form">
      <h1>Login</h1>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">E-mail:</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="seu@email.com"
            class="input-field"
          />
        </div>

        <div class="form-group">
          <label for="password">Senha:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Sua senha"
            class="input-field"
          />
        </div>

        <button type="submit" :disabled="loading" class="login-button">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="register-link">
        <p>Não tem conta? <a href="#" @click.prevent="showRegister = true">Cadastre-se</a></p>
      </div>

      <!-- Formulário de Registro -->
      <div v-if="showRegister" class="register-form">
        <h2>Cadastro</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="registerName">Nome:</label>
            <input
              id="registerName"
              v-model="registerName"
              type="text"
              required
              placeholder="Seu nome"
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label for="registerEmail">E-mail:</label>
            <input
              id="registerEmail"
              v-model="registerEmail"
              type="email"
              required
              placeholder="seu@email.com"
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label for="registerPassword">Senha:</label>
            <input
              id="registerPassword"
              v-model="registerPassword"
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              class="input-field"
            />
          </div>

          <button type="submit" :disabled="loading" class="register-button">
            {{ loading ? 'Cadastrando...' : 'Cadastrar' }}
          </button>
          
          <button type="button" @click="showRegister = false" class="cancel-button">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
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
    // Salva o token
    localStorage.setItem('authToken', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    // Forçar recarregamento para garantir que o middleware funcione
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
      // Limpa o formulário e mostra mensagem de sucesso
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
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #007bff;
}

.login-button, .register-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.login-button:disabled, .register-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.login-button:hover:not(:disabled), .register-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.cancel-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #545b62;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.register-form {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.register-form h2 {
  margin-bottom: 1rem;
  color: #333;
}
</style>