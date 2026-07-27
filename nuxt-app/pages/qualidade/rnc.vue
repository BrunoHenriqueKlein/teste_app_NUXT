<template>
  <div class="pa-4">
    <PageHeader 
      title="Gestão da Qualidade (RNC)" 
      subtitle="Relatórios de Não Conformidade e Inspeções"
      icon="mdi-shield-check"
    >
      <template #actions>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openNovaRNC"
        >
          Nova RNC
        </v-btn>
      </template>
    </PageHeader>

    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="rncs"
        :loading="loading"
        hover
      >
        <template v-slot:top>
          <div class="px-4 pt-4 pb-2">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel elevation="0" class="border">
                <v-expansion-panel-title class="text-subtitle-2 text-primary font-weight-bold">
                  <v-icon start color="primary">mdi-filter-variant</v-icon> Filtros Avançados
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mt-2">
                    <v-col cols="12" md="3">
                      <v-select
                        v-model="filtros.status"
                        :items="['Todos', 'ABERTA', 'EM_ANALISE', 'AGUARDANDO_FORNECEDOR', 'CONCLUIDA', 'CANCELADA']"
                        label="Status"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </template>

        <template v-slot:item.numero="{ item }">
          <div class="font-weight-bold text-primary">{{ item.numero }}</div>
          <div class="text-caption text-grey">{{ formatDate(item.dataEmissao) }}</div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
            class="text-uppercase"
          >
            {{ item.status.replace('_', ' ') }}
          </v-chip>
        </template>
        
        <template v-slot:item.origem="{ item }">
          <div class="text-caption" v-if="item.op"><strong>OP:</strong> {{ item.op.numeroOP }}</div>
          <div class="text-caption" v-if="item.compra"><strong>Compra:</strong> {{ item.compra.numero }}</div>
          <div class="text-caption text-grey" v-if="!item.op && !item.compra">Diversos</div>
        </template>
        
        <template v-slot:item.fornecedor="{ item }">
          {{ item.fornecedor ? item.fornecedor.nome : 'Interno' }}
        </template>

        <template v-slot:item.acoes="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            color="primary"
            title="Ver/Editar RNC"
            @click="editRNC(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            title="Excluir RNC"
            @click="deleteRNC(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <RNCFormDialog 
      v-model="dialog" 
      :rnc="rncEditando" 
      @saved="loadRNCs" 
    />
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
import RNCFormDialog from '~/components/qualidade/RNCFormDialog.vue'

const rncs = ref([])
const loading = ref(false)
const filtros = ref({ status: 'Todos' })
const dialog = ref(false)
const rncEditando = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Número/Data', key: 'numero' },
  { title: 'Status', key: 'status' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Origem', key: 'origem' },
  { title: 'Peça', key: 'peca.codigo' },
  { title: 'Ações', key: 'acoes', align: 'end', sortable: false }
]

const loadRNCs = async () => {
  loading.value = true
  try {
    const query = new URLSearchParams()
    if (filtros.value.status !== 'Todos') query.append('status', filtros.value.status)
    
    rncs.value = await $fetch(`/api/qualidade/rncs?${query.toString()}`)
  } catch (error) {
    showSnackbar('Erro ao carregar RNCs', 'error')
  } finally {
    loading.value = false
  }
}

const openNovaRNC = () => {
  rncEditando.value = null
  dialog.value = true
}

const editRNC = (item) => {
  rncEditando.value = item
  dialog.value = true
}

const deleteRNC = async (item) => {
  if (!confirm(`Tem certeza que deseja excluir a ${item.numero}?`)) return
  
  loading.value = true
  try {
    await $fetch(`/api/qualidade/rncs/${item.id}`, { method: 'DELETE' })
    showSnackbar('RNC excluída com sucesso!')
    await loadRNCs()
  } catch (error) {
    showSnackbar('Erro ao excluir RNC', 'error')
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  const map = {
    'ABERTA': 'error',
    'EM_ANALISE': 'warning',
    'AGUARDANDO_FORNECEDOR': 'info',
    'CONCLUIDA': 'success',
    'CANCELADA': 'grey'
  }
  return map[status] || 'grey'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

watch(() => filtros.value, () => loadRNCs(), { deep: true })
onMounted(loadRNCs)
</script>
