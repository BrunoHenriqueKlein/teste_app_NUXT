<template>
  <div class="w-100">
    <!-- Header -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="pa-4" color="primary" variant="flat">
            <v-card-text class="text-center text-white">
              <h1 class="text-h5 font-weight-bold mb-1">Dashboard de Produção</h1>
              <p class="text-subtitle-2 font-weight-regular">
                Olá, {{ userNameDisplay }}! Aqui está o resumo das ordens de produção.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

    <v-row class="mb-6">
      <!-- Tarefas Pessoais - Destaque -->
      <v-col cols="12" md="4">
        <v-card 
          class="stat-card pa-2" 
          color="indigo-darken-2" 
          variant="flat"
          @click="navigateTo('/tarefas')"
        >
          <v-card-text class="d-flex align-center text-white py-2">
            <v-icon size="48" class="mr-4">mdi-clipboard-check-multiple</v-icon>
            <div class="text-left">
              <div class="text-h4 font-weight-bold">{{ dashboardStats?.minhasTarefas || 0 }}</div>
              <div class="text-subtitle-1 font-weight-medium">Minhas Tarefas Pendentes</div>
            </div>
            <v-spacer />
            <v-icon size="24">mdi-chevron-right</v-icon>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Stats Gerais -->
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="2">
        <v-card 
          class="stat-card pa-2" 
          :color="stat.color" 
          variant="flat"
          @click="stat.action"
        >
          <v-card-text class="text-center text-white py-2 px-1">
            <v-icon size="24" class="mb-1">{{ stat.icon }}</v-icon>
            <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
            <div class="text-caption font-weight-medium" style="font-size: 0.7rem !important">{{ stat.title }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Conteúdo Principal -->
    <v-row>
      <!-- OPs Recentes -->
      <v-col cols="12" lg="8">
        <v-card class="h-100">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Ordens de Produção Recentes</span>
            <v-btn 
              color="primary" 
              @click="navigateTo('/ops')" 
              prepend-icon="mdi-plus"
            >
              Nova OP
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-progress-linear 
              v-if="loading" 
              indeterminate 
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <v-alert 
              v-else-if="recentOps.length === 0" 
              type="info" 
              variant="tonal"
              class="my-4"
            >
              <template v-slot:prepend>
                <v-icon color="info">mdi-information</v-icon>
              </template>
              Nenhuma ordem de produção encontrada.
              <template v-slot:append>
                <v-btn variant="text" color="info" @click="navigateTo('/ops')">
                  Criar primeira OP
                </v-btn>
              </template>
            </v-alert>

            <v-row v-else>
              <v-col 
                v-for="op in recentOps" 
                :key="op.id" 
                cols="12" 
                md="6"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-item>
                    <template v-slot:prepend>
                      <v-avatar :color="getStatusColor(op?.status)" size="40">
                        <v-icon icon="mdi-clipboard-list" color="white"></v-icon>
                      </v-avatar>
                    </template>
                    
                    <v-card-title class="text-h6">
                      {{ op?.numeroOP || 'N/A' }}
                    </v-card-title>
                    
                    <v-card-subtitle>
                      {{ op?.descricaoMaquina || 'Descrição não informada' }}
                    </v-card-subtitle>
                  </v-card-item>

                  <v-card-text>
                    <div class="mb-2">
                      <v-icon small class="mr-1">mdi-account</v-icon>
                      <strong>Cliente:</strong> {{ op?.cliente || 'Não informado' }}
                    </div>
                    
                    <div class="mb-2">
                      <v-icon small class="mr-1">mdi-calendar</v-icon>
                      <strong>Entrega:</strong> 
                      {{ formatDate(op?.dataEntrega) || 'Não informada' }}
                      <v-chip 
                        v-if="op?.dataEntrega && isAtrasada(op.dataEntrega)" 
                        size="small" 
                        color="error" 
                        class="ml-2"
                      >
                        Atrasada
                      </v-chip>
                    </div>

                    <div class="mb-3">
                      <div class="d-flex justify-space-between mb-1">
                        <span>Progresso</span>
                        <span class="font-weight-bold">{{ op?.progresso || 0 }}%</span>
                      </div>
                      <v-progress-linear 
                        :model-value="op?.progresso || 0" 
                        :color="getProgressColor(op?.progresso || 0)"
                        height="8"
                        rounded
                      ></v-progress-linear>
                    </div>

                    <div class="d-flex justify-space-between align-center">
                      <v-chip 
                        :color="getStatusColor(op?.status)" 
                        variant="flat" 
                        size="small"
                      >
                        {{ op?.status || 'AGUARDANDO' }}
                      </v-chip>
                      
                      <v-btn 
                        icon 
                        variant="text" 
                        size="small"
                        @click="viewOP(op)"
                      >
                        <v-icon>mdi-chevron-right</v-icon>
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Ações Rápidas -->
      <v-col cols="12" lg="4">
        <v-card class="h-100">
          <v-card-title class="text-h5">Ações Rápidas</v-card-title>
          <v-card-text>
            <v-list density="comfortable">
              <v-list-item
                v-for="action in quickActions"
                :key="action.title"
                :prepend-icon="action.icon"
                :title="action.title"
                @click="action.handler"
                variant="tonal"
                class="mb-2 rounded"
              >
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const { userName, authHeaders } = useAuth()
// Adicione estas computed properties no seu script
import { computed } from 'vue'

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
    color: 'grey',
    action: () => navigateTo('/ops?status=AGUARDANDO')
  },
  { 
    title: 'Em Produção', 
    value: dashboardStats.value?.opsProducao || 0, 
    icon: 'mdi-cog', 
    color: 'blue-lighten-1',
    action: () => navigateTo('/ops?status=EM_FABRICACAO')
  },
  { 
    title: 'Concluídas', 
    value: dashboardStats.value?.opsConcluidas || 0, 
    icon: 'mdi-check-circle', 
    color: 'green-darken-3',
    action: () => navigateTo('/ops?status=CONCLUIDA')
  },
  { 
    title: 'Atrasadas', 
    value: dashboardStats.value?.opsAtrasadas || 0, 
    icon: 'mdi-alert-circle', 
    color: 'red',
    action: () => navigateTo('/ops?atrasada=true')
  }
])

const recentOps = ref([])
const loading = ref(false)

// Ações rápidas
const quickActions = [
  {
    title: 'Minhas Tarefas',
    icon: 'mdi-clipboard-check-multiple',
    handler: () => navigateTo('/tarefas')
  },
  {
    title: 'Nova Ordem de Produção',
    icon: 'mdi-plus-circle',
    handler: () => navigateTo('/ops?create=new')
  },
  {
    title: 'Relatório de Produção',
    icon: 'mdi-chart-bar',
    handler: () => navigateTo('/relatorios')
  },
  {
    title: 'Gerenciar Estoque',
    icon: 'mdi-warehouse',
    handler: () => navigateTo('/estoque')
  },
  {
    title: 'Solicitar Compra',
    icon: 'mdi-cart',
    handler: () => navigateTo('/compras')
  }
]

// Carregar dados do dashboard
onMounted(async () => {
  await loadDashboardData()
  await refreshStats()
})

const loadDashboardData = async () => {
  loading.value = true
  try {
    // Carregar OPs recentes
    const opsData = await $fetch('/api/ops/recent', {
      headers: authHeaders.value
    })
    recentOps.value = Array.isArray(opsData) ? opsData : []
    
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
    recentOps.value = []
  } finally {
    loading.value = false
  }
}

// Utilitários
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
    return new Date(dataEntrega) < new Date()
  } catch {
    return false
  }
}

const viewOP = (op) => {
  navigateTo(`/ops/${op.id}`)  // → Dashboard Gantt
}
</script>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.h-100 {
  height: 100%;
}

.fill-height {
  min-height: calc(100vh - 200px);
}
</style>
