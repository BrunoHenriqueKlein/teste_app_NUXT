<template>
  <div class="pa-4">
    <!-- Header -->
    <v-card color="secondary" variant="flat" class="mb-4">
      <v-card-text class="d-flex justify-space-between align-center text-white">
        <div>
          <h1 class="text-h4 font-weight-bold">
            <v-icon icon="mdi-factory" class="mr-2"></v-icon>
            Painel PCP / PPCP
          </h1>
          <p class="text-body-1 mt-1">Geração e controle de Ordens de Serviço (OS)</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Filtros -->
    <v-card variant="outlined" class="mb-4">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.tipo"
              :items="tiposProcesso"
              label="Tipo de Processo (OS)"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              @update:model-value="loadOrdens"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.status"
              :items="['NAO_INICIADO', 'EM_PRODUCAO', 'CONCLUIDA']"
              label="Status"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              @update:model-value="loadOrdens"
            ></v-select>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-refresh"
              @click="loadOrdens"
            >
              Atualizar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabela de OS -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="ordens"
        :loading="loading"
        hover
        no-data-text="Nenhuma Ordem de Serviço encontrada."
      >
        <template v-slot:item.numero="{ item }">
          <div class="font-weight-bold">{{ item.numero }}</div>
        </template>

        <template v-slot:item.op="{ item }">
          <div>
            <span class="text-primary font-weight-bold">#{{ item.op.numeroOP }}</span> - {{ item.op.cliente }}
          </div>
          <div class="text-caption text-grey">{{ item.op.descricaoMaquina }}</div>
        </template>

        <template v-slot:item.tipo="{ item }">
          <v-chip color="secondary" size="small" variant="outlined">{{ item.tipo }}</v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ item.status.replace('_', ' ') }}
          </v-chip>
        </template>

        <template v-slot:item.itens="{ item }">
          {{ item._count?.itens }} peças
        </template>

        <template v-slot:item.acoes="{ item }">
          <v-btn
            icon="mdi-printer"
            variant="text"
            size="small"
            color="primary"
            title="Imprimir OS"
            @click="printOS(item)"
          ></v-btn>
          <v-btn
            icon="mdi-email-send"
            variant="text"
            size="small"
            color="success"
            title="Solicitar Orçamento"
            @click="openBudgetDialog(item)"
          ></v-btn>
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            color="grey-darken-1"
            title="Ver Detalhes"
            @click="viewOS(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo de Solicitação de Orçamento -->
    <v-dialog v-model="dialogBudget.show" max-width="500px">
      <v-card>
        <v-card-title class="pa-4 bg-success text-white">Solicitar Orçamento</v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4">Selecione o fornecedor para enviar a solicitação da <strong>OS {{ dialogBudget.os?.numero }}</strong>.</p>
          <v-select
            v-model="dialogBudget.fornecedorId"
            :items="suggestedFornecedores"
            item-title="nome"
            item-value="id"
            label="Escolha o Fornecedor"
            variant="outlined"
            placeholder="Selecione um fornecedor"
            :rules="[v => !!v || 'Campo obrigatório']"
            :hint="dialogBudget.showAll ? 'Mostrando todos os fornecedores' : 'Mostrando apenas fornecedores para ' + dialogBudget.os?.tipo"
            persistent-hint
          >
            <template v-slot:append-item v-if="!dialogBudget.showAll">
              <v-divider class="mb-2"></v-divider>
              <v-btn block variant="text" size="small" @click="dialogBudget.showAll = true">
                Ver todos os fornecedores
              </v-btn>
            </template>
          </v-select>
          <div v-if="selectedSupplierEmail" class="text-caption text-grey mt-1">
            <v-icon size="x-small" icon="mdi-email"></v-icon> {{ selectedSupplierEmail }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogBudget.show = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" :loading="sendingBudget" :disabled="!dialogBudget.fornecedorId" @click="sendBudgetEmail">
            Enviar por E-mail
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Visualização/Impressão -->
    <v-dialog v-model="dialogOS.show" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="primary">
          <v-btn icon="mdi-close" @click="dialogOS.show = false"></v-btn>
          <v-toolbar-title>Visualização da Ordem de Serviço</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn prepend-icon="mdi-printer" variant="flat" color="white" @click="doPrint">
            Imprimir Agora (PDF)
          </v-btn>
        </v-toolbar>

        <v-card-text id="print-area" class="pa-8">
          <!-- Cabeçalho OS (Layout Impressão) -->
          <div class="os-header">
            <div class="d-flex justify-space-between mb-6">
              <div>
                <h2 class="text-h4 font-weight-black">{{ dialogOS.data?.numero }}</h2>
                <div class="text-h6 text-secondary">{{ dialogOS.data?.tipo }}</div>
              </div>
              <div class="text-right">
                <div>Data Emissão: {{ formatDate(dialogOS.data?.dataEmissao) }}</div>
                <div v-if="dialogOS.data?.op">OP: #{{ dialogOS.data.op.numeroOP }} - {{ dialogOS.data.op.cliente }}</div>
              </div>
            </div>
            
            <v-divider class="mb-4"></v-divider>

            <h3 class="text-h6 mb-4">Lista de Peças e Quantidades</h3>
            <table class="os-table w-100">
              <thead>
                <tr>
                  <th class="text-left border-bottom pa-2">Código</th>
                  <th class="text-left border-bottom pa-2">Descrição</th>
                  <th class="text-left border-bottom pa-2">Etapa / Processo</th>
                  <th class="text-left border-bottom pa-2">Ref / Fornecedor</th>
                  <th class="text-right border-bottom pa-2">Tempo</th>
                  <th class="text-right border-bottom pa-2">Qtd</th>
                  <th class="text-left border-bottom pa-2">Material</th>
                  <th class="text-left border-bottom pa-2">Check (V)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in dialogOS.data?.itens" :key="item.id">
                  <td class="pa-2 border-bottom font-weight-bold">{{ item.peca?.codigo }}</td>
                  <td class="pa-2 border-bottom">{{ item.peca?.descricao }}</td>
                  <td class="pa-2 border-bottom">{{ item.nome }}</td>
                  <td class="pa-2 border-bottom">{{ item.fornecedorRef?.nome || '-' }}</td>
                  <td class="pa-2 border-bottom text-right">{{ formatTime(item.tempoEstimado) }}</td>
                  <td class="pa-2 border-bottom text-right">{{ item.peca?.quantidade }}</td>
                  <td class="pa-2 border-bottom">{{ item.peca?.material }}</td>
                  <td class="pa-2 border-bottom" style="width: 50px;">
                    <div style="border: 1px solid #ccc; width: 18px; height: 18px; margin: 0 auto;"></div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="mt-8">
              <div class="text-overline">Observações da Oficina:</div>
              <div style="border: 1px solid #eee; height: 100px; width: 100%;" class="pa-2"></div>
            </div>

            <div class="mt-12 d-flex justify-space-between">
              <div style="border-top: 1px solid #000; width: 200px; text-align: center;" class="pt-2">Responsável PCP</div>
              <div style="border-top: 1px solid #000; width: 200px; text-align: center;" class="pt-2">Encarregado Setor</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const route = useRoute()
const ordens = ref([])
const loading = ref(false)
const types = ref([])
const filters = ref({
  tipo: null,
  status: null
})

const dialogBudget = ref({
  show: false,
  os: null,
  fornecedorId: null
})

const dialogOS = ref({
  show: false,
  data: null
})

const fornecedores = ref([])
const sendingBudget = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'OS Número', key: 'numero', sortable: true },
  { title: 'OP / Cliente', key: 'op', sortable: true },
  { title: 'Processo', key: 'tipo', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Volume', key: 'itens', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const selectedSupplierEmail = computed(() => {
  const f = fornecedores.value.find(forn => forn.id === dialogBudget.value.fornecedorId)
  return f?.email || ''
})

const suggestedFornecedores = computed(() => {
  if (dialogBudget.value.showAll || !dialogBudget.value.os) return fornecedores.value
  
  const type = dialogBudget.value.os.tipo.toLowerCase()
  return fornecedores.value.filter(f => {
    return f.categorias?.some(cat => cat.toLowerCase() === type)
  })
})

const tiposProcesso = ['USINAGEM', 'PINTURA', 'SOLDA', 'CALDEIRARIA', 'MONTAGEM']

const loadOrdens = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.tipo) params.tipo = filters.value.tipo
    if (filters.value.status) params.status = filters.value.status
    if (route.query.opId) params.opId = route.query.opId
    
    // Usar params diretamente no $fetch para evitar problemas de query string malformada
    ordens.value = await $fetch('/api/pcp/ordens-servico', {
      params
    })
  } catch (error) {
    console.error('Erro detalhado no carregamento de OS:', error)
    const message = error.data?.message || error.data?.statusMessage || error.message || 'Erro de conexão/servidor'
    showSnackbar(`Erro: ${message}`, 'error')
  } finally {
    loading.value = false
  }
}

const loadFornecedores = async () => {
  try {
    fornecedores.value = await $fetch('/api/fornecedores')
  } catch (error) {
    console.error('Erro ao buscar fornecedores')
  }
}

const openBudgetDialog = (os) => {
  dialogBudget.value = {
    show: true,
    os,
    fornecedorId: null,
    showAll: false
  }
}

const sendBudgetEmail = async () => {
  sendingBudget.value = true
  try {
    await $fetch('/api/pcp/budget-email', {
      method: 'POST',
      body: {
        osId: dialogBudget.value.os.id,
        fornecedorId: dialogBudget.value.fornecedorId
      }
    })
    showSnackbar('Solicitação de orçamento enviada com sucesso!')
    dialogBudget.value.show = false
  } catch (error) {
    showSnackbar('Erro ao enviar e-mail: ' + (error.data?.statusMessage || error.message), 'error')
  } finally {
    sendingBudget.value = false
  }
}

const viewOS = async (item) => {
  try {
    dialogOS.value.data = await $fetch(`/api/pcp/ordens-servico/${item.id}`)
    dialogOS.value.show = true
  } catch (error) {
    showSnackbar('Erro ao carregar detalhes da OS', 'error')
  }
}

const printOS = (item) => {
  viewOS(item)
}

const doPrint = () => {
  window.print()
}

const getStatusColor = (status) => {
  const colors = {
    NAO_INICIADO: 'grey',
    EM_PRODUCAO: 'blue',
    CONCLUIDA: 'success'
  }
  return colors[status] || 'grey'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

const formatTime = (minutes) => {
  if (!minutes) return '-'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  loadOrdens()
  loadFornecedores()
})
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #eee;
}
.os-table {
  border-collapse: collapse;
}

@media print {
  body * {
    visibility: hidden;
  }
  #print-area, #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .v-toolbar, .v-btn {
    display: none !important;
  }
}
</style>
