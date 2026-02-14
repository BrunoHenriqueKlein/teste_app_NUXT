<template>
  <div class="pa-4">
    <PageHeader 
      title="Monitoramento PCP" 
      subtitle="Visão geral de suprimentos e prazos de produção"
      icon="mdi-monitor-dashboard"
    />

    <!-- Cards de Resumo -->
    <v-row class="mt-2">
      <v-col cols="12" md="3">
        <v-card variant="flat" color="blue-lighten-5" class="pa-4 custom-card">
          <div class="text-overline mb-1">OPs Ativas</div>
          <div class="text-h4 font-weight-bold text-blue-darken-3">{{ ops.length }}</div>
          <v-icon size="40" color="blue-lighten-3" style="position: absolute; right: 16px; top: 16px;">mdi-clipboard-list</v-icon>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="flat" color="orange-lighten-5" class="pa-4 custom-card">
          <div class="text-overline mb-1">Itens em Atraso</div>
          <div class="text-h4 font-weight-bold text-orange-darken-3">{{ totalAtrasos }}</div>
          <v-icon size="40" color="orange-lighten-3" style="position: absolute; right: 16px; top: 16px;">mdi-clock-alert</v-icon>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="flat" color="green-lighten-5" class="pa-4 custom-card">
          <div class="text-overline mb-1">Peças Recebidas (Hoje)</div>
          <div class="text-h4 font-weight-bold text-green-darken-3">{{ recebidosHoje }}</div>
          <v-icon size="40" color="green-lighten-3" style="position: absolute; right: 16px; top: 16px;">mdi-truck-check</v-icon>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="flat" color="purple-lighten-5" class="pa-4 custom-card">
          <div class="text-overline mb-1">Média de Progresso</div>
          <div class="text-h4 font-weight-bold text-purple-darken-3">{{ mediaProgresso.toFixed(1) }}%</div>
          <v-icon size="40" color="purple-lighten-3" style="position: absolute; right: 16px; top: 16px;">mdi-chart-line</v-icon>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabela de OPs -->
    <v-card variant="outlined" class="mt-6">
      <v-card-title class="pa-4 d-flex justify-space-between align-center">
        Status por Ordem de Produção
        <v-btn icon="mdi-refresh" variant="text" size="small" @click="loadDashboard" :loading="loading"></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-data-table
        :headers="headers"
        :items="ops"
        :loading="loading"
        hover
        no-data-text="Nenhuma OP ativa encontrada."
      >
        <template v-slot:item.op="{ item }">
          <div>
            <div class="font-weight-bold text-primary">#{{ item.numeroOP }}</div>
            <div class="text-caption text-grey">{{ item.cliente }}</div>
          </div>
        </template>

        <template v-slot:item.progresso="{ item }">
          <div class="d-flex align-center">
            <v-progress-linear
              :model-value="item.progressoSuprimentos"
              color="success"
              height="10"
              rounded
              class="mr-4"
            ></v-progress-linear>
            <span class="text-caption font-weight-bold">{{ item.progressoSuprimentos.toFixed(0) }}%</span>
          </div>
        </template>

        <template v-slot:item.stats="{ item }">
          <div class="d-flex gap-2">
            <v-tooltip text="Pendentes">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" size="x-small" color="grey">{{ item.stats.pendentes }}</v-chip>
              </template>
            </v-tooltip>
            <v-tooltip text="Comprados">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" size="x-small" color="blue">{{ item.stats.compradas }}</v-chip>
              </template>
            </v-tooltip>
            <v-tooltip text="Recebidos">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" size="x-small" color="success">{{ item.stats.recebidas }}</v-chip>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:item.atrasos="{ item }">
          <v-chip
            v-if="item.atrasos.length > 0"
            color="error"
            size="small"
            variant="flat"
            prepend-icon="mdi-alert-circle"
            @click="verAtrasos(item)"
          >
            {{ item.atrasos.length }} Atrasados
          </v-chip>
          <v-chip v-else color="success" size="small" variant="tonal">Em dia</v-chip>
        </template>

        <template v-slot:item.entrega="{ item }">
          <div :class="isDelayed(item.dataEntregaOP) ? 'text-error font-weight-bold' : ''">
            {{ formatDate(item.dataEntregaOP) }}
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog de Detalhes de Atrasos -->
    <v-dialog v-model="dialogAtrasos.show" max-width="700px">
      <v-card v-if="dialogAtrasos.op">
        <v-card-title class="bg-orange-darken-3 text-white pa-4">
          Itens em Atraso - OP #{{ dialogAtrasos.op.numeroOP }}
        </v-card-title>
        <v-card-text class="pa-0">
          <v-list lines="two">
            <v-list-item v-for="peca in dialogAtrasos.op.atrasos" :key="peca.id">
              <template v-slot:prepend>
                <v-icon color="error">mdi-clock-alert</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">{{ peca.codigo }}</v-list-item-title>
              <v-list-item-subtitle>{{ peca.descricao }}</v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-right">
                  <div class="text-caption text-error font-weight-bold">Previsto: {{ formatDate(peca.previsao) }}</div>
                  <v-chip size="x-small" color="orange">{{ peca.status }}</v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogAtrasos.show = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const ops = ref([])
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Prazo Entrega', key: 'entrega' },
  { title: 'Progresso Suprimentos', key: 'progresso', width: '300px' },
  { title: 'Contagem', key: 'stats', align: 'center' },
  { title: 'Alertas', key: 'atrasos', align: 'center' }
]

const totalAtrasos = computed(() => {
  return ops.value.reduce((acc, op) => acc + op.atrasos.length, 0)
})

const mediaProgresso = computed(() => {
  if (ops.value.length === 0) return 0
  return ops.value.reduce((acc, op) => acc + op.progressoSuprimentos, 0) / ops.value.length
})

const recebidosHoje = ref(0) // Simplificado por enquanto

const dialogAtrasos = ref({
  show: false,
  op: null
})

const loadDashboard = async () => {
  loading.value = true
  try {
    ops.value = await $fetch('/api/pcp/dashboard')
  } catch (error) {
    showSnackbar('Erro ao carregar dashboard', 'error')
  } finally {
    loading.value = false
  }
}

const verAtrasos = (op) => {
  dialogAtrasos.value = {
    show: true,
    op: op
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

const isDelayed = (date) => {
  if (!date) return false
  const today = new Date()
  today.setHours(0,0,0,0)
  return new Date(date) < today
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.custom-card {
  transition: transform 0.2s;
  cursor: default;
}
.custom-card:hover {
  transform: translateY(-4px);
}
.gap-2 {
  gap: 8px;
}
</style>
