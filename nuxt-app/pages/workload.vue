<template>
  <div class="w-100 pa-4">
    <!-- Header -->
    <PageHeader 
      title="Carga de Trabalho (Workload)" 
      subtitle="Dashboard de ocupação da equipe e planejamento de tarefas"
      icon="mdi-chart-timeline-variant"
    />

    <!-- Feedback de Erro -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
      {{ snackbar.text }}
    </v-snackbar>

    <!-- Debug Info (Apenas para Admin) -->
    <v-alert v-if="debugInfo && user?.role === 'ADMIN'" type="info" variant="tonal" class="mb-4" density="compact">
      <div class="text-caption">
        <strong>Debug:</strong> {{ debugInfo.usersCount }} usuários, {{ debugInfo.tasksCount }} processos encontrados no banco.
      </div>
    </v-alert>

    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64" />
      <div class="text-h6 mt-4">Calculando carga de trabalho...</div>
    </div>

    <div v-else>
      <!-- Stats Resumo -->
      <v-row class="mb-6">
        <v-col cols="12" md="2">
          <v-card variant="flat" border class="pa-4 bg-blue-lighten-5 h-100">
            <div class="text-overline">Total Ativas</div>
            <div class="text-h3 font-weight-bold text-blue-darken-3">{{ totalTasks }}</div>
            <div class="text-caption mt-2">Andamento/Plan.</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card variant="flat" border class="pa-4 bg-orange-lighten-5 h-100">
            <div class="text-overline">Média Ocupação</div>
            <div class="text-h3 font-weight-bold text-orange-darken-3">{{ avgTasksPerUser }}</div>
            <div class="text-caption mt-2">Tarefas/func.</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card variant="flat" border class="pa-4 bg-red-lighten-5 h-100">
            <div class="text-overline">Sem Data</div>
            <div class="text-h3 font-weight-bold text-red-darken-3">{{ tasksWithoutDates }}</div>
            <div class="text-caption mt-2">Pendentes agend.</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="2">
          <v-card variant="flat" border class="pa-4 bg-error-lighten-5 h-100">
            <div class="text-overline">Atrasadas</div>
            <div class="text-h3 font-weight-bold text-error">{{ lateTasksCount }}</div>
            <div class="text-caption mt-2">Tarefas fora do prazo</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="2">
          <v-card variant="flat" border class="pa-4 bg-green-lighten-5 h-100">
            <div class="text-overline">Fim Previsto (Próx)</div>
            <div class="text-h4 font-weight-bold text-green-darken-3 text-no-wrap">{{ nextAvailableDate }}</div>
            <div class="text-caption mt-2">Próxima data livre</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Gráfico de Carga por Funcionário -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title class="pa-4 d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
          Distribuição de Carga de Trabalho
        </v-card-title>
        <v-card-text>
          <div v-for="user in workloadData" :key="user.userId" class="mb-4">
            <div class="d-flex justify-space-between align-end mb-1">
              <div>
                <span class="font-weight-bold">{{ user.userName }}</span>
                <span class="text-caption text-grey ml-2">{{ user.userRole }}</span>
              </div>
              <span class="text-caption font-weight-bold">{{ user.tasks.length }} Tarefas</span>
            </div>
            <v-progress-linear
              :model-value="(user.tasks.length / maxTasks) * 100"
              :color="getLoadColor(user.tasks.length)"
              height="15"
              rounded
            >
              <template v-slot:default="{ value }">
                <span class="text-tiny text-white font-weight-bold" v-if="value > 15">
                  {{ user.tasks.length }} tarefas
                </span>
              </template>
            </v-progress-linear>
          </div>
        </v-card-text>
      </v-card>

      <!-- Linha do Tempo (Workload Timeline) -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title class="pa-4 d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-calendar-clock</v-icon>
          Calendário de Ocupação da Equipe
          <v-spacer />
          <div class="d-flex gap-2">
            <v-btn icon="mdi-chevron-left" @click="prevMonth" variant="text"></v-btn>
            <span class="text-h6 mx-4">{{ currentMonthName }}</span>
            <v-btn icon="mdi-chevron-right" @click="nextMonth" variant="text"></v-btn>
          </div>
        </v-card-title>
        
        <v-divider />

        <div class="timeline-container overflow-x-auto">
          <table class="timeline-table">
            <thead>
              <tr>
                <th class="user-col">Setor / Funcionário</th>
                <th v-for="day in daysInMonth" :key="day" :class="{ 'is-today': isToday(day), 'is-weekend': isWeekend(day) }">
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in workloadData" :key="user.userId">
                <td class="user-cell">
                  <div class="font-weight-bold">{{ user.userName }}</div>
                  <div class="text-tiny text-grey">{{ user.department }}</div>
                </td>
                <td v-for="day in daysInMonth" :key="day" :class="{ 'is-weekend': isWeekend(day), 'is-today': isToday(day) }">
                  <div class="day-cell">
                    <template v-for="task in user.tasks" :key="task.id">
                      <v-tooltip bottom v-if="isTaskInDay(task, day)">
                        <template v-slot:activator="{ props }">
                          <div 
                            v-bind="props"
                            class="task-bar" 
                            :class="[getStatusClass(task.status), { 'is-late': isLate(task) }]"
                            @click="viewTask(task)"
                          >
                            <v-icon v-if="isLate(task)" size="10" color="white" class="late-icon">mdi-alert</v-icon>
                          </div>
                        </template>
                        <span>{{ task.op }} - {{ task.nome }} ({{ formatDate(task.dataInicioPrevista) }} - {{ formatDate(task.dataTerminoPrevista) }})</span>
                      </v-tooltip>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Legenda e Aviso de Tarefas sem Data -->
        <v-divider />
        <v-card-text class="pa-4">
          <div class="d-flex align-center flex-wrap gap-4 text-caption text-grey">
            <div class="d-flex align-center"><div class="task-bar status-working mr-1" style="width:12px"></div> Em Andamento</div>
            <div class="d-flex align-center"><div class="task-bar status-planned mr-1" style="width:12px"></div> Planejado</div>
            <div class="d-flex align-center"><div class="task-bar status-waiting mr-1" style="width:12px"></div> Aguardando</div>
            <div class="d-flex align-center"><div class="task-bar status-done mr-1" style="width:12px"></div> Concluído</div>
          </div>
          
          <div v-if="tasksWithoutDates > 0" class="mt-4 pa-3 bg-red-lighten-5 rounded border-red">
            <div class="text-subtitle-2 text-red-darken-3 font-weight-bold mb-1">
              <v-icon size="18" class="mr-1">mdi-alert-circle</v-icon>
              {{ tasksWithoutDates }} tarefas não aparecem no calendário por falta de data prevista:
            </div>
            <div class="text-caption text-red-darken-2">
              As tarefas abaixo precisam de datas de Início e Término Previstos nas suas respectivas OPs para serem exibidas na linha do tempo.
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Detalhamento de Tarefas por Usuário -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title class="pa-4">
          <v-icon color="primary" class="mr-2">mdi-format-list-bulleted</v-icon>
          Tarefas Individuais por Funcionário
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="user in workloadData"
              :key="'panel-' + user.userId"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                  <span class="font-weight-bold">{{ user.userName }}</span>
                  <v-spacer />
                  <v-chip size="small" :color="getLoadColor(user.tasks.length)" variant="flat" class="mr-4">
                    {{ user.tasks.length }} tarefas
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="task in user.tasks"
                    :key="'list-task-' + task.id"
                    @click="viewTask(task)"
                    class="border-bottom"
                  >
                    <template v-slot:prepend>
                      <v-badge
                        dot
                        :color="isLate(task) ? 'error' : 'transparent'"
                        location="top start"
                        :offset-x="3"
                        :offset-y="3"
                      >
                        <v-icon :color="getStatusColor(task.status)">{{ getStatusIcon(task.status) }}</v-icon>
                      </v-badge>
                    </template>
                    <v-list-item-title class="font-weight-bold">
                      {{ task.nome }}
                      <v-chip v-if="isLate(task)" size="x-small" color="error" variant="flat" class="ml-2">ATRASADA</v-chip>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      OP: {{ task.op }} • Cliente: {{ task.cliente }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <div class="text-right d-none d-sm-block">
                        <div class="text-caption font-weight-bold" :class="task.dataInicioPrevista ? 'text-blue' : 'text-red'">
                          {{ task.dataInicioPrevista ? formatDate(task.dataInicioPrevista) : 'Sem Início' }}
                        </div>
                        <div class="text-caption" :class="task.dataTerminoPrevista ? 'text-green' : 'text-red'">
                          {{ task.dataTerminoPrevista ? formatDate(task.dataTerminoPrevista) : 'Sem Fim' }}
                        </div>
                      </div>
                      <v-icon size="small" class="ml-4">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
                <div v-if="user.tasks.length === 0" class="text-center py-4 text-grey">
                  Nenhuma tarefa atribuída.
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </div>

    <!-- Dialog Detalhes da Tarefa -->
    <v-dialog v-model="showTaskDialog" max-width="500">
      <v-card v-if="selectedTask">
        <v-card-title class="bg-primary text-white">
          <v-icon class="mr-2">mdi-clipboard-text</v-icon>
          Detalhes da Tarefa
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-overline text-primary">OP {{ selectedTask.op }}</div>
          <div class="text-h5 font-weight-bold mb-2">{{ selectedTask.nome }}</div>
          <div class="text-body-2 text-grey mb-4">{{ selectedTask.maquina }}</div>
          
          <v-divider class="mb-4" />
          
          <div class="d-flex justify-space-between mb-2">
            <span>Cliente:</span>
            <span class="font-weight-bold">{{ selectedTask.cliente }}</span>
          </div>
          
          <v-divider class="my-4" />
          
          <div class="text-subtitle-2 mb-2 font-weight-bold">Agendamento</div>
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="editedDates.start"
                label="Início Previsto"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-2"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="editedDates.end"
                label="Término Previsto"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-2"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <div class="mt-4">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span>Progresso Atual</span>
              <span>{{ selectedTask.progresso }}%</span>
            </div>
            <v-progress-linear
              :model-value="selectedTask.progresso"
              color="primary"
              height="8"
              rounded
            ></v-progress-linear>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="grey-darken-1" variant="text" @click="showTaskDialog = false">Cancelar</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            :loading="savingTask"
            @click="saveTaskDates"
            prepend-icon="mdi-calendar-check"
          >
            Confirmar Datas
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
const { user, authHeaders, hasPermission } = useAuth()
const loading = ref(true)
const savingTask = ref(false)
const workloadData = ref([])
const showTaskDialog = ref(false)
const selectedTask = ref(null)
const debugInfo = ref(null)
const snackbar = ref({ show: false, text: '', color: 'error' })

const editedDates = ref({
  start: '',
  end: ''
})

// Calendário
const currentDate = ref(new Date())
const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return new Date(year, month + 1, 0).getDate()
})

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const totalTasks = computed(() => {
  return workloadData.value.reduce((acc, user) => acc + user.tasks.length, 0)
})

const tasksWithoutDates = computed(() => {
  let count = 0
  workloadData.value.forEach(user => {
    user.tasks.forEach(task => {
      if (!task.dataInicioPrevista || !task.dataTerminoPrevista) count++
    })
  })
  return count
})

const lateTasksCount = computed(() => {
  let count = 0
  workloadData.value.forEach(user => {
    user.tasks.forEach(task => {
      if (isLate(task)) count++
    })
  })
  return count
})

const avgTasksPerUser = computed(() => {
  if (workloadData.value.length === 0) return 0
  return (totalTasks.value / workloadData.value.length).toFixed(1)
})

const nextAvailableDate = computed(() => {
  let latestDate = new Date()
  workloadData.value.forEach(user => {
    user.tasks.forEach(task => {
      const taskEnd = new Date(task.dataTerminoPrevista)
      if (taskEnd > latestDate) latestDate = taskEnd
    })
  })
  return formatDate(latestDate)
})

const maxTasks = computed(() => {
  const counts = workloadData.value.map(u => u.tasks.length)
  return Math.max(...counts, 5)
})

const loadWorkload = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/relatorios/workload', {
      headers: authHeaders.value
    })
    if (response.success) {
      workloadData.value = response.data
      debugInfo.value = response.debug
      if (response.data.length === 0) {
        snackbar.value = { show: true, text: 'Nenhum dado de carga de trabalho encontrado.', color: 'warning' }
      }
    }
  } catch (error) {
    console.error('Erro ao carregar workload:', error)
    snackbar.value = { show: true, text: 'Erro ao conectar com a API de Workload.', color: 'error' }
  } finally {
    loading.value = false
  }
}

const getLoadColor = (tasks) => {
  if (tasks > 5) return 'red'
  if (tasks > 3) return 'orange'
  return 'green'
}

const getStatusClass = (status) => {
  if (status === 'EM_ANDAMENTO') return 'status-working'
  if (status === 'AGUARDANDO') return 'status-waiting'
  if (status === 'CONCLUIDO') return 'status-done'
  return 'status-planned'
}

const getStatusColor = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'blue'
    case 'AGUARDANDO': return 'orange'
    case 'CONCLUIDO': return 'green'
    case 'BLOQUEADO': return 'red'
    default: return 'grey'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'mdi-play-circle'
    case 'AGUARDANDO': return 'mdi-clock-outline'
    case 'CONCLUIDO': return 'mdi-check-circle'
    case 'BLOQUEADO': return 'mdi-alert-octagon'
    default: return 'mdi-clipboard-text'
  }
}

const isLate = (task) => {
  if (task.status === 'CONCLUIDO' || task.status === 'CANCELADO') return false
  if (!task.dataTerminoPrevista) return false
  
  const today = new Date()
  today.setHours(0,0,0,0)
  const end = new Date(task.dataTerminoPrevista)
  end.setHours(0,0,0,0)
  
  return end < today
}

const isTaskInDay = (task, day) => {
  if (!task.dataInicioPrevista || !task.dataTerminoPrevista) return false
  
  const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), day)
  const start = new Date(task.dataInicioPrevista)
  const end = new Date(task.dataTerminoPrevista)
  
  // Resetar horas para comparação justa
  date.setHours(0,0,0,0)
  start.setHours(0,0,0,0)
  end.setHours(0,0,0,0)
  
  return date >= start && date <= end
}

const isWeekend = (day) => {
  const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), day)
  const dotw = date.getDay()
  return dotw === 0 || dotw === 6
}

const isToday = (day) => {
  const today = new Date()
  return today.getDate() === day && 
         today.getMonth() === currentDate.value.getMonth() && 
         today.getFullYear() === currentDate.value.getFullYear()
}

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const viewTask = (task) => {
  selectedTask.value = task
  editedDates.value = {
    start: task.dataInicioPrevista ? new Date(task.dataInicioPrevista).toISOString().split('T')[0] : '',
    end: task.dataTerminoPrevista ? new Date(task.dataTerminoPrevista).toISOString().split('T')[0] : ''
  }
  showTaskDialog.value = true
}

const saveTaskDates = async () => {
  if (!selectedTask.value) return
  
  savingTask.value = true
  try {
    const { opId, id } = selectedTask.value
    await $fetch(`/api/ops/${opId}/processos/${id}`, {
      method: 'PUT',
      body: {
        ...selectedTask.value, // Mantemos os dados existentes
        dataInicioPrevista: editedDates.value.start,
        dataTerminoPrevista: editedDates.value.end
      },
      headers: authHeaders.value
    })
    
    snackbar.value = { show: true, text: 'Datas atualizadas com sucesso!', color: 'success' }
    showTaskDialog.value = false
    await loadWorkload() // Recarregar para atualizar o calendário
  } catch (error) {
    console.error('Erro ao salvar datas:', error)
    snackbar.value = { show: true, text: 'Erro ao salvar datas do processo.', color: 'error' }
  } finally {
    savingTask.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

onMounted(loadWorkload)
</script>

<style scoped>
.timeline-container {
  max-width: 100%;
}

.timeline-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.timeline-table th, .timeline-table td {
  border: 1px solid #e0e0e0;
  min-width: 25px;
  height: 40px;
  text-align: center;
}

.timeline-table .user-col, .timeline-table .user-cell {
  min-width: 180px;
  position: sticky;
  left: 0;
  background: white;
  z-index: 2;
  text-align: left;
  padding: 8px;
}

.timeline-table th {
  background: #f5f5f5;
  font-weight: bold;
}

.is-weekend {
  background-color: #fafafa !important;
}

.is-today {
  background-color: #fff3e0 !important;
  border-left: 2px solid orange !important;
  border-right: 2px solid orange !important;
}

.day-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 2px;
}

.task-bar {
  height: 12px;
  width: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.task-bar:hover {
  transform: scale(1.1);
  z-index: 5;
}

.status-planned { background: #bdbdbd; }
.status-working { background: #2196f3; }
.status-waiting { background: #ff9800; }
.status-done { background: #4caf50; }

.is-late {
  background-color: #f44336 !important;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
  animation: pulse-late 2s infinite;
}

@keyframes pulse-late {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.late-icon {
  margin-top: -2px;
}

.text-tiny {
  font-size: 10px;
  line-height: 1.2;
}

.gap-2 { gap: 8px; }
</style>
