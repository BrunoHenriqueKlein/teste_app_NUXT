<template>
  <div class="w-100">
    <!-- Header Standard -->
    <PageHeader 
      :title="showGlobal ? 'Todas as Tarefas' : 'Minhas Tarefas'" 
      :subtitle="showGlobal ? 'Visualize e monitore todos os processos da empresa' : 'Gerencie seus processos e acompanhe seu progresso'"
      icon="mdi-clipboard-check-multiple"
    />

    <!-- Filtros e Busca -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card flat class="border">
          <v-card-text class="pa-4">
            <v-row align="center">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="search"
                  label="Buscar por OP ou Processo"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  label="Status"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="auto" v-if="user?.role === 'ADMIN'">
                <v-switch
                  v-model="showGlobal"
                  label="Ver Todas as Tarefas"
                  color="primary"
                  hide-details
                  density="comfortable"
                  @update:model-value="fetchTasks"
                />
              </v-col>
              <v-spacer />
              <v-col cols="auto">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="fetchTasks"
                  :loading="loading"
                >
                  Atualizar
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de Tarefas -->
    <v-row>
      <v-col v-if="loading" cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-4 text-grey">Carregando suas tarefas...</div>
      </v-col>

      <v-col v-else-if="filteredTasks.length === 0" cols="12" class="text-center py-12">
        <v-icon size="64" color="grey-lighten-2">mdi-clipboard-text-off</v-icon>
        <div class="mt-4 text-h6 text-grey">Nenhuma tarefa encontrada</div>
      </v-col>

      <v-col
        v-for="task in filteredTasks"
        :key="task.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card class="task-card border-s-lg" :style="{ borderLeftColor: getStatusColor(task.status) }">
          <v-card-item>
            <template v-slot:overline>
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-bold primary--text">OP: {{ task.op.numeroOP }}</span>
                <v-chip size="x-small" :color="getStatusColor(task.status)" variant="flat">
                  {{ task.status }}
                </v-chip>
              </div>
            </template>
            <v-card-title class="text-h6 font-weight-bold pb-0">{{ task.nome }}</v-card-title>
            <v-card-subtitle class="mt-1">
              <v-chip size="x-small" color="secondary" variant="outlined" class="mr-1">{{ task.op.codigoMaquina }}</v-chip>
              {{ task.op.descricaoMaquina }}
            </v-card-subtitle>
            <v-card-subtitle class="text-caption">{{ task.op.cliente }}</v-card-subtitle>
          </v-card-item>

          <v-card-text class="pt-2">
            <div class="text-body-2 mb-4 text-medium-emphasis">
              {{ task.descricao || 'Sem descrição detalhada' }}
            </div>
            
            <v-row dense class="mb-2">
              <v-col cols="6">
                <div class="text-caption text-grey">Início Previsto</div>
                <div class="text-body-2 font-weight-medium">
                  <v-icon size="14" color="grey">mdi-calendar-start</v-icon>
                  {{ formatDate(task.dataInicioPrevista) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">Início Real</div>
                <div class="text-body-2 font-weight-medium" :class="{ 'text-primary': task.dataInicio }">
                  <v-icon size="14" :color="task.dataInicio ? 'primary' : 'grey'">mdi-calendar-check</v-icon>
                  {{ formatDate(task.dataInicio) }}
                </div>
              </v-col>
            </v-row>

            <v-divider class="mb-3" />

            <div class="mb-1 d-flex justify-space-between align-center">
              <span class="text-caption font-weight-bold">Progresso</span>
              <v-chip size="x-small" color="primary" variant="tonal">{{ task.progresso }}%</v-chip>
            </div>
            
            <div class="d-flex align-center">
              <v-slider
                v-model="task.progresso"
                color="primary"
                density="compact"
                hide-details
                :step="5"
                min="0"
                max="100"
                :disabled="task.status === 'NAO_INICIADO' || task.status === 'CONCLUIDO'"
                class="flex-grow-1"
                @update:model-value="task.hasChanged = true"
              />
              <v-btn
                v-if="task.hasChanged"
                icon="mdi-content-save"
                size="x-small"
                color="success"
                variant="flat"
                class="ml-2"
                @click="saveProgress(task)"
                :loading="task.updating"
              />
            </div>

            <div class="d-flex align-center text-caption text-error mt-4 font-weight-medium">
              <v-icon size="16" class="mr-1">mdi-calendar-clock</v-icon>
              Prazo Final: {{ formatDate(task.dataTerminoPrevista) }}
            </div>

            <div v-if="showGlobal" class="d-flex align-center text-caption text-medium-emphasis mt-1">
              <v-icon size="16" class="mr-1">mdi-account-outline</v-icon>
              Responsável: {{ task.responsavel?.name || 'Não atribuído' }}
            </div>
          </v-card-text>

          <v-divider />

          <v-card-actions class="pa-3">
            <v-btn
              v-if="task.status === 'NAO_INICIADO'"
              color="success"
              variant="flat"
              block
              prepend-icon="mdi-play"
              @click="openConfirmDialog(task, 'INICIAR')"
              :loading="task.updating"
            >
              Iniciar Tarefa
            </v-btn>
            <v-btn
              v-else-if="task.status === 'EM_ANDAMENTO'"
              color="primary"
              variant="flat"
              block
              prepend-icon="mdi-check-bold"
              @click="openConfirmDialog(task, 'FINALIZAR')"
              :loading="task.updating"
              :disabled="task.progresso < 100 && !task.hasChanged"
            >
              Finalizar Tarefa
            </v-btn>
            <v-btn
              v-else
              variant="tonal"
              block
              disabled
            >
              Tarefa Finalizada
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de Confirmação Único -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon :color="confirmDialog.color" class="mr-2">{{ confirmDialog.icon }}</v-icon>
          {{ confirmDialog.title }}
        </v-card-title>
        <v-card-text class="pt-2">
          {{ confirmDialog.message }}
          <div v-if="confirmDialog.task" class="mt-2 font-weight-bold">{{ confirmDialog.task.nome }}</div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="outlined" @click="confirmDialog.show = false">Cancelar</v-btn>
          <v-btn 
            :color="confirmDialog.color" 
            variant="flat" 
            @click="executeConfirmedAction"
            :loading="confirmDialog.loading"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const { user, authHeaders } = useAuth()
const loading = ref(true)
const tasks = ref([])
const search = ref('')
const statusFilter = ref('Todos')
const showGlobal = ref(false)

const statusOptions = ['Todos', 'NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']

const confirmDialog = ref({
  show: false,
  task: null,
  type: '', // 'INICIAR' ou 'FINALIZAR'
  title: '',
  message: '',
  icon: '',
  color: '',
  loading: false
})

const fetchTasks = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/user/tasks', {
      params: { global: showGlobal.value },
      headers: authHeaders.value
    })
    tasks.value = data.map(t => ({ ...t, updating: false, hasChanged: false }))
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
  } finally {
    loading.value = false
  }
}

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchesSearch = !search.value || 
      task.nome.toLowerCase().includes(search.value.toLowerCase()) ||
      task.op.numeroOP.toLowerCase().includes(search.value.toLowerCase()) ||
      task.op.cliente.toLowerCase().includes(search.value.toLowerCase()) ||
      task.op.codigoMaquina.toLowerCase().includes(search.value.toLowerCase())
    
    // Filtro de status: Se 'Todos' estiver selecionado, oculta os 'CONCLUIDO'
    // Se um status específico for selecionado, mostra apenas aquele
    let matchesStatus = false
    if (statusFilter.value === 'Todos') {
      matchesStatus = task.status !== 'CONCLUIDO'
    } else {
      matchesStatus = task.status === statusFilter.value
    }
    
    return matchesSearch && matchesStatus
  })
})

const saveProgress = async (task) => {
  task.updating = true
  try {
    await $fetch(`/api/ops/${task.opId}/processos/${task.id}`, {
      method: 'PUT',
      body: { 
        progresso: task.progresso,
        // Ao mudar o progresso para 100, concluímos a tarefa automaticamente?
        // Vamos deixar o usuário concluir explicitamente no botão
      },
      headers: authHeaders.value
    })
    task.hasChanged = false
    
    // Se chegou a 100, avisar que pode concluir
    if (task.progresso === 100) {
      alert('Progresso atingiu 100%! Você já pode concluir a tarefa.')
    }
  } catch (error) {
    console.error('Erro ao salvar progresso:', error)
  } finally {
    task.updating = false
  }
}

const getStatusColor = (status) => {
  const colors = {
    'NAO_INICIADO': '#9E9E9E',
    'EM_ANDAMENTO': '#2196F3',
    'AGUARDANDO': '#FF9800',
    'CONCLUIDO': '#4CAF50',
    'BLOQUEADO': '#F44336',
    'CANCELADO': '#757575'
  }
  return colors[status] || '#9E9E9E'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Não definida'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

const updateStatus = async (task, newStatus) => {
  task.updating = true
  try {
    let url = `/api/ops/${task.opId}/processos/${task.id}`
    let method = 'PUT'
    let body = { 
      status: newStatus,
      progresso: newStatus === 'CONCLUIDO' ? 100 : task.progresso
    }

    // Se for iniciar ou concluir, usar endpoints especializados que tratam regras de negócio
    if (newStatus === 'EM_ANDAMENTO') {
      url += '/iniciar'
      method = 'POST'
      body = {}
    } else if (newStatus === 'CONCLUIDO') {
      url += '/concluir'
      method = 'POST'
      body = {}
    }

    const response = await $fetch(url, {
      method,
      body: Object.keys(body).length > 0 ? body : undefined,
      headers: authHeaders.value
    })

    // Atualizar estado local
    task.status = newStatus
    if (newStatus === 'CONCLUIDO') {
      task.progresso = 100
    } else if (newStatus === 'EM_ANDAMENTO') {
      // Se a resposta trouxer o progresso atualizado (ex: 10%), usa ele
      if (response?.processo?.progresso) {
        task.progresso = response.processo.progresso
      } else if (task.progresso < 10) {
        task.progresso = 10
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    alert('Erro ao atualizar status: ' + (error.data?.message || error.message))
  } finally {
    task.updating = false
  }
}

const openConfirmDialog = (task, type) => {
  confirmDialog.value = {
    show: true,
    task,
    type,
    title: type === 'INICIAR' ? 'Iniciar Tarefa' : 'Finalizar Tarefa',
    message: type === 'INICIAR' 
      ? 'Deseja realmente iniciar esta tarefa? O cronômetro de execução começará a contar.'
      : 'Deseja realmente finalizar esta tarefa? Isso marcará o progresso como 100%.',
    icon: type === 'INICIAR' ? 'mdi-play-circle' : 'mdi-check-circle',
    color: type === 'INICIAR' ? 'success' : 'primary',
    loading: false
  }
}

const executeConfirmedAction = async () => {
  if (confirmDialog.value.task) {
    confirmDialog.value.loading = true
    const newStatus = confirmDialog.value.type === 'INICIAR' ? 'EM_ANDAMENTO' : 'CONCLUIDO'
    await updateStatus(confirmDialog.value.task, newStatus)
    confirmDialog.value.loading = false
    confirmDialog.value.show = false
  }
}

onMounted(fetchTasks)
</script>

<style scoped>
.task-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.border-s-lg {
  border-left-width: 6px !important;
}
</style>
