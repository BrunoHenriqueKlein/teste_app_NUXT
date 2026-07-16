<template>
  <div class="pa-4">
    <PageHeader 
      title="Logs do Sistema" 
      subtitle="Auditoria de eventos e atualizações no sistema"
      icon="mdi-format-list-bulleted"
    />

    <v-card variant="outlined" class="mt-4">
      <v-card-title class="d-flex flex-wrap align-center gap-4 pa-4">
        Últimas Atividades
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar (Peça, Máquina, OP...)"
          single-line
          hide-details
          density="compact"
          variant="outlined"
          style="max-width: 300px"
        ></v-text-field>
        <v-btn icon="mdi-refresh" variant="text" @click="loadLogs" :loading="loading" class="ml-2"></v-btn>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="logs"
        :loading="loading"
        :items-per-page="100"
        :items-per-page-options="[
          { value: 100, title: '100' },
          { value: 250, title: '250' },
          { value: 500, title: '500' },
          { value: -1, title: 'Todos' }
        ]"
        hover
        no-data-text="Nenhum log encontrado."
      >
        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        
        <template v-slot:item.user="{ item }">
          <div v-if="item.user">
            <div class="font-weight-bold">{{ item.user.name }}</div>
            <div class="text-caption text-grey">{{ item.user.department || '-' }}</div>
          </div>
          <span v-else class="text-grey font-italic">Sistema</span>
        </template>

        <template v-slot:item.acao="{ item }">
          <v-chip size="small" color="primary" variant="outlined">{{ item.acao }}</v-chip>
        </template>

        <template v-slot:item.detalhes="{ item }">
          <div class="text-body-2" style="max-width: 500px; white-space: normal;">
            {{ item.detalhes }}
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
const logs = ref([])
const loading = ref(false)
const search = ref('')

const headers = [
  { title: 'Data / Hora', key: 'createdAt', width: '180px' },
  { title: 'Usuário', key: 'user', width: '200px' },
  { title: 'Ação', key: 'acao', width: '200px' },
  { title: 'Detalhes', key: 'detalhes' }
]

const loadLogs = async () => {
  loading.value = true
  try {
    const queryParams = new URLSearchParams()
    if (search.value) queryParams.append('q', search.value)
    
    logs.value = await $fetch(`/api/logs?${queryParams.toString()}`)
  } catch (error) {
    console.error('Erro ao carregar logs:', error)
  } finally {
    loading.value = false
  }
}

// Timeout para busca no servidor (debounce)
let searchTimeout = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadLogs()
  }, 500) // Aguarda o usuário parar de digitar por 500ms
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(date)
}

onMounted(() => {
  loadLogs()
})
</script>
