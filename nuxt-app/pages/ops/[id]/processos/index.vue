<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card color="primary" variant="flat" class="pa-4">
          <v-card-text class="d-flex justify-space-between align-center text-white">
            <div>
              <div class="d-flex align-center mb-2">
                <v-btn 
                  icon 
                  variant="text" 
                  color="white" 
                  class="mr-2"
                  @click="$router.push('/ops')"
                >
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <v-btn 
                  icon 
                  variant="text" 
                  color="white" 
                  class="mr-2"
                  @click="$router.push(`/ops/${route.params.id}`)"
                  title="Ver Dashboard"
                >
                  <v-icon>mdi-chart-timeline</v-icon>
                </v-btn>
                <h1 class="text-h4 font-weight-bold">Processos da OP</h1>
              </div>
              <p class="text-body-1">
                {{ op?.numeroOP }} - {{ op?.descricaoMaquina }}
              </p>
              <p class="text-caption">
                Cliente: {{ op?.cliente }} | Entrega: {{ formatDate(op?.dataEntrega) }}
              </p>
            </div>
            <v-btn 
              color="white" 
              variant="outlined" 
              prepend-icon="mdi-plus"
              @click="openCreateProcessoDialog"
            >
              Novo Processo
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Progresso Geral -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h6">
            Progresso Geral da OP
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-progress-circular 
                :model-value="progressoGeral" 
                :color="getProgressColor(progressoGeral)"
                size="80"
                width="8"
              >
                <strong>{{ progressoGeral }}%</strong>
              </v-progress-circular>
              <div class="ml-4">
                <div class="text-h6">{{ progressoGeral }}% Concluído</div>
                <div class="text-caption text-grey">
                  {{ processosConcluidos }} de {{ processos.length }} processos finalizados
                </div>
              </div>
            </div>
            
            <v-progress-linear 
              :model-value="progressoGeral" 
              :color="getProgressColor(progressoGeral)"
              height="12"
              rounded
            />
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="text-h6">
            Estatísticas
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar color="blue" size="32">
                    <v-icon color="white">mdi-play</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>Em Andamento</v-list-item-title>
                <v-list-item-subtitle>{{ estatisticas.emAndamento }} processos</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar color="green" size="32">
                    <v-icon color="white">mdi-check</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>Concluídos</v-list-item-title>
                <v-list-item-subtitle>{{ estatisticas.concluidos }} processos</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar color="orange" size="32">
                    <v-icon color="white">mdi-clock</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>Não Iniciados</v-list-item-title>
                <v-list-item-subtitle>{{ estatisticas.naoIniciados }} processos</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de Processos -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Fluxo de Processos</span>
            <v-btn 
              variant="outlined" 
              color="primary" 
              prepend-icon="mdi-refresh"
              @click="loadProcessos"
              :loading="loading"
            >
              Atualizar
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Loading -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="48" />
              <div class="text-body-1 mt-4">Carregando processos...</div>
            </div>

            <!-- Lista de Processos -->
            <v-timeline v-else align="start" side="end" class="px-4">
              <v-timeline-item
                v-for="processo in processosOrdenados"
                :key="processo.id"
                :dot-color="getStatusColor(processo.status)"
                size="small"
              >
                <template v-slot:icon>
                  <v-avatar :color="getStatusColor(processo.status)" size="36">
                    <v-icon color="white">{{ getStatusIcon(processo.status) }}</v-icon>
                  </v-avatar>
                </template>

                <v-card class="processo-card">
                  <v-card-text class="pa-4">
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div>
                        <h3 class="text-h6 font-weight-bold">{{ processo.nome }}</h3>
                        <p class="text-caption text-grey" v-if="processo.descricao">
                          {{ processo.descricao }}
                        </p>
                      </div>
                      <v-chip 
                        :color="getStatusColor(processo.status)" 
                        variant="flat"
                        :prepend-icon="getStatusIcon(processo.status)"
                      >
                        {{ formatStatus(processo.status) }}
                      </v-chip>
                    </div>

                    <!-- Informações do Processo -->
                    <v-row dense class="mt-2">
                      <v-col cols="12" sm="6">
                        <div class="text-caption text-grey">Sequência</div>
                        <div class="font-weight-medium">#{{ processo.sequencia }}</div>
                      </v-col>
                      <v-col cols="12" sm="6" v-if="processo.responsavel">
                        <div class="text-caption text-grey">Responsável</div>
                        <div class="font-weight-medium">{{ processo.responsavel.name }}</div>
                      </v-col>
                      <v-col cols="12" sm="6" v-if="processo.dataPrevista">
                        <div class="text-caption text-grey">Previsão</div>
                        <div class="font-weight-medium">{{ formatDate(processo.dataPrevista) }}</div>
                      </v-col>
                      <v-col cols="12" sm="6" v-if="processo.prazoEstimado">
                        <div class="text-caption text-grey">Prazo Estimado</div>
                        <div class="font-weight-medium">{{ processo.prazoEstimado }} dias</div>
                      </v-col>
                    </v-row>

                    <!-- Progresso do Processo -->
                    <div class="mt-3">
                      <div class="d-flex justify-space-between mb-1">
                        <span class="text-caption">Progresso do Processo</span>
                        <span class="text-caption font-weight-bold">{{ processo.progresso }}%</span>
                      </div>
                      <v-progress-linear 
                        :model-value="processo.progresso" 
                        :color="getProgressColor(processo.progresso)"
                        height="8"
                        rounded
                      />
                    </div>

                    <!-- Datas -->
                    <v-row dense class="mt-3">
                      <v-col cols="12" sm="6" v-if="processo.dataInicio">
                        <div class="text-caption text-grey">Iniciado em</div>
                        <div class="font-weight-medium">{{ formatDateTime(processo.dataInicio) }}</div>
                      </v-col>
                      <v-col cols="12" sm="6" v-if="processo.dataFim">
                        <div class="text-caption text-grey">Concluído em</div>
                        <div class="font-weight-medium">{{ formatDateTime(processo.dataFim) }}</div>
                      </v-col>
                    </v-row>

                    <!-- Ações -->
                    <div class="d-flex gap-2 mt-4">
                      <v-btn 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        @click="editarProcesso(processo)"
                        prepend-icon="mdi-pencil"
                      >
                        Editar
                      </v-btn>
                      
                      <v-btn 
                        size="small" 
                        variant="outlined" 
                        color="green"
                        @click="iniciarProcesso(processo)"
                        v-if="processo.status === 'NAO_INICIADO'"
                        prepend-icon="mdi-play"
                      >
                        Iniciar
                      </v-btn>
                      
                      <v-btn 
                        size="small" 
                        variant="outlined" 
                        color="orange"
                        @click="pausarProcesso(processo)"
                        v-if="processo.status === 'EM_ANDAMENTO'"
                        prepend-icon="mdi-pause"
                      >
                        Pausar
                      </v-btn>
                      
                      <v-btn 
                        size="small" 
                        variant="outlined" 
                        color="green"
                        @click="concluirProcesso(processo)"
                        v-if="processo.status === 'EM_ANDAMENTO' || processo.status === 'AGUARDANDO'"
                        prepend-icon="mdi-check"
                      >
                        Concluir
                      </v-btn>
                      
                      <v-btn 
                        size="small" 
                        variant="outlined" 
                        color="red"
                        @click="excluirProcesso(processo)"
                        prepend-icon="mdi-delete"
                      >
                        Excluir
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>

            <!-- Sem processos -->
            <div v-if="!loading && processos.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-2">mdi-cog-off</v-icon>
              <div class="text-h6 text-grey">Nenhum processo cadastrado</div>
              <v-btn color="primary" class="mt-4" @click="openCreateProcessoDialog">
                Adicionar Primeiro Processo
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Criar/Editar Processo -->
    <v-dialog v-model="showProcessoDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ editingProcesso ? 'Editar Processo' : 'Novo Processo' }}</span>
          <v-btn icon @click="closeProcessoDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="salvarProcesso" ref="processoForm">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formProcesso.nome"
                  label="Nome do Processo *"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Nome é obrigatório']"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formProcesso.descricao"
                  label="Descrição"
                  variant="outlined"
                  rows="2"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formProcesso.sequencia"
                  label="Sequência *"
                  type="number"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Sequência é obrigatória']"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formProcesso.prazoEstimado"
                  label="Prazo Estimado (dias)"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="formProcesso.dataPrevista"
                      label="Data Prevista"
                      variant="outlined"
                      readonly
                      prepend-inner-icon="mdi-calendar"
                    />
                  </template>
                  <v-date-picker v-model="formProcesso.dataPrevista" />
                </v-menu>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProcesso.responsavelId"
                  label="Responsável"
                  :items="usuarios"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProcesso.status"
                  label="Status"
                  :items="statusOptions"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formProcesso.progresso"
                  label="Progresso (%)"
                  type="number"
                  variant="outlined"
                  min="0"
                  max="100"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="outlined" @click="closeProcessoDialog">Cancelar</v-btn>
          <v-btn 
            color="primary" 
            @click="salvarProcesso" 
            :loading="salvando"
            prepend-icon="mdi-content-save"
          >
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
// Estado
const route = useRoute()
const op = ref(null)
const processos = ref([])
const loading = ref(false)
const salvando = ref(false)
const showProcessoDialog = ref(false)
const editingProcesso = ref(null)
const usuarios = ref([])

// Formulário
const formProcesso = ref({
  nome: '',
  descricao: '',
  sequencia: 1,
  status: 'NAO_INICIADO',
  progresso: 0,
  prazoEstimado: null,
  dataPrevista: null,
  responsavelId: null
})

// Opções
const statusOptions = [
  { title: 'Não Iniciado', value: 'NAO_INICIADO' },
  { title: 'Em Andamento', value: 'EM_ANDAMENTO' },
  { title: 'Aguardando', value: 'AGUARDANDO' },
  { title: 'Concluído', value: 'CONCLUIDO' },
  { title: 'Bloqueado', value: 'BLOQUEADO' },
  { title: 'Cancelado', value: 'CANCELADO' }
]

// Computed
const processosOrdenados = computed(() => {
  return [...processos.value].sort((a, b) => a.sequencia - b.sequencia)
})

const processosConcluidos = computed(() => {
  return processos.value.filter(p => p.status === 'CONCLUIDO').length
})

const progressoGeral = computed(() => {
  if (processos.value.length === 0) return 0
  const totalProgresso = processos.value.reduce((sum, processo) => sum + processo.progresso, 0)
  return Math.round(totalProgresso / processos.value.length)
})

const estatisticas = computed(() => {
  return {
    emAndamento: processos.value.filter(p => p.status === 'EM_ANDAMENTO').length,
    concluidos: processosConcluidos.value,
    naoIniciados: processos.value.filter(p => p.status === 'NAO_INICIADO').length,
    aguardando: processos.value.filter(p => p.status === 'AGUARDANDO').length
  }
})

// Carregar dados
onMounted(() => {
  loadOP()
  loadProcessos()
  loadUsuarios()
})

// Carregar OP
const loadOP = async () => {
  try {
    // Simular carregamento da OP
    op.value = {
      id: parseInt(route.params.id),
      numeroOP: 'OP-2024-001',
      descricaoMaquina: 'Máquina de Corte CNC 3000',
      cliente: 'Indústria Metalúrgica ABC',
      dataEntrega: '2024-06-30'
    }
  } catch (error) {
    console.error('Erro ao carregar OP:', error)
  }
}

// Carregar processos
const loadProcessos = async () => {
  loading.value = true
  try {
    // Dados mock para demonstração
    processos.value = [
      {
        id: 1,
        nome: 'Lançamento da OP no Sistema',
        descricao: 'Registrar a OP no sistema de produção',
        sequencia: 1,
        status: 'CONCLUIDO',
        progresso: 100,
        dataInicio: '2024-01-15T08:00:00',
        dataFim: '2024-01-15T08:30:00',
        responsavel: { name: 'Administrador' }
      },
      {
        id: 2,
        nome: 'Criação da Pasta do Projeto',
        descricao: 'Criar estrutura de pastas para documentação',
        sequencia: 2,
        status: 'CONCLUIDO',
        progresso: 100,
        dataInicio: '2024-01-15T09:00:00',
        dataFim: '2024-01-15T10:00:00',
        responsavel: { name: 'João Silva' }
      },
      {
        id: 3,
        nome: 'Projeto Mecânico 3D',
        descricao: 'Desenvolver projeto 3D da máquina no SolidWorks',
        sequencia: 3,
        status: 'EM_ANDAMENTO',
        progresso: 65,
        dataInicio: '2024-01-16T08:00:00',
        dataPrevista: '2024-02-15',
        prazoEstimado: 30,
        responsavel: { name: 'Maria Santos' }
      },
      {
        id: 4,
        nome: 'Detalhamento de Peças',
        descricao: 'Criar desenhos de fabricação de todas as peças',
        sequencia: 4,
        status: 'NAO_INICIADO',
        progresso: 0,
        dataPrevista: '2024-02-20',
        prazoEstimado: 15
      },
      {
        id: 5,
        nome: 'Lista de Materiais (BOM)',
        descricao: 'Gerar lista completa de peças e materiais',
        sequencia: 5,
        status: 'NAO_INICIADO',
        progresso: 0,
        dataPrevista: '2024-02-25',
        prazoEstimado: 5
      }
    ]
  } catch (error) {
    console.error('Erro ao carregar processos:', error)
  } finally {
    loading.value = false
  }
}

// Carregar usuários
const loadUsuarios = async () => {
  try {
    // Dados mock
    usuarios.value = [
      { id: 1, name: 'Administrador' },
      { id: 2, name: 'João Silva' },
      { id: 3, name: 'Maria Santos' },
      { id: 4, name: 'Pedro Costa' }
    ]
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

// Utilitários
const getStatusColor = (status) => {
  const colors = {
    'NAO_INICIADO': 'grey',
    'EM_ANDAMENTO': 'blue',
    'AGUARDANDO': 'orange',
    'CONCLUIDO': 'green',
    'BLOQUEADO': 'red',
    'CANCELADO': 'red'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    'NAO_INICIADO': 'mdi-clock-outline',
    'EM_ANDAMENTO': 'mdi-play',
    'AGUARDANDO': 'mdi-pause',
    'CONCLUIDO': 'mdi-check',
    'BLOQUEADO': 'mdi-alert',
    'CANCELADO': 'mdi-close'
  }
  return icons[status] || 'mdi-help'
}

const getProgressColor = (progresso) => {
  if (progresso >= 80) return 'green'
  if (progresso >= 50) return 'orange'
  return 'red'
}

const formatStatus = (status) => {
  const statusMap = {
    'NAO_INICIADO': 'Não Iniciado',
    'EM_ANDAMENTO': 'Em Andamento',
    'AGUARDANDO': 'Aguardando',
    'CONCLUIDO': 'Concluído',
    'BLOQUEADO': 'Bloqueado',
    'CANCELADO': 'Cancelado'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('pt-BR')
}

// Ações
const openCreateProcessoDialog = () => {
  editingProcesso.value = null
  formProcesso.value = {
    nome: '',
    descricao: '',
    sequencia: processos.value.length + 1,
    status: 'NAO_INICIADO',
    progresso: 0,
    prazoEstimado: null,
    dataPrevista: null,
    responsavelId: null
  }
  showProcessoDialog.value = true
}

const editarProcesso = (processo) => {
  editingProcesso.value = processo
  formProcesso.value = { ...processo }
  formProcesso.value.dataPrevista = processo.dataPrevista ? processo.dataPrevista.split('T')[0] : null
  showProcessoDialog.value = true
}

const closeProcessoDialog = () => {
  showProcessoDialog.value = false
  editingProcesso.value = null
}

const salvarProcesso = async () => {
  salvando.value = true
  try {
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingProcesso.value) {
      // Atualizar processo existente
      const index = processos.value.findIndex(p => p.id === editingProcesso.value.id)
      if (index !== -1) {
        processos.value[index] = { ...editingProcesso.value, ...formProcesso.value }
      }
    } else {
      // Criar novo processo
      const novoProcesso = {
        id: Date.now(),
        ...formProcesso.value,
        responsavel: usuarios.value.find(u => u.id === formProcesso.value.responsavelId) || null
      }
      processos.value.push(novoProcesso)
    }
    
    closeProcessoDialog()
  } catch (error) {
    console.error('Erro ao salvar processo:', error)
    alert('Erro ao salvar processo')
  } finally {
    salvando.value = false
  }
}

const iniciarProcesso = (processo) => {
  processo.status = 'EM_ANDAMENTO'
  processo.dataInicio = new Date().toISOString()
  processo.progresso = 10
}

const pausarProcesso = (processo) => {
  processo.status = 'AGUARDANDO'
}

const concluirProcesso = (processo) => {
  processo.status = 'CONCLUIDO'
  processo.progresso = 100
  processo.dataFim = new Date().toISOString()
}

const excluirProcesso = (processo) => {
  if (confirm(`Excluir processo "${processo.nome}"?`)) {
    processos.value = processos.value.filter(p => p.id !== processo.id)
  }
}
</script>

<style scoped>
.processo-card {
  border-left: 4px solid v-bind('getStatusColor(processo.status)');
}

.gap-2 {
  gap: 8px;
}
</style>