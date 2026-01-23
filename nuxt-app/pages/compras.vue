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

    <!-- Tabs de Navegação -->
    <v-tabs v-model="tab" color="indigo" class="mb-4">
      <v-tab value="demandas">Demandas da BOM</v-tab>
      <v-tab value="ordens">Ordens de Compra</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Aba de Demandas (Itens da BOM marcados como COMPRADO) -->
      <v-window-item value="demandas">
        <v-card variant="outlined">
          <v-data-table
            :headers="headersDemandas"
            :items="demandas"
            :loading="loadingDemandas"
            hover
          >
            <template v-slot:item.op="{ item }">
              <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span> - {{ item.op?.cliente }}
            </template>

            <template v-slot:item.statusSuprimento="{ item }">
              <v-chip :color="getSuprimentoColor(item.statusSuprimento)" size="small" variant="flat">
                {{ item.statusSuprimento.replace('_', ' ') }}
              </v-chip>
            </template>

            <template v-slot:item.valorUnitario="{ item }">
              {{ item.valorUnitario ? `R$ ${item.valorUnitario.toFixed(2)}` : '-' }}
            </template>

            <template v-slot:item.fornecedor="{ item }">
              {{ item.fornecedor?.nome || '-' }}
            </template>

            <template v-slot:item.acoes="{ item }">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="primary"
                title="Atualizar Status/Preço"
                @click="editDemanda(item)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- Aba de Ordens de Compra (Formalizadas) -->
      <v-window-item value="ordens">
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
      </v-window-item>
    </v-window>

    <!-- Adicionar Requisição Manual -->
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

    <!-- Editar Demanda (Item da BOM) -->
    <v-dialog v-model="dialogDemanda.show" max-width="500px">
      <v-card>
        <v-card-title>Atualizar Demanda Comercial</v-card-title>
        <v-card-text>
          <div class="text-subtitle-1 font-weight-bold mb-4">Item: {{ dialogDemanda.data.codigo }}</div>
          
          <v-select
            v-model="dialogDemanda.data.fornecedorId"
            :items="fornecedores"
            item-title="nome"
            item-value="id"
            label="Fornecedor Vencedor"
            variant="outlined"
            clearable
          ></v-select>

          <v-text-field
            v-model.number="dialogDemanda.data.valorUnitario"
            label="Valor Unitário (R$)"
            type="number"
            variant="outlined"
            prefix="R$"
          ></v-text-field>

          <v-select
            v-model="dialogDemanda.data.statusSuprimento"
            :items="['NAO_SOLICITADO', 'EM_ORCAMENTO', 'COMPRADO', 'RECEBIDO']"
            label="Status de Suprimento"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDemanda.show = false">Cancelar</v-btn>
          <v-btn color="indigo" variant="flat" :loading="saving" @click="saveDemanda">Salvar Alterações</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const tab = ref('demandas')
const demandas = ref([])
const loadingDemandas = ref(false)
const fornecedores = ref([])
const compras = ref([])
const ops = ref([])
const loading = ref(false)
const saving = ref(false)

const dialog = ref({
  show: false,
  data: { opId: null, fornecedor: '', itens: [] }
})

const dialogDemanda = ref({
  show: false,
  data: { id: null, codigo: '', valorUnitario: 0, fornecedorId: null, statusSuprimento: '' }
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headersDemandas = [
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Código', key: 'codigo' },
  { title: 'Descrição', key: 'descricao' },
  { title: 'Qtd', key: 'quantidade', align: 'end' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Vlr. Unit.', key: 'valorUnitario', align: 'end' },
  { title: 'Status', key: 'statusSuprimento', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const headers = [
  { title: 'Pedido', key: 'numero' },
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Status', key: 'status' },
  { title: 'Data Solicitação', key: 'dataSolicitacao' },
  { title: 'Itens', key: '_count.itens', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const loadDemandas = async () => {
  loadingDemandas.value = true
  try {
    demandas.value = await $fetch('/api/compras/demandas')
  } catch (error) {
    showSnackbar('Erro ao carregar demandas', 'error')
  } finally {
    loadingDemandas.value = false
  }
}

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

const loadFornecedores = async () => {
  try {
    fornecedores.value = await $fetch('/api/fornecedores')
  } catch (error) {}
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

const editDemanda = (item) => {
  dialogDemanda.value = {
    show: true,
    data: { 
      id: item.id, 
      codigo: item.codigo, 
      valorUnitario: item.valorUnitario || 0, 
      fornecedorId: item.fornecedorId, 
      statusSuprimento: item.statusSuprimento 
    }
  }
  loadFornecedores()
}

const saveDemanda = async () => {
  saving.value = true
  try {
    await $fetch(`/api/pecas/${dialogDemanda.value.data.id}`, {
      method: 'PATCH',
      body: {
        valorUnitario: dialogDemanda.value.data.valorUnitario,
        fornecedorId: dialogDemanda.value.data.fornecedorId,
        statusSuprimento: dialogDemanda.value.data.statusSuprimento
      }
    })
    showSnackbar('Demanda atualizada!')
    dialogDemanda.value.show = false
    await loadDemandas()
  } catch (error) {
    showSnackbar('Erro ao atualizar demanda', 'error')
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

const getSuprimentoColor = (status) => {
  const colors = {
    NAO_SOLICITADO: 'grey-darken-1',
    EM_ORCAMENTO: 'orange-darken-1',
    COMPRADO: 'blue-darken-2',
    RECEBIDO: 'success'
  }
  return colors[status] || 'grey'
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  loadDemandas()
  loadCompras()
})
</script>
