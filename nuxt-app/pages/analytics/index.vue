<template>
  <div class="w-100 pa-4">
    <PageHeader 
      title="Inteligência Analítica (IA)" 
      subtitle="Predição de Prazos e Análise de Carga de Trabalho usando Algoritmos de Caminho Crítico"
      icon="mdi-brain"
    />

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="prazos">
        <v-icon start>mdi-clock-alert</v-icon>
        Predição de Prazos (OPs)
      </v-tab>
      <v-tab value="workload">
        <v-icon start>mdi-account-hard-hat</v-icon>
        Previsão de Carga (Equipe)
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- ABA 1: PREDIÇÃO DE PRAZOS (OPS) -->
      <v-window-item value="prazos">
        <v-card variant="outlined">
          <v-card-title class="bg-blue-lighten-5 d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-robot-outline</v-icon>
            Visão Geral de Prazos e Gargalos
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" variant="text" @click="fetchDeliveryPrediction" :loading="loadingPrazos"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          
          <v-card-text v-if="loadingPrazos" class="text-center py-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2 text-grey">Calculando caminho crítico de todas as OPs...</div>
          </v-card-text>

          <v-card-text v-else class="pa-4 bg-grey-lighten-4">
            <v-row class="mb-4 align-center">
              <v-col cols="12" md="6" lg="5">
                <v-card variant="outlined" class="pa-4 bg-white rounded-lg elevation-1" v-if="predicoes.length > 0">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex flex-column">
                      <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-2">Resumo de Entregas</div>
                      <div class="d-flex align-center mb-1">
                        <div class="legend-box bg-success mr-2"></div>
                        <span class="text-caption font-weight-medium">Em dia / Folga ({{ getRiscoCount('VERDE') }}) - {{ getRiscoPerc('VERDE') }}%</span>
                      </div>
                      <div class="d-flex align-center mb-1">
                        <div class="legend-box bg-orange-darken-3 mr-2"></div>
                        <span class="text-caption font-weight-medium">Atraso Tolerável ({{ getRiscoCount('AMARELO') }}) - {{ getRiscoPerc('AMARELO') }}%</span>
                      </div>
                      <div class="d-flex align-center">
                        <div class="legend-box bg-red-darken-4 mr-2"></div>
                        <span class="text-caption font-weight-medium">Atraso Crítico ({{ getRiscoCount('VERMELHO') }}) - {{ getRiscoPerc('VERMELHO') }}%</span>
                      </div>
                    </div>
                    <div class="pie-chart shadow-sm" :style="pieChartStyle"></div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6" lg="7" class="d-flex justify-end">
                <v-text-field
                  v-model="searchPrazos"
                  prepend-inner-icon="mdi-magnify"
                  label="Buscar OP ou Equipamento..."
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="max-w-md bg-white"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row v-if="predicoesFiltro.length > 0" dense class="mt-2">
              <v-col v-for="item in predicoesFiltro" :key="item.opId" cols="12" md="6" lg="4" xl="3">
                <v-card border class="h-100 d-flex flex-column elevation-2">
                  <v-card-item class="pb-1 bg-white">
                    <template v-slot:prepend>
                      <v-avatar :color="getChipColor(item.risco)" size="36" class="text-white font-weight-bold">
                        <v-icon v-if="item.risco === 'VERMELHO'">mdi-alert-octagon</v-icon>
                        <v-icon v-else-if="item.risco === 'AMARELO'">mdi-alert</v-icon>
                        <v-icon v-else>mdi-check-all</v-icon>
                      </v-avatar>
                    </template>
                    <v-card-title class="text-subtitle-1 font-weight-bold text-primary">
                      OP {{ item.numeroOP }}
                    </v-card-title>
                    <v-card-subtitle class="text-caption font-weight-bold">
                      {{ item.maquina }}
                    </v-card-subtitle>
                    <div class="text-caption text-grey">{{ item.cliente }}</div>
                  </v-card-item>

                  <v-card-text class="pt-2 flex-grow-1 d-flex flex-column">
                    <!-- Informações de Margem -->
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-medium">Progresso: {{ item.progresso }}%</span>
                      <div v-if="item.diasDeMargem < -21" class="text-red-darken-3 text-caption font-weight-bold d-flex align-center">
                        <v-icon size="x-small" class="mr-1">mdi-alert-octagon</v-icon> Atraso: {{ Math.abs(item.diasDeMargem) }}d
                      </div>
                      <div v-else-if="item.diasDeMargem < 0" class="text-orange-darken-3 text-caption font-weight-bold d-flex align-center">
                        <v-icon size="x-small" class="mr-1">mdi-alert</v-icon> Atraso: {{ Math.abs(item.diasDeMargem) }}d
                      </div>
                      <div v-else class="text-success text-caption font-weight-bold">
                        Folga: {{ item.diasDeMargem }}d
                      </div>
                    </div>

                    <div class="d-flex justify-space-between text-caption mb-2 px-1 bg-blue-grey-lighten-5 rounded pa-1">
                      <div>
                        <span class="text-grey-darken-1">Prometido: </span>
                        <span class="font-weight-bold">{{ formatDate(item.prazoPrometido) }}</span>
                      </div>
                      <div class="text-right">
                        <span class="text-grey-darken-1">Previsão: </span>
                        <span class="font-weight-bold" :class="item.risco === 'VERMELHO' ? 'text-red-darken-3' : ''">
                          {{ formatDate(item.prazoCalculado) }}
                        </span>
                      </div>
                    </div>

                    <!-- Mini Curva S -->
                    <div class="bg-grey-lighten-4 rounded pa-2 mb-2 border" style="height: 160px; position: relative;">
                      <div v-if="item.chartData" class="h-100 w-100">
                        <ClientOnly>
                          <Line :data="item.chartData" :options="miniChartOptions" />
                        </ClientOnly>
                      </div>
                      <div v-else class="h-100 w-100 d-flex align-center justify-center text-caption text-grey">
                        Sem dados
                      </div>
                    </div>

                    <v-divider class="mb-2"></v-divider>

                    <!-- Gargalos Compactos -->
                    <div class="text-caption font-weight-bold mb-1 text-grey-darken-1">Gargalos Identificados:</div>
                    <div v-if="!item.gargalos || item.gargalos.length === 0" class="text-success text-caption d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-check-circle</v-icon> Nenhum
                    </div>
                    <div v-else>
                      <div class="d-flex align-start text-caption" style="line-height: 1.2;">
                        <v-icon size="x-small" color="error" class="mr-1 mt-1 flex-shrink-0">mdi-alert-circle-outline</v-icon>
                        <span class="text-truncate" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; white-space: normal;">
                          {{ item.gargalos[0] }}
                        </span>
                      </div>
                      <div v-if="item.gargalos.length > 1" class="mt-1">
                        <v-menu location="top" :close-on-content-click="false">
                          <template v-slot:activator="{ props }">
                            <v-chip v-bind="props" size="x-small" color="error" variant="tonal" class="font-weight-bold cursor-pointer">
                              + {{ item.gargalos.length - 1 }} (Ver)
                            </v-chip>
                          </template>
                          <v-card min-width="250" max-width="350" class="pa-2 border" elevation="4">
                            <v-card-title class="text-caption font-weight-bold text-error">Gargalos OP {{ item.numeroOP }}</v-card-title>
                            <v-divider></v-divider>
                            <v-list density="compact" class="pa-0" style="max-height: 200px; overflow-y: auto;">
                              <v-list-item v-for="(g, i) in item.gargalos" :key="i" class="min-h-0 py-1">
                                <v-list-item-title class="text-caption text-grey-darken-3" style="white-space: normal; line-height: 1.2;">
                                  • {{ g }}
                                </v-list-item-title>
                              </v-list-item>
                            </v-list>
                          </v-card>
                        </v-menu>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <div v-else class="text-center py-10 text-grey">
              Nenhuma predição encontrada com os filtros atuais.
            </div>

            <!-- DIALOG CURVA S -->
            <v-dialog v-model="showChartDialog" max-width="900">
              <v-card>
                <v-card-title class="bg-blue-grey-darken-3 text-white d-flex align-center">
                  <v-icon class="mr-2">mdi-chart-bell-curve-cumulative</v-icon>
                  Curva S - OP {{ selectedOpName }}
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-close" variant="text" @click="showChartDialog = false" color="white"></v-btn>
                </v-card-title>
                <v-card-text class="pa-4 bg-grey-lighten-4">
                  <div v-if="loadingChart" class="text-center py-10">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <div class="mt-2 text-grey">Calculando timeline do projeto...</div>
                  </div>
                  <div v-else-if="!chartData" class="text-center py-10 text-grey">
                    Nenhum dado encontrado para gerar o gráfico.
                  </div>
                  <div v-else style="height: 450px; width: 100%;" class="bg-white pa-4 border rounded shadow-sm">
                    <ClientOnly>
                      <Line :data="chartData" :options="chartOptions" />
                    </ClientOnly>
                  </div>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ABA 2: PREVISÃO DE CARGA DA EQUIPE -->
      <v-window-item value="workload">
        <v-card variant="outlined">
          <v-card-title class="bg-orange-lighten-5 d-flex align-center">
            <v-icon color="orange-darken-3" class="mr-2">mdi-chart-bar</v-icon>
            Estimativa de Disponibilidade da Equipe
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" variant="text" @click="fetchWorkloadAi" :loading="loadingWorkload"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          
          <v-card-text v-if="loadingWorkload" class="text-center py-10">
            <v-progress-circular indeterminate color="orange"></v-progress-circular>
            <div class="mt-2 text-grey">Calculando disponibilidade dos usuários...</div>
          </v-card-text>

          <v-card-text v-else class="pa-4 bg-grey-lighten-4">
            <v-row>
              <v-col v-for="user in workload" :key="user.userId" cols="12" md="6" lg="4" xl="3">
                <v-card border class="h-100 d-flex flex-column">
                  <v-card-item class="pb-2 bg-white">
                    <template v-slot:prepend>
                      <v-avatar color="blue-grey-lighten-4" size="40">
                        <v-icon color="blue-grey-darken-3">mdi-account</v-icon>
                      </v-avatar>
                    </template>
                    <v-card-title class="text-subtitle-1 font-weight-bold">{{ user.userName }}</v-card-title>
                    <v-card-subtitle>{{ user.department }}</v-card-subtitle>
                  </v-card-item>

                  <v-card-text class="pt-3 flex-grow-1">
                    <!-- Status Chips -->
                    <div class="d-flex align-center justify-space-between mb-4">
                      <v-chip size="small" :color="getWorkloadColor(user.statusCarga)" variant="flat" class="font-weight-bold text-white text-uppercase">
                        {{ user.statusCarga }}
                      </v-chip>
                      <v-chip v-if="user.statusAtraso" size="x-small" :color="getDelayColor(user.statusAtraso)" variant="tonal" class="font-weight-bold text-uppercase" :class="{ 'pulse-alert': user.statusAtraso === 'Atraso Crítico' }">
                        <v-icon start size="x-small">mdi-alert</v-icon>
                        {{ user.statusAtraso }}
                      </v-chip>
                    </div>

                    <!-- Pizza Chart & Breakdown -->
                    <div class="d-flex align-center mb-4 bg-white pa-2 rounded border">
                      <div class="pie-chart shadow-sm mr-4" :style="getUserPieChartStyle(user)" style="width: 65px; height: 65px;"></div>
                      <div class="d-flex flex-column flex-grow-1">
                        <div class="d-flex justify-space-between align-center mb-1">
                          <div class="d-flex align-center">
                            <div class="legend-box mr-2 bg-light-blue-darken-2"></div>
                            <span class="text-caption font-weight-medium text-grey-darken-2" style="line-height:1">Em Andamento</span>
                          </div>
                          <span class="text-caption font-weight-bold">{{ user.pieEmAndamento }}</span>
                        </div>
                        <div class="d-flex justify-space-between align-center mb-1">
                          <div class="d-flex align-center">
                            <div class="legend-box bg-grey-lighten-1 mr-2"></div>
                            <span class="text-caption font-weight-medium text-grey-darken-2" style="line-height:1">Não Iniciado</span>
                          </div>
                          <span class="text-caption font-weight-bold">{{ user.pieNaoIniciadas }}</span>
                        </div>
                        <div class="d-flex justify-space-between align-center">
                          <div class="d-flex align-center">
                            <div class="legend-box bg-red-darken-3 mr-2"></div>
                            <span class="text-caption font-weight-medium text-grey-darken-2" style="line-height:1">Atrasadas</span>
                          </div>
                          <span class="text-caption font-weight-bold text-red-darken-3">{{ user.pieAtrasadas }}</span>
                        </div>
                      </div>
                    </div>

                    <v-divider class="mb-3"></v-divider>

                    <div class="d-flex justify-space-between text-caption mb-1">
                      <span class="text-grey-darken-1">Total de Tarefas Ativas:</span>
                      <span class="font-weight-bold">{{ user.totalTarefasPendentes }}</span>
                    </div>
                    <div class="d-flex justify-space-between text-caption mb-4">
                      <span class="text-grey-darken-1">Dias Acumulados (Carga):</span>
                      <span class="font-weight-bold text-orange-darken-3">{{ user.totalDiasAcumulados }} dias</span>
                    </div>

                    <v-alert density="compact" :type="user.statusCarga === 'LIVRE' ? 'success' : 'info'" variant="tonal" class="text-caption ma-0">
                      <div class="font-weight-bold">Livre para demandas a partir de:</div>
                      <div>{{ formatDate(user.dataEstimadaLivre) }}</div>
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const { authHeaders } = useAuth()
const tab = ref('prazos')

const loadingPrazos = ref(false)
const predicoes = ref([])
const searchPrazos = ref('')

const predicoesFiltro = computed(() => {
  if (!searchPrazos.value) return predicoes.value
  const s = searchPrazos.value.toLowerCase()
  return predicoes.value.filter(p => 
    (p.numeroOP && p.numeroOP.toLowerCase().includes(s)) || 
    (p.maquina && p.maquina.toLowerCase().includes(s)) ||
    (p.cliente && p.cliente.toLowerCase().includes(s))
  )
})

const prazosHeaders = [
  { title: 'OP', key: 'numeroOP', sortable: true, width: '100px' },
  { title: 'Equipamento / Cliente', key: 'maquina', sortable: true },
  { title: 'Status (Risco)', key: 'risco', sortable: true, align: 'center' },
  { title: 'Margem', key: 'diasDeMargem', sortable: true, align: 'center' },
  { title: 'Prazo Prometido', key: 'prazoPrometido', sortable: true, align: 'center' },
  { title: 'Prazo Calculado', key: 'prazoCalculado', sortable: true, align: 'center' },
  { title: 'Gargalos Identificados (IA)', key: 'gargalos', sortable: false, width: '320px' }
]

const getRiscoCount = (risco) => {
  return predicoes.value.filter(p => p.risco === risco).length
}

const getRiscoPerc = (risco) => {
  if (predicoes.value.length === 0) return 0
  const count = getRiscoCount(risco)
  return Math.round((count / predicoes.value.length) * 100)
}

const pieChartStyle = computed(() => {
  if (predicoes.value.length === 0) return { background: '#e0e0e0' }
  const pVerde = getRiscoPerc('VERDE')
  const pAmarelo = getRiscoPerc('AMARELO')
  // const pVermelho = getRiscoPerc('VERMELHO') // the rest

  return {
    background: `conic-gradient(
      #4caf50 0% ${pVerde}%, 
      #ef6c00 ${pVerde}% ${pVerde + pAmarelo}%, 
      #b71c1c ${pVerde + pAmarelo}% 100%
    )`
  }
})

// --- CHART S-CURVE MINI OPTIONS ---
const miniChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { display: false },
      grid: { display: false }
    },
    x: {
      ticks: {
        maxTicksLimit: 4,
        font: { size: 9 }
      },
      grid: { display: false }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false }
  }
}
// -----------------------------------

const loadingWorkload = ref(false)
const workload = ref([])

const getUserPieChartStyle = (user) => {
  if (user.totalTarefasPendentes === 0) return { background: '#e0e0e0' }
  const total = user.totalTarefasPendentes
  const pEmAndamento = (user.pieEmAndamento / total) * 100
  const pNaoIniciadas = (user.pieNaoIniciadas / total) * 100
  // const pAtrasadas = (user.pieAtrasadas / total) * 100

  return {
    background: `conic-gradient(
      #0288D1 0% ${pEmAndamento}%, 
      #BDBDBD ${pEmAndamento}% ${pEmAndamento + pNaoIniciadas}%, 
      #c62828 ${pEmAndamento + pNaoIniciadas}% 100%
    )`
  }
}

const fetchDeliveryPrediction = async () => {
  loadingPrazos.value = true
  try {
    const res = await $fetch('/api/analytics/delivery-prediction', { headers: authHeaders.value })
    if (res.success) {
      predicoes.value = res.data
    }
  } catch (e) {
    console.error("Erro ao buscar predições:", e)
  } finally {
    loadingPrazos.value = false
  }
}

const fetchWorkloadAi = async () => {
  loadingWorkload.value = true
  try {
    const res = await $fetch('/api/analytics/workload-ai', { headers: authHeaders.value })
    if (res.success) {
      workload.value = res.data
    }
  } catch (e) {
    console.error("Erro ao buscar workload AI:", e)
  } finally {
    loadingWorkload.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

const getCardColor = (risco) => {
  if (risco === 'VERMELHO') return 'red-lighten-5'
  if (risco === 'AMARELO') return 'orange-lighten-5'
  return 'white'
}

const getChipColor = (risco) => {
  if (risco === 'VERMELHO') return 'error'
  if (risco === 'AMARELO') return 'warning'
  return 'success'
}

const getWorkloadColor = (status) => {
  if (status === 'SOBRECARREGADO') return 'error'
  if (status === 'MODERADO') return 'warning'
  if (status === 'LEVE') return 'info'
  return 'success'
}

const getDelayColor = (status) => {
  if (status === 'Atraso Crítico') return 'red-darken-4'
  if (status === 'Muitos Atrasos') return 'deep-orange-darken-3'
  return 'orange' // Pequenos Atrasos
}

onMounted(() => {
  fetchDeliveryPrediction()
  fetchWorkloadAi()
})
</script>

<style scoped>
.pie-chart {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  box-shadow: inset 0px 0px 4px rgba(0,0,0,0.2);
}

.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.pulse-alert {
  animation: pulse-animation 1.5s infinite;
  box-shadow: 0 0 0 0 rgba(183, 28, 28, 0.7);
}

@keyframes pulse-animation {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(183, 28, 28, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(183, 28, 28, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(183, 28, 28, 0); }
}
</style>
