<template>
  <div class="ops-page">
    <div class="page-header">
      <h1>Ordens de Produção</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        <span class="btn-icon">➕</span>
        Nova OP
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="filters.status" @change="loadOPs">
          <option value="">Todos</option>
          <option v-for="status in opStatuses" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Buscar:</label>
        <input 
          v-model="filters.search" 
          @input="debouncedLoadOPs" 
          placeholder="Nº OP, máquina, cliente..."
          type="text"
        >
      </div>
    </div>

    <!-- Lista de OPs -->
    <div class="ops-list">
      <div v-if="loading" class="loading">Carregando...</div>
      
      <div v-else-if="ops.length === 0" class="no-data">
        <p>Nenhuma ordem de produção encontrada.</p>
      </div>

      <div v-else class="ops-grid">
        <div 
          v-for="op in ops" 
          :key="op.id"
          class="op-card"
          @click="selectOP(op)"
        >
          <div class="op-header">
            <div class="op-number">{{ op.numeroOP }}</div>
            <div class="op-status" :class="getStatusClass(op.status)">
              {{ op.status }}
            </div>
          </div>
          
          <div class="op-content">
            <h3 class="op-descricao">{{ op.descricaoMaquina }}</h3>
            <p class="op-cliente"><strong>Cliente:</strong> {{ op.cliente }}</p>
            <p class="op-codigo"><strong>Código:</strong> {{ op.codigoMaquina }}</p>
            
            <div class="op-dates">
              <div class="date-item">
                <span class="date-label">Pedido:</span>
                <span class="date-value">{{ formatDate(op.dataPedido) }}</span>
              </div>
              <div class="date-item">
                <span class="date-label">Entrega:</span>
                <span class="date-value" :class="{ 'atraso': isAtrasada(op.dataEntrega) }">
                  {{ formatDate(op.dataEntrega) }}
                  <span v-if="isAtrasada(op.dataEntrega)" class="atraso-badge">⚠️ Atrasada</span>
                </span>
              </div>
            </div>

            <div class="op-progress">
              <div class="progress-info">
                <span>Progresso:</span>
                <span class="progress-value">{{ op.progresso }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${op.progresso}%` }"
                  :class="getProgressClass(op.progresso)"
                ></div>
              </div>
            </div>

            <div class="op-responsaveis">
              <div class="responsavel">
                <strong>Criado por:</strong> {{ op.criadoPor.name }}
              </div>
              <div v-if="op.responsavel" class="responsavel">
                <strong>Responsável:</strong> {{ op.responsavel.name }}
              </div>
            </div>
          </div>

          <div class="op-actions">
            <button @click.stop="editOP(op)" class="btn-edit">✏️ Editar</button>
            <button @click.stop="viewProcessos(op)" class="btn-processos">⚙️ Processos</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Criar/Editar OP -->
    <div v-if="showCreateModal || editingOP" class="modal-overlay">
      <div class="modal">
        <h2>{{ editingOP ? 'Editar OP' : 'Nova Ordem de Produção' }}</h2>
        
        <form @submit.prevent="saveOP">
          <div class="form-grid">
            <div class="form-group">
              <label>Número da OP *</label>
              <input v-model="formOP.numeroOP" type="text" required>
            </div>
            
            <div class="form-group">
              <label>Código da Máquina *</label>
              <input v-model="formOP.codigoMaquina" type="text" required>
            </div>
            
            <div class="form-group full-width">
              <label>Descrição da Máquina *</label>
              <input v-model="formOP.descricaoMaquina" type="text" required>
            </div>
            
            <div class="form-group">
              <label>Data do Pedido *</label>
              <input v-model="formOP.dataPedido" type="date" required>
            </div>
            
            <div class="form-group">
              <label>Data de Entrega *</label>
              <input v-model="formOP.dataEntrega" type="date" required>
            </div>
            
            <div class="form-group full-width">
              <label>Cliente *</label>
              <input v-model="formOP.cliente" type="text" required>
            </div>
            
            <div class="form-group">
              <label>CNPJ do Cliente</label>
              <input v-model="formOP.cnpjCliente" type="text">
            </div>
            
            <div class="form-group full-width">
              <label>Endereço do Cliente</label>
              <input v-model="formOP.enderecoCliente" type="text">
            </div>
            
            <div class="form-group full-width">
              <label>Observações</label>
              <textarea v-model="formOP.observacoes" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label>Responsável pelo Projeto</label>
              <select v-model="formOP.responsavelId">
                <option value="">Selecionar...</option>
                <option 
                  v-for="user in usuarios" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.name }} ({{ user.department }})
                </option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancelar</button>
            <button type="submit" :disabled="saving" class="btn-save">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Estado
const ops = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const editingOP = ref(null)
const usuarios = ref([])

// Filtros
const filters = ref({
  status: '',
  search: ''
})

// Formulário OP
const formOP = ref({
  numeroOP: '',
  codigoMaquina: '',
  descricaoMaquina: '',
  dataPedido: '',
  dataEntrega: '',
  cliente: '',
  cnpjCliente: '',
  enderecoCliente: '',
  observacoes: '',
  responsavelId: null
})

// Status disponíveis
const opStatuses = [
  'ABERTA', 'EM_PROJETO', 'AGUARDANDO_COMPRAS', 'EM_FABRICACAO',
  'EM_MONTAGEM', 'EM_TESTES', 'AGUARDANDO_DOCUMENTACAO', 
  'PRONTA_EXPEDICAO', 'ENTREGUE', 'CANCELADA'
]

// Carregar dados
onMounted(async () => {
  await loadOPs()
  await loadUsuarios()
})

// Carregar OPs
const loadOPs = async () => {
  loading.value = true
  try {
    const query = new URLSearchParams()
    if (filters.value.status) query.append('status', filters.value.status)
    if (filters.value.search) query.append('search', filters.value.search)
    
    const data = await $fetch(`/api/ops?${query}`)
    ops.value = data
  } catch (error) {
    console.error('Erro ao carregar OPs:', error)
    ops.value = []
  } finally {
    loading.value = false
  }
}

// Debounce para busca
const debouncedLoadOPs = useDebounceFn(loadOPs, 500)

// Carregar usuários para seleção
const loadUsuarios = async () => {
  try {
    const data = await $fetch('/api/users')
    usuarios.value = data
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

// Utilitários
const getStatusClass = (status) => `status-${status.toLowerCase()}`
const getProgressClass = (progresso) => {
  if (progresso >= 80) return 'progress-high'
  if (progresso >= 50) return 'progress-medium'
  return 'progress-low'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const isAtrasada = (dataEntrega) => {
  return new Date(dataEntrega) < new Date()
}

// Selecionar OP (para usar no header)
const selectOP = (op) => {
  // Aqui você pode implementar a seleção global da OP
  console.log('OP selecionada:', op)
}

// Abrir modal de edição
const editOP = (op) => {
  editingOP.value = op
  formOP.value = { ...op }
  // Converter datas para formato input
  formOP.value.dataPedido = op.dataPedido.split('T')[0]
  formOP.value.dataEntrega = op.dataEntrega.split('T')[0]
}

// Visualizar processos
const viewProcessos = (op) => {
  navigateTo(`/ops/${op.id}/processos`)
}

// Fechar modal
const closeModal = () => {
  showCreateModal.value = false
  editingOP.value = null
  formOP.value = {
    numeroOP: '',
    codigoMaquina: '',
    descricaoMaquina: '',
    dataPedido: '',
    dataEntrega: '',
    cliente: '',
    cnpjCliente: '',
    enderecoCliente: '',
    observacoes: '',
    responsavelId: null
  }
}

// Salvar OP
const saveOP = async () => {
  saving.value = true
  try {
    const url = editingOP.value ? `/api/ops/${editingOP.value.id}` : '/api/ops'
    const method = editingOP.value ? 'PUT' : 'POST'
    
    const response = await $fetch(url, {
      method,
      body: formOP.value
    })
    
    if (response.success) {
      await loadOPs()
      closeModal()
    }
  } catch (error) {
    console.error('Erro ao salvar OP:', error)
    alert('Erro ao salvar OP: ' + (error.data?.message || error.message))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ops-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #2980b9;
}

/* Filtros */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

/* Grid de OPs */
.ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.op-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-left: 4px solid #3498db;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.op-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.op-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.op-number {
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1rem;
}

.op-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Status colors */
.status-aberta { background: #e3f2fd; color: #1976d2; }
.status-em_projeto { background: #fff3e0; color: #f57c00; }
.status-em_fabricacao { background: #e8f5e8; color: #388e3c; }
.status-em_montagem { background: #f3e5f5; color: #7b1fa2; }
.status-em_testes { background: #e1f5fe; color: #0288d1; }
.status-entregue { background: #e8f5e8; color: #388e3c; }
.status-cancelada { background: #ffebee; color: #c62828; }

.op-content {
  padding: 1.5rem;
}

.op-descricao {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.op-cliente, .op-codigo {
  margin: 0.5rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.op-dates {
  margin: 1rem 0;
}

.date-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.date-label {
  color: #7f8c8d;
}

.date-value {
  font-weight: 600;
  color: #2c3e50;
}

.atraso {
  color: #e74c3c;
}

.atraso-badge {
  background: #e74c3c;
  color: white;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
}

.op-progress {
  margin: 1rem 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.progress-value {
  font-weight: 600;
  color: #2c3e50;
}

.progress-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-low { background: #e74c3c; }
.progress-medium { background: #f39c12; }
.progress-high { background: #27ae60; }

.op-responsaveis {
  margin: 1rem 0;
  font-size: 0.9rem;
}

.responsavel {
  margin-bottom: 0.25rem;
}

.op-actions {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-processos {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-edit {
  background: #3498db;
  color: white;
}

.btn-edit:hover {
  background: #2980b9;
}

.btn-processos {
  background: #9b59b6;
  color: white;
}

.btn-processos:hover {
  background: #8e44ad;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.btn-save {
  background: #27ae60;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #229954;
}

.btn-save:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.loading, .no-data {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}
</style>