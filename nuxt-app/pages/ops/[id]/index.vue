<template>
  <div class="w-100 gantt-page-container">
    <!-- Header Específico do Dashboard (Web) - Apenas na Tela -->
    <v-row class="no-print">
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
            <div class="text-caption">
              Início OP: <strong>{{ formatDate(dataInicioOP) }}</strong> | 
              Término Previsto: <strong>{{ formatDate(dataTerminoPrevista) }}</strong>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Conteúdo ESPECÍFICO do Dashboard -->
    <v-row class="mt-4 no-print">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="no-print">Gráfico de Gantt - Timeline de Processos</span>
            <div class="d-flex align-center flex-wrap gap-2 mb-4 no-print">
        <v-btn
          color="primary"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="navigateTo('/ops')"
        >
          Voltar para Lista
        </v-btn>
        
        <v-spacer></v-spacer>

        <!-- Controles de Escala e Margens -->
        <div class="d-flex align-center no-print mr-4 flex-wrap gap-4" style="max-width: 600px;">
          <div class="d-flex align-center" style="width: 200px;">
            <v-icon size="small" class="mr-2" title="Largura dos Dias">mdi-magnify-plus-outline</v-icon>
            <v-slider
              v-model="celulaLargura"
              :min="10"
              :max="100"
              :step="1"
              hide-details
              density="compact"
              color="primary"
            ></v-slider>
          </div>
          
          <div class="d-flex align-center" style="width: 150px;">
            <v-text-field
              v-model.number="paddingInicio"
              label="Folga Início (dias)"
              type="number"
              hide-details
              density="compact"
              variant="outlined"
              class="mr-2"
            ></v-text-field>
          </div>

          <div class="d-flex align-center" style="width: 150px;">
            <v-text-field
              v-model.number="paddingFim"
              label="Folga Fim (dias)"
              type="number"
              hide-details
              density="compact"
              variant="outlined"
            ></v-text-field>
          </div>
          
          <v-btn
            icon="mdi-arrow-expand-horizontal"
            variant="text"
            size="small"
            title="Ajustar à Tela"
            @click="ajustarATela"
          ></v-btn>
        </div>

        <v-btn
          color="secondary"
          prepend-icon="mdi-file-pdf-box"
          variant="elevated"
          @click="abrirImpressao"
          class="mr-2"
        >
          Exportar PDF
        </v-btn>

        <!-- Filtros de Visibilidade -->
        <div class="d-flex align-center no-print mr-4">
          <v-checkbox
            v-model="mostrarPrevisto"
            label="Previsto"
            hide-details
            density="compact"
            class="mr-4"
            color="secondary"
          ></v-checkbox>
          <v-checkbox
            v-model="mostrarReal"
            label="Real"
            hide-details
            density="compact"
            color="primary"
          ></v-checkbox>
        </div>

        <v-btn
          color="primary"
          prepend-icon="mdi-cog"
          variant="outlined"
          @click="navigateTo(`/ops/${route.params.id}/processos`)"
          class="mr-2"
        >
          Etapas da Máquina
        </v-btn>

        <v-btn
          color="info"
          prepend-icon="mdi-cogs"
          variant="elevated"
          @click="navigateTo(`/ops/${route.params.id}/pecas`)"
          class="mr-2"
        >
          Peças (BOM)
        </v-btn>

        <v-btn
          color="secondary"
          prepend-icon="mdi-factory"
          variant="elevated"
          @click="generateOS"
          :loading="loadingOS"
        >
          Gerar Ordens (PCP)
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
              <!-- ÁREA DE IMPRESSÃO (Focada apenas no Gráfico e Cabeçalho de Impressão) -->
              <div class="print-content">
                <!-- Cabeçalho Exclusivo para Impressão -->
                <div class="print-only-header">
                  <div class="d-flex justify-space-between align-center mb-4">
                    <div>
                      <h1 class="text-h4 font-weight-bold mb-1">CRONOGRAMA DE PRODUÇÃO</h1>
                      <div class="text-h6 text-grey-darken-1">OP: {{ opData?.numeroOP }} - {{ opData?.descricaoMaquina }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-subtitle-1">Cliente: {{ opData?.cliente }}</div>
                      <div class="text-caption">Gerado em: {{ new Date().toLocaleDateString('pt-BR') }}</div>
                    </div>
                  </div>
                  <v-divider class="mb-4"></v-divider>
                </div>

                <!-- Estatísticas Rápidas (Poderia ser impressa ou não, vamos ocultar para focar no Gantt) -->
                <v-row class="mb-6 no-print">
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
              <v-card class="mb-4 no-print" variant="outlined">
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

              <!-- Container do Gantt com Scroll Horizontal -->
              <div class="gantt-scroll-container">
                <div class="gantt-container" :style="{ width: `${taskHeaderWidth + timelineDates.length * celulaLargura}px` }">
                  <!-- Cabeçalho das Datas -->
                  <div class="gantt-header">
                    <div class="gantt-task-header" :style="{ width: `${taskHeaderWidth}px`, minWidth: `${taskHeaderWidth}px` }">Processos</div>
                    <div class="gantt-timeline-header">
                      <!-- Agrupamento por Mês -->
                      <div class="gantt-months-row">
                        <div 
                          v-for="month in monthGroups" 
                          :key="month.id" 
                          class="gantt-month-label"
                          :style="{ width: `${month.days * celulaLargura}px` }"
                        >
                          {{ month.label }}
                        </div>
                      </div>
                      <!-- Dias -->
                      <div class="gantt-days-row">
                        <div 
                          v-for="date in timelineDates" 
                          :key="date.dateString"
                          class="gantt-date-cell"
                          :style="{ width: `${celulaLargura}px`, minWidth: `${celulaLargura}px` }"
                          :class="{ 
                            'weekend': date.isWeekend, 
                            'today': date.isToday
                          }"
                        >
                          <div class="gantt-date">{{ date.day }}</div>
                          <div class="gantt-weekday">{{ date.weekday }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Linha do Tempo Atual -->
                  <div 
                    v-if="todayPosition >= 0"
                    class="gantt-today-line"
                    :style="{ left: `${taskHeaderWidth + todayPosition}px` }"
                  >
                    <div class="today-marker">HOJE</div>
                  </div>

                  <!-- Linha de Entrega (Milestone) -->
                  <div 
                    v-if="entregaPosition >= 0"
                    class="gantt-delivery-line"
                    :style="{ left: `${taskHeaderWidth + entregaPosition}px` }"
                  >
                    <div class="delivery-marker">
                      <v-icon size="14" color="white" class="mr-1">mdi-flag-variant</v-icon>
                      ENTREGA OP
                    </div>
                  </div>

                  <!-- Linhas dos Processos -->
                  <div class="gantt-body">
                    <div 
                      v-for="processo in processosOrdenados" 
                      :key="processo.id"
                      class="gantt-row"
                    >
                      <!-- Nome do Processo -->
                      <div class="gantt-task-cell" :style="{ width: `${taskHeaderWidth}px`, minWidth: `${taskHeaderWidth}px` }">
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
                              <span v-if="processo.responsavel">👤 {{ processo.responsavel.name }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Área das Barras -->
                      <div class="gantt-timeline-cell">
                        <!-- Grade de Fundo -->
                        <div class="gantt-grid">
                          <div 
                            v-for="n in timelineDates.length" 
                            :key="n" 
                            class="grid-line"
                            :style="{ width: `${celulaLargura}px`, minWidth: `${celulaLargura}px` }"
                          ></div>
                        </div>

                        <!-- BARRA PLANEJADA (Background/Outline) - SEMPRE VISÍVEL se houver data -->
                        <div 
                          v-if="mostrarPrevisto && processo.dataInicioPrevista && processo.dataTerminoPrevista"
                          class="gantt-bar planned"
                          :style="getGanttBarStyle(processo.dataInicioPrevista, processo.dataTerminoPrevista)"
                        >
                          <div class="bar-label">Previsto: {{ formatDate(processo.dataInicioPrevista) }} - {{ formatDate(processo.dataTerminoPrevista) }}</div>
                        </div>

                        <!-- BARRA REAL (Sólida) -->
                        <div 
                          v-if="mostrarReal && processo.dataInicio"
                          class="gantt-bar actual"
                          :style="getGanttBarStyle(processo.dataInicio, processo.dataFim || new Date())"
                          :class="getActualBarClass(processo)"
                        >
                          <div class="gantt-progress" :style="{ width: `${processo.progresso}%` }"></div>
                          <div class="bar-label exterior">
                            {{ processo.status === 'CONCLUIDO' ? 'Concluído' : 'Real' }}: {{ formatDate(processo.dataInicio) }} - {{ processo.dataFim ? formatDate(processo.dataFim) : 'Em andamento' }}
                            <span v-if="isProcessoAtrasado(processo)" class="delay-tag">(Atrasado)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> <!-- Fim de .print-content -->

            <!-- Resumo dos Processos (Não aparece na impressão) -->
            <div class="no-print">
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
                            <span v-if="processo.dataInicioPrevista && processo.dataTerminoPrevista">
                              {{ formatDate(processo.dataInicioPrevista) }} - {{ formatDate(processo.dataTerminoPrevista) }}
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
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  </div>
</template>

<script setup>
// Estado
const route = useRoute()
const opId = route.params.id
const loadingOS = ref(false)

const generateOS = async () => {
  loadingOS.value = true
  try {
    const result = await $fetch(`/api/ops/${opId}/pcp/generate-os`, { method: 'POST' })
    if (result.success) {
      alert(`Sucesso! ${result.createdCount} Ordens de Serviço foram geradas.`)
      // Redirecionar para o PCP filtrando por esta OP
      navigateTo(`/pcp?opId=${opId}`)
    }
  } catch (error) {
    console.error('Erro ao gerar OS:', error)
    alert('Erro ao gerar Ordens de Serviço. Certifique-se de que as peças possuem processos cadastrados.')
  } finally {
    loadingOS.value = false
  }
}
const opData = ref(null)
const processos = ref([])
const loading = ref(true)
const dataInicioOP = ref('')
const showTodayLine = ref(true)

// Configurações de Escala e Timeline
const celulaLargura = ref(40)
const taskHeaderWidth = ref(250)
const paddingInicio = ref(7)
const paddingFim = ref(30)

// Filtros de Visibilidade
const mostrarPrevisto = ref(true)
const mostrarReal = ref(true)

// Computed
const processosOrdenados = computed(() => {
  if (!processos.value.length || !dataInicioOP.value) return processos.value

  const processosCalculados = JSON.parse(JSON.stringify(processos.value))
  processosCalculados.sort((a, b) => (a.sequencia || 0) - (b.sequencia || 0))
  
  let dataInicioAtual = new Date(dataInicioOP.value)
  
  for (let i = 0; i < processosCalculados.length; i++) {
    const processo = processosCalculados[i]
    
    // Se não tiver data prevista no banco, calcula em cascata
    if (!processo.dataInicioPrevista || !processo.dataTerminoPrevista) {
      if (i === 0) {
        processo.dataInicioPrevista = dataInicioOP.value
      } else {
        const processoAnterior = processosCalculados[i - 1]
        const dataTerminoAnterior = new Date(processoAnterior.dataTerminoPrevista)
        dataTerminoAnterior.setDate(dataTerminoAnterior.getDate() + 1)
        processo.dataInicioPrevista = dataTerminoAnterior.toISOString().split('T')[0]
        dataInicioAtual = new Date(processo.dataInicioPrevista)
      }
      
      if (processo.prazoEstimado && processo.prazoEstimado > 0) {
        const dataTermino = new Date(dataInicioAtual)
        dataTermino.setDate(dataTermino.getDate() + processo.prazoEstimado - 1)
        processo.dataTerminoPrevista = dataTermino.toISOString().split('T')[0]
      }
    }
  }
  
  return processosCalculados
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

const dataTerminoPrevista = computed(() => {
  if (!processosOrdenados.value.length) return null
  const ultimoProcesso = processosOrdenados.value[processosOrdenados.value.length - 1]
  return ultimoProcesso.dataTerminoPrevista
})

// ✅ TIMELINE DINÂMICA
const timelineDates = computed(() => {
  if (!opData.value) return []
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Função auxiliar para parse seguro de datas
  const parseDate = (d) => {
    if (!d) return null
    const date = new Date(d)
    return isNaN(date.getTime()) ? null : date
  }

  // Determinar início: prioritariamente Data da OP ou Pedido
  const datesForStart = []
  
  const opStart = parseDate(dataInicioOP.value)
  if (opStart) datesForStart.push(opStart)
  
  const opPedido = parseDate(opData.value.dataPedido)
  if (opPedido) datesForStart.push(opPedido)
  
  datesForStart.push(today)
  
  processos.value.forEach(p => {
    const pStartPrev = parseDate(p.dataInicioPrevista)
    if (pStartPrev) datesForStart.push(pStartPrev)
    
    const pStartReal = parseDate(p.dataInicio)
    if (pStartReal) datesForStart.push(pStartReal)
  })
  
  const validStarts = datesForStart.filter(d => d !== null)
  const startDate = new Date(Math.min(...validStarts))
  startDate.setDate(startDate.getDate() - paddingInicio.value)
  startDate.setHours(0, 0, 0, 0)
  
  // Determinar fim: o que for mais tarde + 30 dias de padding
  const datesForEnd = [today]
  
  const opEndPrev = parseDate(dataTerminoPrevista.value)
  if (opEndPrev) datesForEnd.push(opEndPrev)
  
  const opEntrega = parseDate(opData.value.dataEntrega)
  if (opEntrega) datesForEnd.push(opEntrega)
  
  processos.value.forEach(p => {
    const pEndPrev = parseDate(p.dataTerminoPrevista)
    if (pEndPrev) datesForEnd.push(pEndPrev)
    
    const pEndReal = parseDate(p.dataFim)
    if (pEndReal) datesForEnd.push(pEndReal)
  })
  
  const validEnds = datesForEnd.filter(d => d !== null)
  const endDate = new Date(Math.max(...validEnds))
  endDate.setDate(endDate.getDate() + paddingFim.value)
  endDate.setHours(0, 0, 0, 0)
  
  const dates = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6
    const dateString = current.toISOString().split('T')[0]
    
    dates.push({
      dateString,
      day: current.getDate(),
      weekday: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][current.getDay()],
      month: current.getMonth(),
      monthLabel: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][current.getMonth()],
      year: current.getFullYear(),
      isWeekend,
      isToday: current.getTime() === today.getTime(),
      date: new Date(current)
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  console.log('📅 Timeline Range:', {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    days: dates.length
  })

  return dates
})

const entregaPosition = computed(() => {
  if (!timelineDates.value.length || !opData.value?.dataEntrega) return -1
  const entregaDate = new Date(opData.value.dataEntrega)
  entregaDate.setHours(0, 0, 0, 0)
  
  const index = timelineDates.value.findIndex(d => d.date.getTime() === entregaDate.getTime())
  
  if (index >= 0) return index * celulaLargura.value
  
  const timelineStart = timelineDates.value[0].date.getTime()
  const diffDays = Math.floor((entregaDate.getTime() - timelineStart) / (1000 * 60 * 60 * 24))
  return diffDays * celulaLargura.value
})

const monthGroups = computed(() => {
  const groups = []
  if (!timelineDates.value.length) return groups
  
  let currentGroup = {
    id: `${timelineDates.value[0].month}-${timelineDates.value[0].year}`,
    label: `${timelineDates.value[0].monthLabel}/${timelineDates.value[0].year}`,
    days: 0
  }
  
  timelineDates.value.forEach(date => {
    const groupId = `${date.month}-${date.year}`
    if (groupId !== currentGroup.id) {
      groups.push(currentGroup)
      currentGroup = {
        id: groupId,
        label: `${date.monthLabel}/${date.year}`,
        days: 1
      }
    } else {
      currentGroup.days++
    }
  })
  groups.push(currentGroup)
  return groups
})

const todayPosition = computed(() => {
  if (!timelineDates.value.length) return -1
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const index = timelineDates.value.findIndex(d => d.date.getTime() === today.getTime())
  return index >= 0 ? index * celulaLargura.value : -1
})

const processosAtrasados = computed(() => {
  const today = new Date()
  return processos.value.filter(p => {
    if (!p.dataTerminoPrevista || p.status === 'CONCLUIDO') return false
    const dataTermino = new Date(p.dataTerminoPrevista)
    return dataTermino < today && p.status !== 'CONCLUIDO'
  })
})

const processosHoje = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return processos.value.filter(p => {
    if (p.status === 'CONCLUIDO') return false
    const inicioPrevisto = p.dataInicioPrevista
    const terminoPrevisto = p.dataTerminoPrevista
    
    return (inicioPrevisto && inicioPrevisto === today) || 
           (terminoPrevisto && terminoPrevisto === today)
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
    
    console.log('🔍 Debug Processos:', processos.value.map(p => ({
      nome: p.nome,
      previsto: !!p.dataInicioPrevista,
      real: !!p.dataInicio,
      status: p.status
    })))

    // ✅ DEFINIR DATA DE INÍCIO DA OP
    // Priorizamos Data de Início Real -> Data do Pedido (Compra) -> Hoje
    dataInicioOP.value = opData.value?.dataInicio || opData.value?.dataPedido || new Date().toISOString().split('T')[0]
    
    console.log('✅ Dados carregados:', {
      op: opData.value?.numeroOP,
      processos: processos.value.length,
      timelineDias: timelineDates.value.length,
      hojePosicao: todayPosition.value + '%'
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
  navigateTo(`/ops/${route.params.id}/processos`)
}

const abrirProcessosHoje = () => {
  navigateTo(`/ops/${route.params.id}/processos`)
}

// ✅ MÉTODO DE POSICIONAMENTO EM PIXELS
const getGanttBarStyle = (dataInicio, dataFim) => {
  if (!dataInicio || !timelineDates.value.length) return { display: 'none' }
  
  const start = new Date(dataInicio)
  start.setHours(0, 0, 0, 0)
  const end = dataFim ? new Date(dataFim) : new Date()
  end.setHours(0, 0, 0, 0)
  
  const timelineStart = timelineDates.value[0].date
  const timelineEnd = timelineDates.value[timelineDates.value.length - 1].date
  
  // Se estiver fora do intervalo visível, ocultar ou cortar
  if (end < timelineStart || start > timelineEnd) {
    return { display: 'none' }
  }

  // Ajustar início/fim se extrapolarem a timeline
  const effectiveStart = start < timelineStart ? timelineStart : start
  const effectiveEnd = end > timelineEnd ? timelineEnd : end
  
  const diffStart = Math.floor((effectiveStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  const duration = Math.max(1, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  
  return {
    left: `${diffStart * celulaLargura.value}px`,
    width: `${duration * celulaLargura.value}px`
  }
}

// ✅ ANÁLISE DE ATRASO
const isProcessoAtrasado = (processo) => {
  if (!processo.dataTerminoPrevista) return false
  
  const previsto = new Date(processo.dataTerminoPrevista)
  previsto.setHours(0, 0, 0, 0)
  
  if (processo.status === 'CONCLUIDO') {
    if (!processo.dataFim) return false
    const real = new Date(processo.dataFim)
    real.setHours(0, 0, 0, 0)
    return real > previsto
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today > previsto
  }
}

const getActualBarClass = (processo) => {
  if (isProcessoAtrasado(processo)) return 'status-delayed'
  
  const statusMap = {
    'CONCLUIDO': 'status-concluido-ontime',
    'EM_ANDAMENTO': 'status-em_andamento-ontime',
    'AGUARDANDO': 'status-waiting',
    'PAUSADO': 'status-waiting'
  }
  
  return statusMap[processo.status] || `status-${processo.status.toLowerCase()}`
}

// ✅ NOVO: Calcular duração do processo
const getDuracaoProcesso = (processo) => {
  if (!processo.dataInicioPrevista || !processo.dataTerminoPrevista) {
    return processo.prazoEstimado || 0
  }
  
  const start = new Date(processo.dataInicioPrevista)
  const end = new Date(processo.dataTerminoPrevista)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 1
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
  try {
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

const formatDay = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).getDate()
  } catch {
    return ''
  }
}

const imprimirGantt = () => {
  window.print()
}

const ajustarATela = () => {
  if (!timelineDates.value.length) return
  const containerWidth = window.innerWidth * 0.9 // 90% da largura da tela
  const totalDays = timelineDates.value.length
  const suggestedWidth = Math.floor((containerWidth - taskHeaderWidth.value) / totalDays)
  celulaLargura.value = Math.max(15, Math.min(suggestedWidth, 100))
}

const abrirImpressao = () => {
  // Pegar o conteúdo da área de impressão
  const printElement = document.querySelector('.print-content')
  if (!printElement) return
  
  const printContent = printElement.innerHTML
  const winPrint = window.open('', '', 'left=0,top=0,width=1280,height=900,toolbar=0,scrollbars=1,status=0')
  
  // Calcular escala para caber no A4 Paisagem (aprox 1100px para margens seguras)
  const totalWidth = taskHeaderWidth.value + (timelineDates.value.length * celulaLargura.value)
  const a4Width = 1100
  const scale = totalWidth > a4Width ? (a4Width / totalWidth).toFixed(3) : 1

  winPrint.document.write(`
    <html>
      <head>
        <title>CRONOGRAMA - OP ${opData.value?.numeroOP}</title>
        <link href="https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css" rel="stylesheet">
        <style>
          @page { size: landscape; margin: 0.5cm; }
          
          /* Forçar cores e box-sizing para evitar deslocamentos */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            box-sizing: border-box !important;
          }
          
          body { 
            font-family: 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 10px; 
            background: white; 
          }
          
          .print-content { 
            transform-origin: top left;
            transform: scale(${scale});
            width: ${totalWidth}px;
            position: relative;
          }

          .no-print { display: none !important; }
          
          /* Cabeçalho de Impressão */
          .print-only-header { 
            display: block !important; 
            margin-bottom: 25px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            width: 100%;
          }
          
          .gantt-scroll-container { width: 100%; border: 1px solid #ddd; overflow: visible !important; }
          .gantt-container { width: 100%; position: relative; background: #fff; }
          
          /* Header do Gantt */
          .gantt-header { display: flex; background: #eee !important; border-bottom: 2px solid #999; }
          .gantt-task-header { 
            width: ${taskHeaderWidth.value}px !important; 
            min-width: ${taskHeaderWidth.value}px !important;
            padding: 12px; 
            font-weight: bold; 
            background: #e0e0e0 !important; 
            border-right: 2px solid #999; 
          }
          
          .gantt-timeline-header { flex: 1; overflow: hidden; }
          .gantt-months-row { display: flex; height: 32px; border-bottom: 1px solid #999; }
          .gantt-month-label { 
            flex-shrink: 0; 
            padding: 6px; 
            font-size: 12px; 
            font-weight: bold; 
            border-right: 1px solid #999; 
            background: #e1f5fe !important; 
            text-align: center; 
          }
          
          .gantt-days-row { display: flex; }
          .gantt-date-cell { 
            width: ${celulaLargura.value}px !important;
            min-width: ${celulaLargura.value}px !important;
            padding: 4px 0; 
            text-align: center; 
            border-right: 1px solid #ccc; 
            height: 42px; 
            flex-shrink: 0; 
          }
          .gantt-date-cell.weekend { background-color: #f0f0f0 !important; }
          .gantt-date { font-size: 11px; font-weight: bold; }
          .gantt-weekday { font-size: 9px; color: #555; }

          /* Corpo do Gantt */
          .gantt-body { position: relative; }
          .gantt-row { display: flex; border-bottom: 1px solid #ccc; min-height: 85px; position: relative; }
          
          .gantt-task-cell { 
            width: ${taskHeaderWidth.value}px !important;
            min-width: ${taskHeaderWidth.value}px !important;
            padding: 12px; 
            border-right: 2px solid #999; 
            background: #fff !important; 
            display: flex; 
            align-items: center; 
            font-size: 12px;
          }
          
          .gantt-timeline-cell { flex: 1; position: relative; background: #fff !important; }
          
          /* Gradias */
          .gantt-grid { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; z-index: 1; }
          .grid-line { 
            width: ${celulaLargura.value}px !important;
            min-width: ${celulaLargura.value}px !important;
            border-right: 1px solid #f1f1f1; 
            height: 100%; 
            flex-shrink: 0; 
          }
          
          /* Barras */
          .gantt-bar { position: absolute; border-radius: 6px; font-size: 10px; display: flex; align-items: center; white-space: nowrap; box-sizing: border-box; z-index: 5; }
          
          .gantt-bar.planned { 
            top: 12px; 
            height: 24px; 
            background: #f3e5f5 !important; 
            border: 1.5px solid #9c27b0 !important; 
            color: #7b1fa2 !important; 
          }
          
          .gantt-bar.actual { 
            top: 44px; 
            height: 30px; 
            z-index: 6; 
            border-width: 1.5px; 
            border-style: solid; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.2); 
          }
          
          .bar-label { position: absolute; left: 100%; margin-left: 10px; font-weight: bold; font-size: 11px; }

          /* Status das barras (para garantir cores no PDF) */
          .status-delayed { background: #f44336 !important; border-color: #b71c1c !important; color: white !important; }
          .status-concluido-ontime { background: #4caf50 !important; border-color: #1b5e20 !important; color: white !important; }
          .status-em_andamento-ontime { background: #2196f3 !important; border-color: #0d47a1 !important; color: white !important; }
          .status-waiting { background: #ff9800 !important; border-color: #e65100 !important; color: white !important; }
          
          /* Cores de texto das labels exteriores */
          .status-delayed .bar-label { color: #b71c1c !important; }
          .status-concluido-ontime .bar-label { color: #1b5e20 !important; }
          .status-em_andamento-ontime .bar-label { color: #0d47a1 !important; }
          .status-waiting .bar-label { color: #e65100 !important; }

          .gantt-progress { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,255,255,0.2) !important; }

          /* Marcos Verticais (Garantir cores e posicionamento) */
          .gantt-today-line { 
            position: absolute; 
            top: 0; 
            bottom: 0; 
            width: 2px !important; 
            background-color: #f44336 !important; 
            border-left: 2px solid #f44336 !important;
            z-index: 10; 
          }
          .today-marker { 
            position: absolute; 
            top: -28px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: #f44336 !important; 
            color: white !important; 
            padding: 3px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: bold; 
          }
          
          .gantt-delivery-line { 
            position: absolute; 
            top: 0; 
            bottom: 0; 
            width: 2px !important; 
            background-color: #2e7d32 !important; 
            border-left: 2px solid #2e7d32 !important;
            z-index: 9; 
          }
          .delivery-marker { 
            position: absolute; 
            top: -28px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: #2e7d32 !important; 
            color: white !important; 
            padding: 3px 10px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: bold; 
            display: flex;
            align-items: center;
          }

          /* Textos Informativos */
          h1 { margin: 0; font-size: 26px; color: #000; }
          .text-h6 { color: #000; font-size: 18px; margin-top: 6px; }
          .text-subtitle-1 { font-size: 15px; margin-top: 5px; }
          .text-caption { font-size: 13px; color: #333; }
          .d-flex { display: flex; }
          .justify-space-between { justify-content: space-between; }
          .align-center { align-items: center; }
          .mb-4 { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="print-content">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // window.close(); // Opcional
            }, 1000);
          };
        <\/script>
      </body>
    </html>
  `)
  winPrint.document.close()
  winPrint.focus()
}

// Lifecycle
onMounted(() => {
  console.log('📊 DASHBOARD GANTT - OP:', route.params.id)
  carregarDadosGantt()
})
</script>

<style scoped>
/* Container com scroll horizontal */
.gantt-scroll-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  margin-bottom: 20px;
  padding-top: 30px; /* Espaço para as bandeiras não serem cortadas */
}

/* Container do Gantt */
.gantt-container {
  min-width: 2000px; /* Largura mínima para 1 ano */
  position: relative;
}

/* Header do Gantt */
/* Cabeçalho do Gantt */
.gantt-header {
  display: flex;
  flex-direction: row;
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 20;
}

.gantt-task-header {
  width: 300px;
  min-width: 300px;
  padding: 12px 16px;
  font-weight: 600;
  background: #e9ecef;
  border-right: 2px solid #dee2e6;
  display: flex;
  align-items: flex-end; /* Alinha com a linha dos dias */
}

.gantt-timeline-header {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.gantt-months-row {
  display: flex;
  height: 30px;
  border-bottom: 1px solid #dee2e6;
}

.gantt-month-label {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #1976d2;
  border-right: 1px solid #dee2e6;
  background: #f0f7ff;
  white-space: nowrap;
}

.gantt-days-row {
  display: flex;
}

/* Células de data */
.gantt-date-cell {
  width: 40px;
  min-width: 40px;
  padding: 4px 0;
  text-align: center;
  border-right: 1px solid #dee2e6;
  height: 40px;
  box-sizing: border-box;
}

.gantt-date-cell.weekend {
  background: #fdf2f2;
}

.gantt-date-cell.today {
  background: #ffecb3;
  font-weight: bold;
}

/* Body do Gantt */
.gantt-row {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  min-height: 80px; /* Mais alto para caber duas barras */
}

.gantt-task-cell {
  width: 300px;
  min-width: 300px;
  padding: 10px 16px;
  border-right: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  background: white;
}

.gantt-timeline-cell {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Grade de fundo */
.gantt-grid {
  display: flex;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.grid-line {
  width: 40px;
  min-width: 40px;
  border-right: 1px solid #f1f1f1;
  height: 100%;
}

.grid-line:nth-child(even) {
  background-color: #fafafa;
}

/* Barra do Gantt */
.gantt-bar {
  position: absolute;
  height: 24px;
  border-radius: 4px;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 10px;
  color: white;
  white-space: nowrap;
  transition: all 0.3s;
}

.gantt-bar.planned {
  top: 10px;
  background: #cc8dd6; /* Roxo bem claro */
  border: 1.5px solid #aa16c4; /* Roxo médio */
  color: #6f049c; /* Roxo escuro para o texto se necessário */
  height: 22px;
  opacity: 0.9;
  z-index: 1;
}

.gantt-bar.actual {
  top: 36px;
  height: 28px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Cores por Status e Atraso */
.status-delayed {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

.status-concluido-ontime {
  background: linear-gradient(135deg, #4caf50, #388e3c);
}

.status-em_andamento-ontime {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.status-waiting {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.delay-tag {
  font-weight: bold;
  margin-left: 4px;
}

.bar-label {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  pointer-events: none;
  font-size: 10px;
  white-space: nowrap;
}

.planned .bar-label,
.actual .bar-label.exterior {
  text-shadow: none;
  left: 100%;
  margin-left: 8px;
}

.planned .bar-label {
  color: #a41abd; /* Roxo para o label previsto */
}

/* Cores dos labels conforme o status para a barra real */
.status-delayed .bar-label.exterior { color: #f44336; }
.status-concluido-ontime .bar-label.exterior { color: #4caf50; }
.status-em_andamento-ontime .bar-label.exterior { color: #2196f3; }
.status-waiting .bar-label.exterior { color: #ff9800; }

.gantt-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

/* Linha do Tempo Atual */
.gantt-today-line {
  position: absolute;
  top: 60px; /* Começa após o header */
  bottom: 0;
  width: 2px;
  background-color: #f44336;
  z-index: 10;
  pointer-events: none;
}

.today-marker {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: #f44336;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  z-index: 30; /* Acima do header */
}

.gantt-delivery-line {
  position: absolute;
  top: 60px;
  bottom: 0;
  width: 2px;
  background-color: #2e7d32; /* Verde para entrega */
  border-left: 1px dashed #fff;
  z-index: 9;
  pointer-events: none;
}

.delivery-marker {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: #2e7d32;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  z-index: 30; /* Acima do header */
}

/* Estilos para Impressão */
@media print {
  /* Esconder tudo que não estiver dentro de .print-content */
  body * {
    visibility: hidden !important;
  }

  .print-content, .print-content * {
    visibility: visible !important;
  }

  /* Posicionar o conteúdo de impressão no topo esquerdo */
  .print-content {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: visible !important;
  }

  /* Resetar o fundo e remover bordas de containers pais */
  body, html, .v-application, .v-application--wrap, .v-main, .v-container, .v-card {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: auto !important;
  }

  /* Forçar o scroll container a mostrar tudo */
  .gantt-scroll-container {
    overflow: visible !important;
    display: block !important;
    width: 100% !important;
    padding-top: 60px !important; /* Espaço para bandeiras */
  }

  .gantt-container {
    width: max-content !important; /* Manter a largura real do gráfico */
    display: block !important;
    /* Ajuste de escala para tentar caber no A4 paisagem se for muito grande */
    transform-origin: top left;
    zoom: 85%; /* Ajuste fino de escala base */
  }

  /* Configuração de página Horizontal */
  @page {
    size: landscape;
    margin: 1cm;
  }

  /* Mostrar o cabeçalho de impressão apenas no papel */
  .print-only-header {
    display: block !important;
    width: 100% !important;
    margin-bottom: 20px !important;
  }
}

/* Esconder cabeçalho de impressão na tela normal */
.print-only-header {
  display: none;
}

/* Estilos auxiliares */
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

/* Scrollbar personalizada */
.gantt-scroll-container::-webkit-scrollbar {
  height: 10px;
}

.gantt-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.gantt-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

.gantt-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>