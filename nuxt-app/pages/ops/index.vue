<template>
  <v-container fluid>
    <!-- Debug -->
    <v-alert v-if="debugInfo" type="info" class="mb-4">
      {{ debugInfo }}
    </v-alert>

    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card color="primary" variant="flat" class="pa-4">
          <v-card-text class="d-flex justify-space-between align-center text-white">
            <div>
              <h1 class="text-h4 font-weight-bold">Ordens de Produção</h1>
              <p class="text-body-1 mt-2">Rota atual: {{ $route.fullPath }}</p>
            </div>
            <v-btn 
              color="white" 
              variant="outlined" 
              size="large"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Nova OP
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text>
            <v-row dense>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="filters.search"
                  label="Buscar OPs..."
                  placeholder="Número, cliente, máquina..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  @input="debouncedLoadOPs"
                />
              </v-col>
              
              <v-col cols="12" sm="6" md="2">
                <v-select
                  v-model="filters.status"
                  label="Status"
                  :items="statusOptions"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  @update:model-value="loadOPs"
                />
              </v-col>
              
              <v-col cols="12" sm="6" md="2">
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="filters.dataInicio"
                      label="Data Início"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      prepend-inner-icon="mdi-calendar"
                    />
                  </template>
                  <v-date-picker v-model="filters.dataInicio" @update:model-value="loadOPs" />
                </v-menu>
              </v-col>
              
              <v-col cols="12" sm="6" md="2">
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="filters.dataFim"
                      label="Data Fim"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      prepend-inner-icon="mdi-calendar"
                    />
                  </template>
                  <v-date-picker v-model="filters.dataFim" @update:model-value="loadOPs" />
                </v-menu>
              </v-col>
              
              <v-col cols="12" sm="6" md="2" class="d-flex align-center">
                <v-btn 
                  variant="text" 
                  color="primary" 
                  @click="clearFilters"
                  prepend-icon="mdi-filter-remove"
                >
                  Limpar
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabela de OPs -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Lista de Ordens de Produção</span>
            <div class="d-flex gap-2">
              <v-btn 
                variant="outlined" 
                color="primary" 
                size="small"
                prepend-icon="mdi-refresh"
                @click="loadOPs"
                :loading="loading"
              >
                Atualizar
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- Loading -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="48" />
              <div class="text-body-1 mt-4">Carregando OPs...</div>
            </div>

            <!-- Erro -->
            <v-alert v-else-if="error" type="error" class="my-4">
              {{ error }}
            </v-alert>

            <!-- Dados vazios -->
            <div v-else-if="ops.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-off</v-icon>
              <div class="text-h6 text-grey">Nenhuma ordem de produção encontrada</div>
              <v-btn color="primary" class="mt-4" @click="openCreateDialog">
                Criar Primeira OP
              </v-btn>
            </div>

            <!-- Tabela de OPs -->
            <v-table v-else density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">OP</th>
                  <th class="text-left">Descrição</th>
                  <th class="text-left">Cliente</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Progresso</th>
                  <th class="text-left">Entrega</th>
                  <th class="text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="op in ops" :key="op.id" class="op-row">
                  <td>
                    <div class="d-flex align-center">
                      <v-avatar size="32" color="primary" class="mr-3">
                        <v-icon size="18" color="white">mdi-clipboard-list</v-icon>
                      </v-avatar>
                      <div>
                        <strong class="text-primary">{{ op.numeroOP }}</strong>
                        <div class="text-caption text-grey">{{ op.codigoMaquina }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="font-weight-medium">{{ op.descricaoMaquina }}</div>
                  </td>
                  <td>{{ op.cliente }}</td>
                  <td>
                    <v-chip 
                      :color="getStatusColor(op.status)" 
                      variant="flat" 
                      size="small"
                      :prepend-icon="getStatusIcon(op.status)"
                    >
                      {{ op.status }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="d-flex align-center gap-2" style="min-width: 120px;">
                      <v-progress-linear 
                        :model-value="op.progresso || 0" 
                        :color="getProgressColor(op.progresso || 0)"
                        height="8"
                        rounded
                      />
                      <span class="text-caption font-weight-medium">{{ op.progresso || 0 }}%</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{{ formatDate(op.dataEntrega) }}</div>
                      <v-chip 
                        v-if="isAtrasada(op.dataEntrega) && op.status !== 'ENTREGUE'" 
                        color="error" 
                        size="x-small"
                        class="mt-1"
                      >
                        Atrasada
                      </v-chip>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <v-btn 
                        icon 
                        size="small" 
                        variant="text" 
                        color="primary"
                        @click="viewOP(op)"
                        title="Visualizar"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                      
                      <v-btn 
                        icon 
                        size="small" 
                        variant="text" 
                        color="warning"
                        @click="editOP(op)"
                        title="Editar"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      
                      <v-btn 
                        icon 
                        size="small" 
                        variant="text" 
                        color="info"
                        @click="viewProcessos(op)"
                        title="Processos"
                      >
                        <v-icon>mdi-cog</v-icon>
                      </v-btn>
                      
                      <v-btn 
                        icon 
                        size="small" 
                        variant="text" 
                        color="error"
                        @click="deleteOP(op)"
                        title="Excluir"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Criar/Editar OP -->
    <v-dialog v-model="showOPDialog" max-width="800" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ editingOP ? 'Editar OP' : 'Nova Ordem de Produção' }}</span>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="saveOP" ref="form">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.numeroOP"
                  label="Número da OP *"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Número da OP é obrigatório']"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.codigoMaquina"
                  label="Código da Máquina *"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Código da máquina é obrigatório']"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formOP.descricaoMaquina"
                  label="Descrição da Máquina *"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Descrição é obrigatória']"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.cliente"
                  label="Cliente *"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Cliente é obrigatório']"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.cnpjCliente"
                  label="CNPJ do Cliente"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.dataPedido"
                  label="Data do Pedido *"
                  type="date"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Data do pedido é obrigatória']"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.dataEntrega"
                  label="Data de Entrega *"
                  type="date"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Data de entrega é obrigatória']"
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formOP.enderecoCliente"
                  label="Endereço do Cliente"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formOP.status"
                  label="Status"
                  :items="statusOptions"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.progresso"
                  label="Progresso (%)"
                  type="number"
                  variant="outlined"
                  min="0"
                  max="100"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formOP.observacoes"
                  label="Observações"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="outlined" @click="closeDialog">Cancelar</v-btn>
          <v-btn 
            color="primary" 
            @click="saveOP" 
            :loading="saving"
            prepend-icon="mdi-content-save"
          >
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirmar Exclusão</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir a OP <strong>{{ opToDelete?.numeroOP }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showDeleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="deleting">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
// Estado
const ops = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showOPDialog = ref(false)
const showDeleteDialog = ref(false)
const editingOP = ref(null)
const opToDelete = ref(null)
const error = ref('')
const debugInfo = ref('')
const form = ref(null)

// Filtros
const filters = ref({
  search: '',
  status: null,
  dataInicio: null,
  dataFim: null
})

// Debounce manual
let searchTimeout = null

const debouncedLoadOPs = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    loadOPs()
  }, 500)
}

// Opções
const statusOptions = [
  'ABERTA', 'EM_PROJETO', 'AGUARDANDO_COMPRAS', 'EM_FABRICACAO',
  'EM_MONTAGEM', 'EM_TESTES', 'AGUARDANDO_DOCUMENTACAO', 
  'PRONTA_EXPEDICAO', 'ENTREGUE', 'CANCELADA'
].map(status => ({ title: status, value: status }))

// Formulário
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
  status: 'ABERTA',
  progresso: 0
})

// Route
const route = useRoute()

// Carregar dados
onMounted(() => {
  debugInfo.value = `Página carregada. Rota: ${route.fullPath}`
  console.log('🔍 Página OPs montada')
  loadOPs()
})

// Watch para mudanças na query
watch(() => route.query, (newQuery) => {
  console.log('🔄 Query mudou:', newQuery)
  debugInfo.value = `Query atualizada: ${JSON.stringify(newQuery)}`
  loadOPs()
})

// Carregar OPs
const loadOPs = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('📡 Carregando OPs...')
    
    // Dados mock para demonstração
    ops.value = [
      {
        id: 1,
        numeroOP: 'OP-2024-001',
        codigoMaquina: 'MEC-001',
        descricaoMaquina: 'Máquina de Corte CNC 3000',
        status: route.query.status || 'EM_PROJETO',
        progresso: 25,
        cliente: 'Indústria Metalúrgica ABC',
        dataEntrega: '2024-06-30',
        responsavel: { name: 'João Silva' }
      },
      {
        id: 2,
        numeroOP: 'OP-2024-002',
        codigoMaquina: 'MEC-002', 
        descricaoMaquina: 'Prensa Hidráulica 50T',
        status: 'EM_FABRICACAO',
        progresso: 60,
        cliente: 'Fábrica de Componentes XYZ',
        dataEntrega: '2024-05-15',
        responsavel: { name: 'Maria Santos' }
      },
      {
        id: 3,
        numeroOP: 'OP-2024-003',
        codigoMaquina: 'MEC-003',
        descricaoMaquina: 'Esteira Transportadora Industrial',
        status: 'ABERTA',
        progresso: 10,
        cliente: 'Logística Rápida Ltda',
        dataEntrega: '2024-08-20'
      }
    ]
    
    console.log('✅ OPs carregadas:', ops.value.length)
  } catch (err) {
    console.error('❌ Erro ao carregar OPs:', err)
    error.value = err.message || 'Erro ao carregar OPs'
  } finally {
    loading.value = false
  }
}

// Utilitários
const getStatusColor = (status) => {
  const statusColors = {
    'ABERTA': 'blue',
    'EM_PROJETO': 'orange',
    'EM_FABRICACAO': 'green',
    'EM_MONTAGEM': 'purple',
    'EM_TESTES': 'cyan',
    'ENTREGUE': 'green',
    'CANCELADA': 'red'
  }
  return statusColors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const statusIcons = {
    'ABERTA': 'mdi-clock-outline',
    'EM_PROJETO': 'mdi-pencil-ruler',
    'EM_FABRICACAO': 'mdi-cog',
    'EM_MONTAGEM': 'mdi-wrench',
    'EM_TESTES': 'mdi-flask',
    'ENTREGUE': 'mdi-check',
    'CANCELADA': 'mdi-close'
  }
  return statusIcons[status] || 'mdi-help'
}

const getProgressColor = (progresso) => {
  if (progresso >= 80) return 'green'
  if (progresso >= 50) return 'orange'
  return 'red'
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const isAtrasada = (dataEntrega) => {
  if (!dataEntrega) return false
  return new Date(dataEntrega) < new Date()
}

// Ações
const openCreateDialog = () => {
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
    status: 'ABERTA',
    progresso: 0
  }
  showOPDialog.value = true
}

const editOP = (op) => {
  editingOP.value = op
  formOP.value = { ...op }
  formOP.value.dataPedido = op.dataPedido ? op.dataPedido.split('T')[0] : ''
  formOP.value.dataEntrega = op.dataEntrega ? op.dataEntrega.split('T')[0] : ''
  showOPDialog.value = true
}

const viewOP = (op) => {
  // Navegação forçada
  window.location.href = `/ops/${op.id}`
}

const viewProcessos = (op) => {
  // Navegação forçada
  window.location.href = `/ops/${op.id}/processos`
}

const deleteOP = (op) => {
  opToDelete.value = op
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!opToDelete.value) return
  
  deleting.value = true
  try {
    // Simular exclusão
    await new Promise(resolve => setTimeout(resolve, 1000))
    ops.value = ops.value.filter(op => op.id !== opToDelete.value.id)
    showDeleteDialog.value = false
    opToDelete.value = null
  } catch (err) {
    console.error('Erro ao excluir OP:', err)
    alert('Erro ao excluir OP')
  } finally {
    deleting.value = false
  }
}

const closeDialog = () => {
  showOPDialog.value = false
  editingOP.value = null
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: null,
    dataInicio: null,
    dataFim: null
  }
  // Navegar para limpar query da URL
  navigateTo('/ops')
}

const saveOP = async () => {
  const { valid } = await form.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingOP.value) {
      // Atualizar OP existente
      const index = ops.value.findIndex(op => op.id === editingOP.value.id)
      if (index !== -1) {
        ops.value[index] = { ...editingOP.value, ...formOP.value }
      }
    } else {
      // Criar nova OP
      const newOP = {
        id: Date.now(),
        ...formOP.value,
        responsavel: { name: 'Usuário Atual' }
      }
      ops.value.unshift(newOP)
    }
    
    closeDialog()
  } catch (err) {
    console.error('Erro ao salvar OP:', err)
    alert('Erro ao salvar OP: ' + err.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.op-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>