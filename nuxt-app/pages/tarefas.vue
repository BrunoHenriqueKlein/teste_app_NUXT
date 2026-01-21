<template>
  <div class="w-100">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card color="primary" variant="flat" class="pa-4">
          <v-card-text class="d-flex justify-space-between align-center text-white">
            <div>
              <h1 class="text-h4 font-weight-bold">{{ showGlobal ? 'Todas as Tarefas' : 'Minhas Tarefas' }}</h1>
              <p class="text-subtitle-1">
                {{ showGlobal ? 'Visualize e monitore todos os processos da empresa' : 'Gerencie seus processos e acompanhe seu progresso' }}
              </p>
            </div>
            <v-icon size="64" color="white" class="opacity-50">mdi-clipboard-check-multiple</v-icon>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
                <span>OP: {{ task.op.numeroOP }}</span>
                <v-chip size="x-small" :color="getStatusColor(task.status)" variant="flat">
                  {{ task.status }}
                </v-chip>
              </div>
            </template>
            <v-card-title class="text-h6 font-weight-bold">{{ task.nome }}</v-card-title>
            <v-card-subtitle>{{ task.op.cliente }} - {{ task.op.descricaoMaquina }}</v-card-subtitle>
          </v-card-item>

          <v-card-text class="pt-0">
            <div class="text-body-2 mb-2 text-truncate" style="max-height: 40px">
              {{ task.descricao || 'Sem descrição' }}
            </div>
            
            <div class="mb-1 d-flex justify-space-between text-caption">
              <span>Progresso</span>
              <span>{{ task.progresso }}%</span>
            </div>
            <v-progress-linear
              v-model="task.progresso"
              color="primary"
              height="8"
              rounded
              class="mb-4"
            />

            <div class="d-flex align-center text-caption text-medium-emphasis mb-1">
              <v-icon size="16" class="mr-1">mdi-calendar-clock</v-icon>
              Prazo: {{ formatDate(task.dataTerminoPrevista) }}
            </div>

            <div v-if="showGlobal" class="d-flex align-center text-caption text-medium-emphasis">
              <v-icon size="16" class="mr-1">mdi-account-outline</v-icon>
              Responsável: {{ task.responsavel?.name || 'Não atribuído' }}
            </div>
          </v-card-text>

          <v-divider />

          <v-card-actions class="pa-3">
            <v-btn
              v-if="task.status === 'NAO_INICIADO' || task.status === 'AGUARDANDO'"
              color="success"
              variant="flat"
              block
              prepend-icon="mdi-play"
              @click="updateStatus(task, 'EM_ANDAMENTO')"
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
              @click="openCompleteDialog(task)"
              :loading="task.updating"
            >
              Concluir Tarefa
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

    <!-- Dialog de Conclusão -->
    <v-dialog v-model="completeDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Concluir Tarefa</v-card-title>
        <v-card-text>
          Você deseja finalizar a tarefa <strong>{{ completeDialog.task?.nome }}</strong>?
          Isso definirá o progresso como 100%.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="completeDialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" @click="confirmComplete">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const { user } = useAuth()
const loading = ref(true)
const tasks = ref([])
const search = ref('')
const statusFilter = ref('Todos')
const showGlobal = ref(false)

const statusOptions = ['Todos', 'NAO_INICIADO', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDO']

const completeDialog = ref({
  show: false,
  task: null
})

const fetchTasks = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/user/tasks', {
      params: { global: showGlobal.value }
    })
    tasks.value = data.map(t => ({ ...t, updating: false }))
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
      task.op.cliente.toLowerCase().includes(search.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === 'Todos' || task.status === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

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
    await $fetch(`/api/ops/${task.opId}/processos/${task.id}`, {
      method: 'PUT',
      body: { 
        status: newStatus,
        progresso: newStatus === 'CONCLUIDO' ? 100 : task.progresso
      }
    })
    task.status = newStatus
    if (newStatus === 'CONCLUIDO') task.progresso = 100
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
  } finally {
    task.updating = false
  }
}

const openCompleteDialog = (task) => {
  completeDialog.value.task = task
  completeDialog.value.show = true
}

const confirmComplete = async () => {
  if (completeDialog.value.task) {
    await updateStatus(completeDialog.value.task, 'CONCLUIDO')
    completeDialog.value.show = false
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
