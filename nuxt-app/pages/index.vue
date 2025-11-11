<template>
  <div class="container">
    <div class="header">
      <h1>Minha Aplicação Nuxt + Prisma</h1>
      <div class="user-info">
        <span>Olá, {{ user?.name }}!</span>
        <button @click="handleLogout" class="logout-button">Sair</button>
      </div>
    </div>
    
    <div class="form-container">
      <input 
        v-model="valorInput" 
        type="text" 
        placeholder="Digite um valor..."
        class="input-field"
        @keypress.enter="salvarValor"
      />
      <button 
        @click="salvarValor" 
        :disabled="!valorInput || carregando"
        class="submit-button"
      >
        {{ carregando ? 'Salvando...' : 'Salvar no Banco' }}
      </button>
    </div>

    <div v-if="mensagem" class="mensagem" :class="{ 'erro': isErro }">
      {{ mensagem }}
    </div>

    <!-- CORREÇÃO: Verificar se itens existe e tem length -->
    <div class="itens-salvos" v-if="itens && itens.length > 0">
      <h2>Itens Salvos:</h2>
      <ul>
        <li v-for="item in itens" :key="item.id" class="item">
          {{ item.valor }} - {{ formatarData(item.createdAt) }}
        </li>
      </ul>
    </div>

    <!-- Mostrar mensagem quando não há itens -->
    <div v-else-if="itens && itens.length === 0" class="no-items">
      <p>Nenhum item salvo ainda.</p>
    </div>
  </div>
</template>

<script setup>
// Verificar autenticação
const user = ref(null)
const itens = ref([]) // Inicializar como array vazio

onMounted(() => {
  const userData = localStorage.getItem('user')
  if (!userData) {
    navigateTo('/login')
    return
  }
  
  try {
    user.value = JSON.parse(userData)
    carregarItens()
  } catch (error) {
    console.error('Erro ao carregar usuário:', error)
    navigateTo('/login')
  }
})

// Função de logout
const handleLogout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  navigateTo('/login')
}

// Resto do código
const valorInput = ref('')
const carregando = ref(false)
const mensagem = ref('')
const isErro = ref(false)

const salvarValor = async () => {
  if (!valorInput.value.trim()) return

  carregando.value = true
  mensagem.value = ''
  isErro.value = false

  try {
    const response = await $fetch('/api/salvar', {
      method: 'POST',
      body: {
        valor: valorInput.value
      }
    })

    mensagem.value = 'Valor salvo com sucesso!'
    valorInput.value = ''
    
    // Recarregar a lista
    await carregarItens()
  } catch (error) {
    console.error('Erro ao salvar:', error)
    mensagem.value = 'Erro ao salvar o valor'
    isErro.value = true
  } finally {
    carregando.value = false
  }
}

// Função para carregar itens
const carregarItens = async () => {
  try {
    const data = await $fetch('/api/itens')
    itens.value = data || [] // Garantir que sempre seja um array
  } catch (error) {
    console.error('Erro ao carregar itens:', error)
    itens.value = [] // Em caso de erro, definir como array vazio
  }
}

// Formatar data
const formatarData = (dataString) => {
  return new Date(dataString).toLocaleString('pt-BR')
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-button {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #c82333;
}

.form-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.input-field {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.submit-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.submit-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.mensagem {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensagem.erro {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.itens-salvos {
  margin-top: 30px;
}

.itens-salvos h2 {
  margin-bottom: 15px;
}

.item {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.item:last-child {
  border-bottom: none;
}

.no-items {
  margin-top: 30px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}
</style>