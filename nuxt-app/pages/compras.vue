<template>
  <div class="pa-4">
    <!-- Header -->
    <v-card color="indigo" variant="flat" class="mb-4">
      <v-card-text class="d-flex justify-space-between align-center text-white">
        <div>
          <h1 class="text-h4 font-weight-bold">
            <v-icon icon="mdi-cart" class="mr-2"></v-icon>
            Gestão de Compras
          </h1>
          <p class="text-body-1 mt-1">Requisições, cotações e ordens de compra</p>
        </div>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Nova Requisição
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Tabela de Compras -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="compras"
        :loading="loading"
        hover
      >
        <template v-slot:item.numero="{ item }">
          <div class="font-weight-bold">{{ item.numero }}</div>
        </template>

        <template v-slot:item.op="{ item }">
          <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span> - {{ item.op?.cliente }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.dataSolicitacao="{ item }">
          {{ new Date(item.dataSolicitacao).toLocaleDateString('pt-BR') }}
        </template>

        <template v-slot:item.acoes="{ item }">
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            color="primary"
            @click="viewDetails(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Adicionar Requisição -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title>Nova Requisição de Compra</v-card-title>
        <v-card-text>
          <v-select
            v-model="dialog.data.opId"
            :items="ops"
            item-title="numeroOP"
            item-value="id"
            label="Vincular à OP"
            variant="outlined"
          ></v-select>
          <v-text-field v-model="dialog.data.fornecedor" label="Fornecedor Sugerido" variant="outlined"></v-text-field>
          
          <h3 class="text-subtitle-1 mb-2">Itens para Compra</h3>
          <v-row v-for="(item, index) in dialog.data.itens" :key="index" dense>
            <v-col cols="8">
              <v-text-field v-model="item.descricao" label="Descrição do Item" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="item.quantidade" label="Qtd" type="number" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="1">
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeItem(index)"></v-btn>
            </v-col>
          </v-row>
          <v-btn variant="text" color="primary" prepend-icon="mdi-plus" @click="addItem">Adicionar Item</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog.show = false">Cancelar</v-btn>
          <v-btn color="indigo" variant="flat" :loading="saving" @click="saveCompra">Solicitar Compra</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const compras = ref([])
const ops = ref([])
const loading = ref(false)
const saving = ref(false)

const dialog = ref({
  show: false,
  data: { opId: null, fornecedor: '', itens: [] }
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Pedido', key: 'numero' },
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Status', key: 'status' },
  { title: 'Data Solicitação', key: 'dataSolicitacao' },
  { title: 'Itens', key: '_count.itens', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const loadCompras = async () => {
  loading.value = true
  try {
    compras.value = await $fetch('/api/compras')
  } catch (error) {
    showSnackbar('Erro ao carregar compras', 'error')
  } finally {
    loading.value = false
  }
}

const loadOPs = async () => {
  try {
    ops.value = await $fetch('/api/ops')
  } catch (error) {}
}

const openAddDialog = () => {
  dialog.value.show = true
  dialog.value.data = { opId: null, fornecedor: '', itens: [{ descricao: '', quantidade: 1 }] }
  loadOPs()
}

const addItem = () => {
  dialog.value.data.itens.push({ descricao: '', quantidade: 1 })
}

const removeItem = (index) => {
  dialog.value.data.itens.splice(index, 1)
}

const saveCompra = async () => {
  saving.value = true
  try {
    await $fetch('/api/compras', {
      method: 'POST',
      body: dialog.value.data
    })
    showSnackbar('Requisição enviada!')
    dialog.value.show = false
    await loadCompras()
  } catch (error) {
    showSnackbar('Erro ao criar requisição', 'error')
  } finally {
    saving.value = false
  }
}

const getStatusColor = (status) => {
  const colors = {
    SOLICITADA: 'grey',
    COTADA: 'blue',
    COMPRADA: 'orange',
    ENTREGUE: 'success',
    CANCELADA: 'red'
  }
  return colors[status] || 'grey'
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(loadCompras)
</script>
