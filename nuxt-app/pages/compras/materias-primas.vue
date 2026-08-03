<template>
  <div class="pa-4">
    <PageHeader 
      title="Matérias-Primas (BOM)" 
      subtitle="Gestão e consolidação de materiais brutos para fabricação"
      icon="mdi-cube-outline"
      :back-to="'/compras'"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-cart-plus"
          :disabled="selected.length === 0"
          @click="solicitarCompra"
          class="mr-2"
        >
          Solicitar Compra ({{ selected.length }})
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-check-all"
          :disabled="selected.length === 0"
          @click="atenderEstoque"
        >
          Atendido Pelo Estoque ({{ selected.length }})
        </v-btn>
      </template>
    </PageHeader>

    <v-card variant="outlined" class="mt-4">
      <v-card-title class="d-flex align-center py-3">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar por Código, Descrição, OP ou Material..."
          single-line
          hide-details
          variant="outlined"
          density="compact"
          class="mr-4"
          style="max-width: 400px"
        ></v-text-field>
        <v-spacer></v-spacer>
        
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Filtrar por Status"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 250px"
          clearable
        ></v-select>
      </v-card-title>
      
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="filteredItems"
        :search="search"
        :loading="loading"
        show-select
        hover
        density="comfortable"
      >
        <template v-slot:item.op.numeroOP="{ item }">
          <v-chip size="small" color="primary" variant="tonal">
            {{ item.op?.numeroOP }}
          </v-chip>
          <div class="text-caption text-grey mt-1" v-if="item.op?.codigoMaquina">
            {{ item.op?.codigoMaquina }}
          </div>
        </template>
        
        <template v-slot:item.codigo="{ item }">
          <div class="font-weight-bold">{{ item.codigo }}</div>
          <div class="text-caption text-grey text-truncate" style="max-width: 200px;">
            {{ item.descricao }}
          </div>
        </template>
        
        <template v-slot:item.tipoMaterial="{ item }">
          {{ item.tipoMaterial || '-' }}
        </template>

        <template v-slot:item.material="{ item }">
          {{ item.material || '-' }}
        </template>

        <template v-slot:item.comprimentoMaterial="{ item }">
          {{ item.comprimentoMaterial ? item.comprimentoMaterial + ' mm' : '-' }}
        </template>
        
        <template v-slot:item.statusSuprimento="{ item }">
          <v-chip :color="getStatusColor(item.statusSuprimento)" size="small">
            {{ formatStatus(item.statusSuprimento) }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const items = ref([])
const selected = ref([])
const search = ref('')
const loading = ref(false)
const statusFilter = ref('NAO_SOLICITADO')

const statusOptions = [
  { title: 'Não Solicitado', value: 'NAO_SOLICITADO' },
  { title: 'Para Cotação', value: 'PARA_COTACAO' },
  { title: 'Em Orçamento', value: 'EM_ORCAMENTO' },
  { title: 'Comprado', value: 'COMPRADO' },
  { title: 'Recebido Parcial', value: 'RECEBIDO_PARCIAL' },
  { title: 'Recebido / Atendido', value: 'RECEBIDO' }
]

const headers = [
  { title: 'OP', key: 'op.numeroOP', width: '120px' },
  { title: 'Peça', key: 'codigo', width: '250px' },
  { title: 'Perfil / Tipo', key: 'tipoMaterial' },
  { title: 'Liga / Material', key: 'material' },
  { title: 'Comprimento', key: 'comprimentoMaterial', align: 'end' },
  { title: 'Qtd', key: 'quantidade', align: 'center' },
  { title: 'Status', key: 'statusSuprimento', align: 'center' },
]

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const filteredItems = computed(() => {
  let result = items.value
  
  if (statusFilter.value) {
    if (statusFilter.value === 'RECEBIDO') {
      result = result.filter(i => i.statusSuprimento === 'RECEBIDO' || i.statusSuprimento === 'ATENDIDO_ESTOQUE')
    } else {
      result = result.filter(i => i.statusSuprimento === statusFilter.value)
    }
  }
  
  return result
})

const carregarDados = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/compras/materias-primas')
    items.value = data
  } catch (error) {
    showSnackbar('Erro ao carregar matérias-primas', 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const atualizarStatusLote = async (status) => {
  if (selected.value.length === 0) return
  
  try {
    loading.value = true
    const pecaIds = selected.value.map(item => item.id)
    
    await $fetch('/api/compras/materias-primas', {
      method: 'POST',
      body: {
        action: 'update_status',
        pecaIds,
        status
      }
    })
    
    showSnackbar(`Status atualizado para ${status} com sucesso!`)
    selected.value = []
    await carregarDados()
  } catch (error) {
    showSnackbar('Erro ao atualizar status', 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const solicitarCompra = () => {
  atualizarStatusLote('PARA_COTACAO')
}

const atenderEstoque = () => {
  // Assume que RECEBIDO atende o item por completo. Pode ser ATENDIDO_ESTOQUE se existir no enum SuprimentoStatus
  atualizarStatusLote('RECEBIDO')
}

const getStatusColor = (status) => {
  const colors = {
    'NAO_SOLICITADO': 'grey',
    'PARA_COTACAO': 'purple',
    'EM_ORCAMENTO': 'orange',
    'COMPRADO': 'blue',
    'RECEBIDO_PARCIAL': 'teal',
    'RECEBIDO': 'success',
    'ATENDIDO_ESTOQUE': 'success'
  }
  return colors[status] || 'grey'
}

const formatStatus = (status) => {
  const formats = {
    'NAO_SOLICITADO': 'Não Solicitado',
    'PARA_COTACAO': 'Para Cotação',
    'EM_ORCAMENTO': 'Em Orçamento',
    'COMPRADO': 'Comprado',
    'RECEBIDO_PARCIAL': 'Rec. Parcial',
    'RECEBIDO': 'Recebido',
    'ATENDIDO_ESTOQUE': 'Atendido no Estoque'
  }
  return formats[status] || status
}

onMounted(() => {
  carregarDados()
})
</script>
