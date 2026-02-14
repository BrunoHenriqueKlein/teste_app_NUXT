<template>
  <div class="pa-4">
    <!-- Header Standard -->
    <PageHeader 
      title="Gestão de Compras" 
      subtitle="Requisições, cotações e ordens de compra"
      icon="mdi-cart"
    >
      <template #actions>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Nova Requisição
        </v-btn>
      </template>
    </PageHeader>

    <!-- Hub de Navegação -->
    <v-row class="mt-2">
      <v-col cols="12" md="4">
        <v-card 
          link 
          to="/compras/cotacoes" 
          variant="outlined" 
          class="pa-4 d-flex align-center" 
          height="120"
          hover
        >
          <v-icon size="40" color="primary" class="mr-4">mdi-calculator</v-icon>
          <div>
            <div class="text-h6">Cotações e Orçamentos</div>
            <div class="text-body-2 text-grey">Definir preços, fornecedores e impostos</div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card 
          link 
          to="/compras/recebimento" 
          variant="outlined" 
          class="pa-4 d-flex align-center" 
          height="120"
          hover
        >
          <v-icon size="40" color="success" class="mr-4">mdi-truck-check</v-icon>
          <div>
            <div class="text-h6">Recebimento</div>
            <div class="text-body-2 text-grey">Dar baixa em OCs e conferir NF</div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card 
          variant="outlined" 
          class="pa-4 d-flex align-center grey lighten-4" 
          height="120"
          style="opacity: 0.7"
        >
          <v-icon size="40" color="orange" class="mr-4">mdi-store-alert</v-icon>
          <div>
            <div class="text-h6 text-grey-darken-2">Gestão de Estoque</div>
            <div class="text-body-2 text-grey">Em breve: Reposição automática</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="requisicoes">
        <v-badge :content="requisicoesEngenharia.length" color="error" :model-value="requisicoesEngenharia.length > 0" class="mr-2">
          Requisições da Engenharia
        </v-badge>
      </v-tab>
      <v-tab value="pedidos">Pedidos de Compra (OCs)</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="requisicoes">
        <v-card variant="outlined">
          <v-data-table
            :headers="headersRequisicoes"
            :items="requisicoesEngenharia"
            :loading="loading"
            hover
          >
            <template v-slot:item.op="{ item }">
              <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span>
            </template>
            <template v-slot:item.categoria="{ item }">
              <v-chip size="x-small" color="indigo" variant="flat">
                {{ item.fornecedor.replace('REQ_', '') }}
              </v-chip>
            </template>
            <template v-slot:item.acoes="{ item }">
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-eye"
                @click="verDetalhesRequisicao(item)"
              >
                Tratar
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="pedidos">
        <v-card variant="outlined">
          <v-data-table
            :headers="headers"
            :items="activeOrders"
            :loading="loading"
            hover
          >
            <template v-slot:item.numero="{ item }">
              <div class="font-weight-bold">{{ item.numero }}</div>
            </template>
            <template v-slot:item.op="{ item }">
              <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small">
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.previsao="{ item }">
              <div :class="isDelayed(item.dataPrevisaoEntrega) ? 'text-error font-weight-bold' : ''">
                {{ formatDate(item.dataPrevisaoEntrega) }}
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

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
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveCompra">Solicitar Compra</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Diálogo de Detalhes da Requisição -->
    <v-dialog v-model="dialogDetalhes.show" max-width="900px">
      <v-card v-if="dialogDetalhes.requisicao">
        <v-card-title class="bg-primary text-white d-flex justify-space-between align-center pa-4">
          <div>
            <div class="text-h6">Requisição {{ dialogDetalhes.requisicao.numero }}</div>
            <div class="text-subtitle-2">OP #{{ dialogDetalhes.requisicao.op?.numeroOP }} - {{ dialogDetalhes.requisicao.op?.cliente }}</div>
          </div>
          <v-chip color="white" variant="flat" size="small">
            {{ (dialogDetalhes.requisicao.fornecedor || '').replace('REQ_', '') }}
          </v-chip>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            title="Instruções para Compras"
          >
            Negocie os itens abaixo no SigeCloud e, após gerar a Ordem de Compra formal, vincule o número e a data de entrega aqui no sistema.
          </v-alert>

          <v-table>
            <thead>
              <tr>
                <th class="text-left">Cód. Peça</th>
                <th class="text-left">Descrição / Material</th>
                <th class="text-center">Qtd</th>
                <th class="text-center">Desenhos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dialogDetalhes.requisicao.itens" :key="item.id">
                <td class="font-weight-bold text-primary">{{ item.peca?.codigo || '-' }}</td>
                <td>
                  <div>{{ item.descricao }}</div>
                  <div class="text-caption text-grey">{{ item.peca?.material }}</div>
                </td>
                <td class="text-center">{{ item.quantidade }}</td>
                <td class="text-center">
                  <div class="d-flex justify-center gap-1">
                    <v-btn
                      v-for="anexo in item.peca?.anexos"
                      :key="anexo.id"
                      icon="mdi-file-pdf-box"
                      size="x-small"
                      color="error"
                      variant="text"
                      @click="viewDrawing(anexo.url)"
                      :title="anexo.nome"
                    ></v-btn>
                    <span v-if="!item.peca?.anexos?.length" class="text-caption text-grey">Sem desenho</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-6"></v-divider>

          <h3 class="text-h6 mb-4">Vincular Ordem de Compra (SigeCloud)</h3>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="dialogDetalhes.ocFomal"
                label="Número da OC no SigeCloud"
                variant="outlined"
                prepend-icon="mdi-file-certificate"
                placeholder="Ex: OC-12345"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="dialogDetalhes.dataPrevisao"
                label="Previsão de Entrega"
                type="date"
                variant="outlined"
                prepend-icon="mdi-calendar"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDetalhes.show = false">Fechar</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="saving"
            :disabled="!dialogDetalhes.ocFomal || !dialogDetalhes.dataPrevisao"
            @click="vincularOC"
          >
            Confirmar Compra
          </v-btn>
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
            :items="filteredFornecedoresDemandas"
            item-title="nome"
            item-value="id"
            label="Fornecedor Vencedor"
            variant="outlined"
            clearable
            :hint="dialogDemanda.data.subcategoria ? `Filtrando por: ${dialogDemanda.data.subcategoria}` : ''"
            persistent-hint
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
const tab = ref('requisicoes')
const demandas = ref([])
const loadingDemandas = ref(false)
const fornecedores = ref([])
const compras = ref([])
const ops = ref([])
const loading = ref(false)
const saving = ref(false)

const requisicoesEngenharia = computed(() => {
  return compras.value.filter(c => c.status === 'SOLICITADA' && c.fornecedor.startsWith('REQ_'))
})

const activeOrders = computed(() => {
  return compras.value.filter(o => o.status !== 'RECEBIDA_TOTAL' && o.status !== 'CANCELADA' && !o.fornecedor.startsWith('REQ_'))
})

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

const dialog = ref({
  show: false,
  data: { opId: null, fornecedor: '', itens: [] }
})

const dialogDemanda = ref({
  show: false,
  data: { 
    id: null, 
    codigo: '', 
    subcategoria: '',
    valorUnitario: 0, 
    fornecedorId: null, 
    statusSuprimento: '' 
  }
})

const filteredFornecedoresDemandas = computed(() => {
  if (!dialogDemanda.value.data.subcategoria) return fornecedores.value
  
  const sub = dialogDemanda.value.data.subcategoria.toLowerCase()
  return fornecedores.value.filter(f => 
    f.categorias && f.categorias.some(c => c.toLowerCase() === sub)
  )
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

const headersRequisicoes = [
  { title: 'Data', key: 'dataSolicitacao', formatter: formatDate },
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Categoria', key: 'categoria', align: 'center' },
  { title: 'Itens', key: '_count.itens', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const headers = [
  { title: 'Pedido', key: 'numero' },
  { title: 'OP', key: 'op' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Previsão de Entrega', key: 'previsao' },
  { title: 'Status', key: 'status' },
  { title: 'Itens', key: '_count.itens', align: 'center' }
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
      subcategoria: item.subcategoria || '',
      valorUnitario: item.valorUnitario || 0, 
      fornecedorId: item.fornecedorId, 
      statusSuprimento: item.statusSuprimento 
    }
  }
  loadFornecedores()
}

const dialogDetalhes = ref({
  show: false,
  requisicao: null,
  ocFomal: '',
  dataPrevisao: ''
})

const verDetalhesRequisicao = (req) => {
  dialogDetalhes.value = {
    show: true,
    requisicao: req,
    ocFomal: '',
    dataPrevisao: ''
  }
}

const vincularOC = async () => {
  if (!dialogDetalhes.value.ocFomal || !dialogDetalhes.value.dataPrevisao) return
  
  saving.value = true
  try {
    const response = await $fetch('/api/compras', {
      method: 'PUT',
      body: {
        id: dialogDetalhes.value.requisicao.id,
        numero: dialogDetalhes.value.ocFomal, // Substitui o número temporário REQ-xxx pelo real da OC
        status: 'PEDIDO_EMITIDO',
        dataPrevisaoEntrega: dialogDetalhes.value.dataPrevisao,
        dataCompra: new Date().toISOString()
      }
    })
    
    if (response) {
      showSnackbar('Ordem de Compra vinculada com sucesso!')
      dialogDetalhes.value.show = false
      await loadCompras()
    }
  } catch (error) {
    console.error('Erro ao vincular OC:', error)
    showSnackbar('Erro ao vincular OC', 'error')
  } finally {
    saving.value = false
  }
}

const viewDrawing = (url) => {
  window.open(url, '_blank')
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
