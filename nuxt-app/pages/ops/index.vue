<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card color="primary" variant="flat" class="pa-4">
          <v-card-text class="d-flex justify-space-between align-center text-white">
            <div>
              <h1 class="text-h4 font-weight-bold">Ordens de Produção</h1>
              <p class="text-body-1 mt-2">Gerencie todas as ordens de produção</p>
            </div>
            <v-btn 
              color="white" 
              variant="outlined" 
              size="large"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Nova OP
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Conteúdo -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Lista de OPs</span>
            <v-btn 
              variant="outlined" 
              color="primary" 
              prepend-icon="mdi-refresh"
              @click="loadOPs"
              :loading="loading"
            >
              Atualizar
            </v-btn>
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
              <v-btn color="primary" class="mt-4" @click="showCreateDialog = true">
                Criar Primeira OP
              </v-btn>
            </div>

            <!-- Lista de OPs -->
            <v-list v-else class="pa-0">
              <v-list-item 
                v-for="op in ops" 
                :key="op.id"
                class="mb-2 rounded-lg"
                variant="outlined"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getStatusColor(op.status)" size="40">
                    <v-icon color="white">mdi-clipboard-list</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">
                  {{ op.numeroOP }} - {{ op.descricaoMaquina }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  Cliente: {{ op.cliente }} | 
                  Status: <v-chip :color="getStatusColor(op.status)" size="small" variant="flat">{{ op.status }}</v-chip> | 
                  Entrega: {{ formatDate(op.dataEntrega) }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex gap-2">
                    <v-btn icon variant="text" color="primary" @click="editOP(op)">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon variant="text" color="error" @click="deleteOP(op)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Criar/Editar OP -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ editingOP ? 'Editar OP' : 'Nova OP' }}</span>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="saveOP">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.numeroOP"
                  label="Número da OP *"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.codigoMaquina"
                  label="Código da Máquina *"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="formOP.descricaoMaquina"
                  label="Descrição da Máquina *"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.cliente"
                  label="Cliente *"
                  variant="outlined"
                  required
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formOP.dataEntrega"
                  label="Data de Entrega *"
                  type="date"
                  variant="outlined"
                  required
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
            Salvar
          </v-btn>
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
const showCreateDialog = ref(false)
const editingOP = ref(null)
const error = ref('')

// Formulário
const formOP = ref({
  numeroOP: '',
  codigoMaquina: '',
  descricaoMaquina: '',
  cliente: '',
  dataEntrega: ''
})

// Carregar OPs
onMounted(() => {
  loadOPs()
})

const loadOPs = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('Carregando OPs...')
    const data = await $fetch('/api/ops')
    console.log('OPs carregadas:', data)
    ops.value = data || []
  } catch (err) {
    console.error('Erro ao carregar OPs:', err)
    error.value = err.message || 'Erro ao carregar OPs'
    // Dados mock para teste
    ops.value = [
      {
        id: 1,
        numeroOP: 'OP-2024-001',
        codigoMaquina: 'MEC-001',
        descricaoMaquina: 'Máquina de Corte CNC',
        status: 'ABERTA',
        cliente: 'Cliente Teste',
        dataEntrega: '2024-12-31'
      },
      {
        id: 2,
        numeroOP: 'OP-2024-002', 
        codigoMaquina: 'MEC-002',
        descricaoMaquina: 'Prensa Hidráulica',
        status: 'EM_PROJETO',
        cliente: 'Outro Cliente',
        dataEntrega: '2024-11-30'
      }
    ]
  } finally {
    loading.value = false
  }
}

// Utilitários
const getStatusColor = (status) => {
  const colors = {
    'ABERTA': 'blue',
    'EM_PROJETO': 'orange', 
    'EM_FABRICACAO': 'green',
    'ENTREGUE': 'green',
    'CANCELADA': 'red'
  }
  return colors[status] || 'grey'
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Ações
const openCreateDialog = () => {
  editingOP.value = null
  formOP.value = {
    numeroOP: '',
    codigoMaquina: '',
    descricaoMaquina: '',
    cliente: '',
    dataEntrega: ''
  }
  showCreateDialog.value = true
}

const editOP = (op) => {
  editingOP.value = op
  formOP.value = { ...op }
  formOP.value.dataEntrega = op.dataEntrega.split('T')[0]
  showCreateDialog.value = true
}

const deleteOP = async (op) => {
  if (confirm(`Excluir OP ${op.numeroOP}?`)) {
    try {
      await $fetch(`/api/ops/${op.id}`, { method: 'DELETE' })
      await loadOPs()
    } catch (err) {
      console.error('Erro ao excluir OP:', err)
      alert('Erro ao excluir OP')
    }
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingOP.value = null
}

const saveOP = async () => {
  saving.value = true
  try {
    const url = editingOP.value ? `/api/ops/${editingOP.value.id}` : '/api/ops'
    const method = editingOP.value ? 'PUT' : 'POST'
    
    await $fetch(url, { method, body: formOP.value })
    await loadOPs()
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
</style>