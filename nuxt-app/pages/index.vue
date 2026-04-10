<template>
  <div class="w-100">
    <!-- Header Compacto (Versão Standard) -->
    <PageHeader 
      title="Dashboard de Produção" 
      :subtitle="`Olá, ${userNameDisplay}! Bem-vindo ao Sistema SOMEH.`"
      icon="mdi-view-dashboard"
      show-status
    />

    <v-row class="mb-6">
      <!-- Tarefas Pessoais - Destaque -->
      <v-col cols="12" md="3">
        <v-card 
          class="stat-card pa-3 h-100" 
          color="indigo-darken-3" 
          elevation="4"
          @click="navigateTo('/tarefas')"
        >
          <v-card-text class="d-flex align-center text-white py-2">
            <div>
              <div class="text-overline mb-0">Minhas Tarefas</div>
              <div class="text-h3 font-weight-bold">{{ dashboardStats?.minhasTarefas || 0 }}</div>
              <div class="text-subtitle-2 opacity-80">Pendentes para mim</div>
            </div>
            <v-spacer />
            <v-icon size="64" class="opacity-30">mdi-account-clock</v-icon>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Stats Gerais -->
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="2">
        <v-card 
          class="stat-card pa-3 h-100" 
          :color="stat.color" 
          elevation="2"
          @click="stat.action"
        >
          <v-card-text class="py-2 px-1 text-white">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-overline">{{ stat.title }}</span>
              <v-icon size="20">{{ stat.icon }}</v-icon>
            </div>
            <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros Progressivos -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.search"
              label="Buscar por OP, Cliente, Máquina ou Código"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              @update:model-value="loadDashboardData"
            />
          </v-col>
          
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Status"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              @update:model-value="loadDashboardData"
            />
          </v-col>

          <v-col cols="12" sm="6" md="2">
            <v-menu :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="filters.dataEntrega"
                  label="Prazo de Entrega"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  prepend-inner-icon="mdi-calendar"
                  clearable
                  hide-details
                  @click:clear="filters.dataEntrega = null; loadDashboardData()"
                />
              </template>
              <v-date-picker 
                v-model="filters.dataEntrega" 
                @update:model-value="loadDashboardData" 
                hide-header
              />
            </v-menu>
          </v-col>

          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filters.sortBy"
              label="Ordenar por"
              :items="sortOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="loadDashboardData"
            />
          </v-col>

          <v-col cols="12" md="3" class="d-flex align-center gap-2">
            <v-btn-toggle v-model="filters.sortOrder" mandatory color="primary" variant="outlined" density="comfortable" @update:model-value="loadDashboardData">
              <v-btn value="asc" icon="mdi-sort-ascending" />
              <v-btn value="desc" icon="mdi-sort-descending" />
            </v-btn-toggle>
            
            <v-btn 
              variant="text" 
              color="primary" 
              icon="mdi-filter-remove" 
              title="Limpar Filtros"
              @click="clearFilters"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Conteúdo Principal -->
    <v-row>
      <!-- OPs List -->
      <v-col cols="12">
        <v-card elevation="2" rounded="lg">
          <v-card-title class="d-flex justify-space-between align-center pa-4">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-factory</v-icon>
              <span class="text-h5 font-weight-bold">Ordens de Produção</span>
            </div>
            <v-btn 
              color="primary" 
              variant="elevated"
              @click="navigateTo('/ops')" 
              prepend-icon="mdi-plus"
              elevation="2"
            >
              Nova OP
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>

          <v-card-text class="pa-0">
            <v-progress-linear 
              v-if="loading" 
              indeterminate 
              color="primary"
            ></v-progress-linear>

            <div v-if="!loading && allOps.length === 0" class="pa-10 text-center">
              <v-icon size="64" color="grey-lighten-1">mdi-clipboard-text-search-outline</v-icon>
              <div class="text-h6 text-grey-darken-1 mt-4">Nenhuma OP encontrada com estes filtros.</div>
            </div>

            <v-table v-else class="ops-table">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold">Número OP / Máquina</th>
                  <th class="text-left font-weight-bold">Cliente</th>
                  <th class="text-center font-weight-bold">Status</th>
                  <th class="text-center font-weight-bold">Entrega</th>
                  <th class="text-left font-weight-bold" style="width: 200px">Progresso</th>
                  <th class="text-center font-weight-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="op in allOps" :key="op.id" @click="viewOP(op)" class="clickable-row">
                  <td>
                    <div class="font-weight-bold text-primary">{{ op.numeroOP }}</div>
                    <div class="text-caption text-blue-darken-3 font-weight-bold">{{ op.codigoMaquina }}</div>
                    <div class="text-caption text-grey">{{ op.descricaoMaquina }}</div>
                  </td>
                  <td>{{ op.cliente }}</td>
                  <td class="text-center">
                    <v-chip 
                      :color="getStatusColor(op.status)" 
                      size="small"
                      variant="flat"
                      class="text-uppercase font-weight-bold"
                    >
                      {{ formatStatus(op.status) }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <div :class="{'text-error font-weight-bold': isAtrasada(op.dataEntrega) && op.status !== 'CONCLUIDA'}">
                      {{ formatDate(op.dataEntrega) }}
                      <v-tooltip v-if="isAtrasada(op.dataEntrega) && op.status !== 'CONCLUIDA'" activator="parent" location="top">
                        OP Atrasada!
                      </v-tooltip>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-center">
                      <v-progress-linear
                        :model-value="op.progresso || 0"
                        :color="getProgressColor(op.progresso || 0)"
                        height="10"
                        rounded
                        class="mr-2"
                      ></v-progress-linear>
                      <span class="text-caption font-weight-bold">{{ op.progresso || 0 }}%</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <v-btn icon="mdi-eye-outline" variant="text" color="primary" size="small"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'

const { userName, authHeaders } = useAuth()

const userNameDisplay = computed(() => {
  return userName.value ? userName.value.split(' ')[0] : 'Usuário'
})

// Carregar estatísticas reais
const { data: dashboardStats, refresh: refreshStats } = await useFetch('/api/dashboard/stats', {
  headers: authHeaders.value
})

const stats = computed(() => [
  { 
    title: 'Aguardando', 
    value: dashboardStats.value?.opsAbertas || 0, 
    icon: 'mdi-clock-outline', 
    color: 'grey-darken-1',
    action: () => {
      filters.value.status = 'AGUARDANDO'
      loadDashboardData()
    }
  },
  { 
    title: 'Em Produção', 
    value: dashboardStats.value?.opsProducao || 0, 
    icon: 'mdi-cog-sync', 
    color: 'blue-darken-2',
    action: () => {
      filters.value.status = 'IN_PRODUCTION'
      loadDashboardData()
    }
  },
  { 
    title: 'Atrasadas', 
    value: dashboardStats.value?.opsAtrasadas || 0, 
    icon: 'mdi-alert-decagram', 
    color: 'red-darken-1',
    action: () => {
      // Para atrasadas, limpamos o status e deixamos o usuário ver todas ou aplicamos um filtro de data se necessário
      // Por enquanto, apenas removemos filtros de status para mostrar todas
      filters.value.status = null
      filters.value.sortBy = 'dataEntrega'
      filters.value.sortOrder = 'asc'
      loadDashboardData()
    }
  },
  { 
    title: 'Concluídas', 
    value: dashboardStats.value?.opsConcluidas || 0, 
    icon: 'mdi-check-decagram', 
    color: 'green-darken-2',
    action: () => {
      filters.value.status = 'CONCLUIDA'
      loadDashboardData()
    }
  }
])

const allOps = ref([])
const loading = ref(false)

const filters = ref({
  search: '',
  status: null,
  dataEntrega: null,
  sortBy: 'dataCriacao',
  sortOrder: 'desc'
})

const statusOptions = [
  { title: 'EM PRODUÇÃO (GERAL)', value: 'IN_PRODUCTION' },
  { title: 'AGUARDANDO', value: 'AGUARDANDO' },
  { title: 'EM ENGENHARIA', value: 'EM_ENGENHARIA' },
  { title: 'EM COMPRAS', value: 'EM_COMPRAS' },
  { title: 'EM FABRICAÇÃO', value: 'EM_FABRICACAO' },
  { title: 'EM MONTAGEM', value: 'EM_MONTAGEM' },
  { title: 'CONCLUIDA', value: 'CONCLUIDA' }
]

const sortOptions = [
  { title: 'Criação', value: 'dataCriacao' },
  { title: 'OP', value: 'numeroOP' },
  { title: 'Entrega', value: 'dataEntrega' },
  { title: 'Status', value: 'status' },
  { title: 'Progresso', value: 'progresso' },
  { title: 'Cliente', value: 'cliente' }
]



// Carregar dados do dashboard
onMounted(async () => {
  await loadDashboardData()
  await refreshStats()
})

const loadDashboardData = async () => {
  loading.value = true
  try {
    const params = {
      search: filters.value.search,
      status: filters.value.status,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder
    }
    
    if (filters.value.dataEntrega) {
      params.dataInicio = filters.value.dataEntrega
      params.dataFim = filters.value.dataEntrega
    }

    allOps.value = await $fetch('/api/ops', {
      params,
      headers: authHeaders.value
    })
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
    allOps.value = []
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: null,
    dataEntrega: null,
    sortBy: 'dataCriacao',
    sortOrder: 'desc'
  }
  loadDashboardData()
}

// Utilitários
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const navigateToPage = (path) => {
  router.push(path)
}

const formatStatus = (status) => {
  const statusMap = {
    'AGUARDANDO': 'Aguardando',
    'EM_ENGENHARIA': 'Engenharia',
    'EM_COMPRAS': 'Compras',
    'EM_FABRICACAO': 'Fabricação',
    'EM_AUTOMACAO': 'Automação',
    'EM_PROJETO_ELETRICO': 'Proj. Elétrico',
    'EM_CALIBRACAO': 'Calibração',
    'EM_MONTAGEM': 'Montagem',
    'EM_TESTES': 'Testes',
    'EM_DOCUMENTACAO': 'Documentação',
    'EM_EXPEDICAO': 'Expedição',
    'AGUARDANDO_ENTREGA': 'Aguar. Entrega',
    'CANCELADA': 'Cancelada',
    'CONCLUIDA': 'Concluída'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const statusSafe = status || 'AGUARDANDO'
  const statusColors = {
    'AGUARDANDO': 'grey',
    'EM_ENGENHARIA': 'blue-lighten-1',
    'EM_COMPRAS': 'amber-darken-2',
    'EM_FABRICACAO': 'green',
    'EM_AUTOMACAO': 'indigo',
    'EM_PROJETO_ELETRICO': 'orange',
    'EM_CALIBRACAO': 'teal',
    'EM_MONTAGEM': 'purple',
    'EM_TESTES': 'cyan-darken-2',
    'EM_DOCUMENTACAO': 'brown',
    'EM_EXPEDICAO': 'deep-orange',
    'AGUARDANDO_ENTREGA': 'cyan',
    'CANCELADA': 'red',
    'CONCLUIDA': 'green-darken-3'
  }
  return statusColors[statusSafe] || 'grey'
}

const getProgressColor = (progresso) => {
  const progressoSafe = progresso || 0
  if (progressoSafe >= 80) return 'green'
  if (progressoSafe >= 50) return 'orange'
  return 'red'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Não informada'
  try {
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return 'Data inválida'
  }
}

const isAtrasada = (dataEntrega) => {
  if (!dataEntrega) return false
  try {
    const delivery = new Date(dataEntrega)
    delivery.setHours(23, 59, 59, 999)
    return delivery < new Date()
  } catch {
    return false
  }
}

const viewOP = (op) => {
  navigateTo(`/ops/${op.id}`)
}
</script>

<style scoped>
.stat-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  border-radius: 12px;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 20px rgba(0,0,0,0.2) !important;
}

.ops-table {
  background: transparent !important;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

.text-overline {
  letter-spacing: 0.1rem !important;
  opacity: 0.8;
  font-size: 0.7rem !important;
}

.opacity-30 {
  opacity: 0.3;
}

.opacity-80 {
  opacity: 0.8;
}

.gap-2 {
  gap: 8px;
}
</style>
