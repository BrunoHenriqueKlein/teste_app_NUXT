<template>
  <v-container fluid>
    <!-- Header Específico do Dashboard -->
    <v-row>
      <v-col cols="12">
        <v-card color="primary">
          <v-card-title class="text-white">
            <v-btn icon dark @click="$router.push('/ops')" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            📊 Gráfico de Gantt - OP: {{ opData?.numeroOP }}
          </v-card-title>
          <v-card-text class="text-white">
            {{ opData?.descricaoMaquina }} - Cliente: {{ opData?.cliente }}
            <div v-if="opData?.dataEntrega" class="text-caption">
              Entrega: {{ formatDate(opData.dataEntrega) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Conteúdo ESPECÍFICO do Dashboard -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Gráfico de Gantt - Timeline de Processos</span>
            <div class="d-flex gap-2">
              <v-btn 
                color="primary" 
                @click="carregarDadosGantt"
                :loading="loading"
                prepend-icon="mdi-refresh"
              >
                Atualizar
              </v-btn>
              <v-btn 
                color="orange" 
                @click="$router.push(`/ops/${$route.params.id}/processos`)"
                prepend-icon="mdi-cog"
              >
                Gerenciar Processos
              </v-btn>
            </div>
          </v-card-title>
          
          <v-card-text>
            <!-- Estado de Carregamento -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64" />
              <div class="text-h6 mt-4">Carregando gráfico de Gantt...</div>
            </div>

            <!-- Estado Vazio -->
            <div v-else-if="!processos.length" class="text-center py-8 border-dashed">
              <v-icon size="64" color="grey-lighten-2">mdi-chart-timeline-variant</v-icon>
              <div class="text-h5 text-grey mt-2">Nenhum processo encontrado</div>
              <div class="text-caption text-grey">Adicione processos com datas para visualizar o Gantt</div>
              <v-btn 
                color="primary" 
                class="mt-4"
                @click="$router.push(`/ops/${$route.params.id}/processos`)"
                prepend-icon="mdi-plus"
              >
                Adicionar Processos
              </v-btn>
            </div>

            <!-- Gráfico de Gantt Real -->
            <div v-else>
              <!-- Estatísticas Rápidas -->
              <v-row class="mb-6">
                <v-col cols="3" v-for="stat in estatisticas" :key="stat.title">
                  <v-card variant="outlined" class="stat-card">
                    <v-card-text class="text-center pa-3">
                      <div class="text-h5 font-weight-bold" :class="`text-${stat.color}`">
                        {{ stat.value }}
                      </div>
                      <div class="text-caption text-grey">{{ stat.title }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Legenda Interativa -->
              <v-card class="mb-4" variant="outlined">
                <v-card-text class="pa-3">
                  <div class="d-flex flex-wrap gap-4 align-center">
                    <div class="d-flex align-center" v-for="item in legenda" :key="item.status">
                      <div 
                        class="legend-color mr-2" 
                        :style="{ backgroundColor: item.color }"
                      ></div>
                      <span class="text-caption font-weight-medium">{{ item.label }}</span>
                    </div>
                    <v-spacer />
                    <div class="text-caption text-grey">
                      💡 Clique em qualquer processo para editar
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <!-- VERDADEIRO GRÁFICO DE GANTT -->
              <v-card variant="outlined" class="gantt-container">
                <!-- Cabeçalho das Datas -->
                <div class="gantt-header">
                  <div class="gantt-task-header">Processos</div>
                  <div class="gantt-timeline-header">
                    <div 
                      v-for="date in timelineDates" 
                      :key="date.dateString"
                      class="gantt-date-cell"
                      :class="{ 
                        'weekend': date.isWeekend, 
                        'today': date.isToday,
                        'month-start': date.isMonthStart
                      }"
                    >
                      <div class="gantt-date">{{ date.day }}</div>
                      <div class="gantt-weekday">{{ date.weekday }}</div>
                      <div v-if="date.isMonthStart" class="gantt-month">{{ date.month }}</div>
                    </div>
                  </div>
                </div>

                <!-- Linhas dos Processos -->
                <div class="gantt-body">
                  <div 
                    v-for="processo in processosOrdenados" 
                    :key="processo.id"
                    class="gantt-row"
                    @click="editarProcesso(processo)"
                  >
                    <!-- Nome do Processo -->
                    <div class="gantt-task-cell">
                      <div class="task-info">
                        <v-icon 
                          small 
                          :color="getStatusColor(processo.status)"
                          class="mr-2"
                        >
                          {{ getStatusIcon(processo.status) }}
                        </v-icon>
                        <div class="task-details">
                          <div class="task-name">{{ processo.nome }}</div>
                          <div class="task-meta">
                            <span class="task-responsavel" v-if="processo.responsavel">
                              👤 {{ processo.responsavel.name }}
                            </span>
                            <span class="task-dates">
                              📅 {{ formatDate(processo.dataInicio || processo.dataPrevista) }} 
                              <span v-if="processo.dataFim">→ {{ formatDate(processo.dataFim) }}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <v-chip 
                        size="small"
                        :color="getStatusColor(processo.status)"
                        class="ml-2"
                      >
                        {{ processo.progresso }}%
                      </v-chip>
                    </div>

                    <!-- Barra do Gantt -->
                    <div class="gantt-timeline-cell">
                      <div 
                        class="gantt-bar"
                        :style="getGanttBarStyle(processo)"
                        :class="[
                          `status-${processo.status.toLowerCase()}`,
                          { 'completed': processo.progresso === 100 }
                        ]"
                      >
                        <!-- Barra de Progresso Interna -->
                        <div 
                          class="gantt-progress"
                          :style="{ width: `${processo.progresso}%` }"
                        ></div>
                        
                        <!-- Datas na Barra -->
                        <div class="gantt-bar-dates">
                          <span class="start-date" v-if="processo.dataInicio">
                            {{ formatDay(processo.dataInicio) }}
                          </span>
                          <span class="end-date" v-if="processo.dataFim">
                            {{ formatDay(processo.dataFim) }}
                          </span>
                        </div>

                        <!-- Tooltip na Hover -->
                        <div class="gantt-tooltip">
                          <div class="tooltip-title">{{ processo.nome }}</div>
                          <div class="tooltip-details">
                            <div>Status: {{ formatStatus(processo.status) }}</div>
                            <div>Progresso: {{ processo.progresso }}%</div>
                            <div v-if="processo.dataInicio">
                              Início: {{ formatDate(processo.dataInicio) }}
                            </div>
                            <div v-if="processo.dataFim">
                              Término: {{ formatDate(processo.dataFim) }}
                            </div>
                            <div v-if="processo.responsavel">
                              Responsável: {{ processo.responsavel.name }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Linha do Tempo Atual -->
                <div 
                  class="gantt-today-line"
                  :style="{ left: todayPosition + '%' }"
                  v-if="showTodayLine"
                >
                  <div class="today-line"></div>
                  <div class="today-label">HOJE</div>
                </div>
              </v-card>

              <!-- Resumo dos Processos -->
              <v-row class="mt-6">
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      📋 Resumo dos Processos
                    </v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="processo in processosOrdenados"
                          :key="processo.id"
                        >
                          <template v-slot:prepend>
                            <v-avatar :color="getStatusColor(processo.status)" size="32">
                              <v-icon color="white" size="18">
                                {{ getStatusIcon(processo.status) }}
                              </v-icon>
                            </v-avatar>
                          </template>
                          
                          <v-list-item-title>
                            {{ processo.nome }}
                          </v-list-item-title>
                          
                          <v-list-item-subtitle>
                            <span v-if="processo.dataInicio && processo.dataFim">
                              {{ formatDate(processo.dataInicio) }} - {{ formatDate(processo.dataFim) }}
                            </span>
                            <span v-else-if="processo.dataPrevista">
                              Previsto: {{ formatDate(processo.dataPrevista) }}
                            </span>
                            <span v-else>
                              Sem data definida
                            </span>
                          </v-list-item-subtitle>

                          <template v-slot:append>
                            <v-chip 
                              size="small"
                              :color="getStatusColor(processo.status)"
                            >
                              {{ processo.progresso }}%
                            </v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      ⚡ Ações Rápidas
                    </v-card-title>
                    <v-card-text>
                      <div class="d-flex flex-column gap-2">
                        <v-btn 
                          color="primary" 
                          block
                          @click="$router.push(`/ops/${$route.params.id}/processos`)"
                          prepend-icon="mdi-cog"
                        >
                          Gerenciar Todos os Processos
                        </v-btn>
                        <v-btn 
                          color="green" 
                          block
                          @click="abrirProcessosAtrasados"
                          prepend-icon="mdi-alert"
                          :disabled="!processosAtrasados.length"
                        >
                          Processos Atrasados ({{ processosAtrasados.length }})
                        </v-btn>
                        <v-btn 
                          color="orange" 
                          block
                          @click="abrirProcessosHoje"
                          prepend-icon="mdi-calendar-today"
                          :disabled="!processosHoje.length"
                        >
                          Processos para Hoje ({{ processosHoje.length }})
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// Estado
const route = useRoute()
const opData = ref(null)
const processos = ref([])
const loading = ref(true)

// Computed
const processosOrdenados = computed(() => {
  return [...processos.value].sort((a, b) => (a.sequencia || 0) - (b.sequencia || 0))
})

const processosConcluidos = computed(() => {
  return processos.value.filter(p => p.status === 'CONCLUIDO').length
})

const progressoGeral = computed(() => {
  if (!processos.value.length) return 0
  const total = processos.value.reduce((sum, p) => sum + (p.progresso || 0), 0)
  return Math.round(total / processos.value.length)
})

const estatisticas = computed(() => [
  { title: 'Total Processos', value: processos.value.length, color: 'primary' },
  { title: 'Concluídos', value: processosConcluidos.value, color: 'success' },
  { title: 'Em Andamento', value: processos.value.filter(p => p.status === 'EM_ANDAMENTO').length, color: 'warning' },
  { title: 'Progresso Geral', value: `${progressoGeral.value}%`, color: 'info' }
])

const legenda = computed(() => [
  { status: 'NAO_INICIADO', label: 'Não Iniciado', color: '#9E9E9E' },
  { status: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#2196F3' },
  { status: 'AGUARDANDO', label: 'Aguardando', color: '#FF9800' },
  { status: 'CONCLUIDO', label: 'Concluído', color: '#4CAF50' },
  { status: 'BLOQUEADO', label: 'Bloqueado', color: '#F44336' }
])

// Timeline - 60 dias (2 meses)
const timelineDates = computed(() => {
  const dates = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 15) // 15 dias atrás
  
  for (let i = 0; i < 60; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const dateString = currentDate.toISOString().split('T')[0]
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
    const isToday = currentDate.toDateString() === today.toDateString()
    const isMonthStart = currentDate.getDate() === 1
    
    dates.push({
      dateString,
      day: currentDate.getDate(),
      weekday: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDate.getDay()],
      month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][currentDate.getMonth()],
      isWeekend,
      isToday,
      isMonthStart,
      date: currentDate
    })
  }
  
  return dates
})

const showTodayLine = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return timelineDates.value.some(d => d.dateString === today)
})

const todayPosition = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const index = timelineDates.value.findIndex(d => d.dateString === today)
  return (index / timelineDates.value.length) * 100
})

const processosAtrasados = computed(() => {
  const today = new Date()
  return processos.value.filter(p => {
    if (!p.dataPrevista) return false
    const dataPrevista = new Date(p.dataPrevista)
    return dataPrevista < today && p.status !== 'CONCLUIDO'
  })
})

const processosHoje = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return processos.value.filter(p => {
    if (!p.dataPrevista) return false
    const dataPrevista = new Date(p.dataPrevista).toISOString().split('T')[0]
    return dataPrevista === today && p.status !== 'CONCLUIDO'
  })
})

// Métodos
const carregarDadosGantt = async () => {
  loading.value = true
  try {
    console.log('📊 Carregando dados do Gantt para OP:', route.params.id)
    
    const [opResponse, processosResponse] = await Promise.all([
      $fetch(`/api/ops/${route.params.id}`),
      $fetch(`/api/ops/${route.params.id}/processos`)
    ])
    
    opData.value = opResponse
    processos.value = Array.isArray(processosResponse) ? processosResponse : []
    
    console.log('✅ Dados carregados:', {
      op: opData.value?.numeroOP,
      processos: processos.value.length,
      comDatas: processos.value.filter(p => p.dataPrevista).length
    })
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados do Gantt:', error)
    processos.value = []
  } finally {
    loading.value = false
  }
}

const editarProcesso = (processo) => {
  navigateTo(`/ops/${route.params.id}/processos`)
}

const abrirProcessosAtrasados = () => {
  // Implementar lógica para filtrar processos atrasados
  navigateTo(`/ops/${$route.params.id}/processos`)
}

const abrirProcessosHoje = () => {
  // Implementar lógica para filtrar processos de hoje
  navigateTo(`/ops/${$route.params.id}/processos`)
}

const getGanttBarStyle = (processo) => {
  if (!processo.dataPrevista) {
    return { left: '0%', width: '5%' }
  }

  const startDate = new Date(processo.dataPrevista)
  const endDate = processo.dataFim ? new Date(processo.dataFim) : new Date(startDate)
  
  // Se não tem data fim, usa prazo estimado ou 7 dias padrão
  if (!processo.dataFim) {
    endDate.setDate(startDate.getDate() + (processo.prazoEstimado || 7))
  }

  const timelineStart = new Date(timelineDates.value[0].date)
  const timelineEnd = new Date(timelineDates.value[timelineDates.value.length - 1].date)
  
  const totalMs = timelineEnd - timelineStart
  const startMs = Math.max(0, startDate - timelineStart)
  const durationMs = Math.max(1, endDate - startDate)
  
  const left = (startMs / totalMs) * 100
  const width = (durationMs / totalMs) * 100
  
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.min(100, width)}%`
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

const formatDay = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).getDate()
}

// Lifecycle
onMounted(() => {
  console.log('📊 DASHBOARD GANTT - OP:', route.params.id)
  carregarDadosGantt()
})
</script>

<style scoped>
.border-dashed {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* VERDADEIRO ESTILO GANTT */
.gantt-container {
  overflow-x: auto;
  border-radius: 8px;
}

.gantt-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 10;
}

.gantt-task-header {
  width: 300px;
  min-width: 300px;
  padding: 12px 16px;
  font-weight: 600;
  background: #e9ecef;
  border-right: 2px solid #dee2e6;
  display: flex;
  align-items: center;
}

.gantt-timeline-header {
  display: flex;
  flex: 1;
  min-width: 1200px;
}

.gantt-date-cell {
  flex: 1;
  min-width: 40px;
  padding: 8px 4px;
  text-align: center;
  border-right: 1px solid #dee2e6;
  position: relative;
}

.gantt-date-cell.weekend {
  background: #f8f9fa;
}

.gantt-date-cell.today {
  background: #e3f2fd;
  font-weight: bold;
}

.gantt-date-cell.month-start {
  border-left: 2px solid #1976d2;
}

.gantt-date {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
}

.gantt-weekday {
  font-size: 10px;
  color: #6c757d;
  text-transform: uppercase;
}

.gantt-month {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  font-size: 10px;
  font-weight: 600;
  color: #1976d2;
  background: #e3f2fd;
  padding: 2px;
}

.gantt-body {
  min-width: 1500px;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s;
  cursor: pointer;
}

.gantt-row:hover {
  background: #f8f9fa;
}

.gantt-task-cell {
  width: 300px;
  min-width: 300px;
  padding: 12px 16px;
  border-right: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.task-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.task-details {
  flex: 1;
}

.task-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.task-meta {
  font-size: 11px;
  color: #6c757d;
}

.task-responsavel, .task-dates {
  display: block;
  margin-bottom: 1px;
}

.gantt-timeline-cell {
  flex: 1;
  position: relative;
  min-height: 50px;
  background: 
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 39px,
      #f8f9fa 39px,
      #f8f9fa 40px
    );
}

.gantt-bar {
  position: absolute;
  top: 8px;
  height: 34px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  min-width: 20px;
}

.gantt-bar:hover {
  transform: scaleY(1.1);
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.gantt-progress {
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  transition: width 0.3s ease;
}

.gantt-bar-dates {
  position: absolute;
  top: 50%;
  left: 4px;
  right: 4px;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
}

.gantt-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: 10;
}

.gantt-bar:hover .gantt-tooltip {
  opacity: 1;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,0.3);
  padding-bottom: 2px;
}

.tooltip-details div {
  margin-bottom: 2px;
}

/* Status Colors */
.status-nao_iniciado {
  background: linear-gradient(135deg, #9E9E9E, #757575);
}

.status-em_andamento {
  background: linear-gradient(135deg, #2196F3, #1976D2);
}

.status-aguardando {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.status-concluido {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
}

.status-bloqueado {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.status-cancelado {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.gantt-bar.completed {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

/* Linha do Tempo Atual */
.gantt-today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 3;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff4444;
  box-shadow: 0 0 4px rgba(255, 68, 68, 0.6);
}

.today-label {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #ff4444;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  transform: translateX(-50%);
}
</style>