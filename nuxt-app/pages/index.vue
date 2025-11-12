<template>
  <v-container fluid class="fill-height">
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="pa-6" color="primary" variant="flat">
          <v-card-text class="text-center text-white">
            <h1 class="text-h3 font-weight-bold mb-2">Dashboard de Produção</h1>
            <p class="text-h6 font-weight-regular">
              Visão geral do andamento das ordens de produção
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Estatísticas -->
    <v-row class="mb-6">
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card 
          class="stat-card pa-4" 
          :color="stat.color" 
          variant="flat"
          @click="stat.action"
        >
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-3">{{ stat.icon }}</v-icon>
            <div class="text-h3 font-weight-bold">{{ stat.value }}</div>
            <div class="text-body-1">{{ stat.title }}</div>
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
                        {{ op?.status || 'ABERTA' }}
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
  </v-container>
</template>

<script setup>
// Estado
const stats = ref([
  { 
    title: 'OPs Abertas', 
    value: 5, 
    icon: 'mdi-clipboard-text-outline', 
    color: 'blue',
    action: () => navigateTo('/ops?status=ABERTA')
  },
  { 
    title: 'Em Produção', 
    value: 12, 
    icon: 'mdi-cog', 
    color: 'orange',
    action: () => navigateTo('/ops?status=EM_FABRICACAO')
  },
  { 
    title: 'Concluídas', 
    value: 8, 
    icon: 'mdi-check-circle', 
    color: 'green',
    action: () => navigateTo('/ops?status=ENTREGUE')
  },
  { 
    title: 'Atrasadas', 
    value: 2, 
    icon: 'mdi-alert-circle', 
    color: 'red',
    action: () => navigateTo('/ops?status=ATRASADA')
  }
])

const recentOps = ref([])
const loading = ref(false)

// Ações rápidas
const quickActions = [
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
})

const loadDashboardData = async () => {
  loading.value = true
  try {
    // Carregar OPs recentes
    const opsData = await $fetch('/api/ops/recent')
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
  const statusSafe = status || 'ABERTA'
  const statusColors = {
    'ABERTA': 'blue',
    'EM_PROJETO': 'orange',
    'EM_FABRICACAO': 'green',
    'EM_MONTAGEM': 'purple',
    'EM_TESTES': 'cyan',
    'ENTREGUE': 'green',
    'CANCELADA': 'red'
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
  if (op?.id) {
    navigateTo(`/ops/${op.id}`)
  }
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