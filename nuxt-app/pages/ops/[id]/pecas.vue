<template>
  <div class="pa-4">
    <!-- Breadcrumbs -->
    <v-breadcrumbs :items="breadcrumbs" class="px-0 pt-0"></v-breadcrumbs>

    <!-- Header Standard -->
    <PageHeader 
      title="Lista de Peças (BOM)" 
      subtitle="Gestão de engenharia e materiais da OP"
      icon="mdi-cogs"
    >
      <template #actions>
          <v-btn
            color="white"
            variant="flat"
            prepend-icon="mdi-factory"
            @click="generateOS"
            :loading="loadingOS"
          >
            Gerar PCP
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            prepend-icon="mdi-cart-arrow-down"
            @click="liberarParaCompra"
            :loading="loadingRelease"
            :disabled="selected.length === 0"
          >
            Liberar p/ Compra ({{ selected.length }})
          </v-btn>
          <v-btn
            color="white"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="openAddPecaDialog"
          >
            Peça
          </v-btn>
          <v-btn
            color="white"
            variant="outlined"
            prepend-icon="mdi-file-excel"
            @click="triggerImport"
            :loading="loadingImport"
          >
            Importar
          </v-btn>
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept=".xlsx, .xls"
            @change="handleFileUpload"
          />
      </template>
    </PageHeader>

    <!-- Resumo do Estoque -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="text-center">
          <v-card-text>
            <div class="text-overline mb-1">Total de Peças</div>
            <div class="text-h4 font-weight-bold">{{ pecas.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="text-center" color="success">
          <v-card-text>
            <div class="text-overline mb-1">Disponíveis no Estoque</div>
            <div class="text-h4 font-weight-bold">{{ pecasDisponiveis }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabela de Peças -->
    <v-card variant="outlined">
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="pecas"
        :loading="loading"
        show-select
        hover
        no-data-text="Nenhuma peça cadastrada. Importe um arquivo Excel para começar."
      >
        <!-- Customização das Colunas -->
        <template v-slot:item.codigo="{ item }">
          <div class="font-weight-bold text-primary">{{ item.codigo }}</div>
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

        <template v-slot:item.categoria="{ item }">
          <v-chip
            :color="item.categoria === 'COMPRADO' ? 'blue' : 'orange'"
            size="x-small"
            variant="tonal"
            class="text-uppercase"
          >
            {{ item.categoria }}
          </v-chip>
        </template>

        <template v-slot:item.statusSuprimento="{ item }">
          <v-chip
            :color="getSuprimentoColor(item.statusSuprimento)"
            size="x-small"
            variant="flat"
            class="text-uppercase"
          >
            {{ item.statusSuprimento.replace('_', ' ') }}
          </v-chip>
        </template>

        <template v-slot:item.estoque="{ item }">
          <div class="d-flex align-center gap-2">
            <v-tooltip v-if="item.temNoEstoque" :text="`Disponível: ${item.saldoEstoque} no estoque`">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" color="success" size="x-small" variant="flat">
                  {{ item.saldoEstoque }} em estoque
                </v-chip>
              </template>
            </v-tooltip>
            <v-chip v-else color="grey-lighten-1" size="x-small" variant="outlined">
              Sem saldo
            </v-chip>

            <v-btn
              v-if="item.temNoEstoque && item.status !== 'EM_ESTOQUE' && item.status !== 'CONCLUIDA'"
              size="x-small"
              color="success"
              variant="elevated"
              @click="reservarEstoque(item)"
            >
              Reservar
            </v-btn>
          </div>
        </template>

        <template v-slot:item.desenho="{ item }">
          <div class="d-flex flex-column align-center">
            <!-- Lista de Anexos Existentes -->
            <div v-if="item.anexos && item.anexos.length > 0" class="d-flex flex-wrap gap-1 mb-1 justify-center">
              <v-chip
                v-for="anexo in item.anexos"
                :key="anexo.id"
                size="x-small"
                color="info"
                variant="tonal"
                @click="viewDrawing(anexo.url)"
                :title="anexo.nome"
                class="px-2"
                style="max-width: 120px;"
              >
                <v-icon start size="12">mdi-file-pdf-box</v-icon>
                <span class="text-truncate" style="font-size: 10px;">{{ truncateName(anexo.nome) }}</span>
              </v-chip>
            </div>
            
            <v-btn
              icon="mdi-plus-circle"
              variant="tonal"
              size="small"
              color="primary"
              title="Anexar Desenho"
              @click="triggerDrawingUpload(item)"
            >
              <v-icon>mdi-plus-circle</v-icon>
            </v-btn>
          </div>
        </template>

        <template v-slot:item.processos="{ item }">
          <div class="d-flex justify-center">
            <v-btn
              icon="mdi-format-list-bulleted-type"
              variant="tonal"
              size="small"
              color="primary"
              title="Gerenciar Processos"
              @click="openProcessos(item)"
            >
              <v-badge
                v-if="item._count?.processos"
                color="error"
                :content="item._count.processos"
                floating
              >
                <v-icon icon="mdi-format-list-bulleted-type"></v-icon>
              </v-badge>
              <v-icon v-else icon="mdi-format-list-bulleted-type"></v-icon>
            </v-btn>
          </div>
        </template>

        <template v-slot:item.acoes="{ item }">
          <div class="d-flex gap-1 align-center">
            <!-- Botão de Desenho/Anexos (Consolidador) -->
            <v-menu location="bottom end">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-file-document-outline"
                  variant="text"
                  size="small"
                  :color="item.anexos?.length ? 'info' : 'grey'"
                  v-bind="props"
                  title="Desenhos e Anexos"
                >
                  <v-badge
                    v-if="item.anexos?.length"
                    color="info"
                    :content="item.anexos.length"
                    dot
                    floating
                  >
                    <v-icon icon="mdi-file-document-outline"></v-icon>
                  </v-badge>
                </v-btn>
              </template>
              <v-list density="compact" width="200">
                <v-list-item v-if="!item.anexos?.length" title="Sem anexos"></v-list-item>
                <v-list-item
                  v-for="anexo in item.anexos"
                  :key="anexo.id"
                  @click="viewDrawing(anexo.url)"
                >
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-file-pdf-box</v-icon>
                  </template>
                  <v-list-item-title>{{ truncateName(anexo.nome) }}</v-list-item-title>
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="x-small"
                      color="error"
                      @click.stop="deleteAttachment(anexo.id)"
                    ></v-btn>
                  </template>
                </v-list-item>
                <v-divider v-if="item.anexos?.length"></v-divider>
                <v-list-item
                  prepend-icon="mdi-plus"
                  title="Adicionar Anexo"
                  @click="triggerDrawingUpload(item)"
                ></v-list-item>
              </v-list>
            </v-menu>

            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="grey-darken-1"
              title="Editar Peça"
              @click="openEditPeca(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              title="Excluir Peça"
              @click="confirmDeletePeca(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo de Inserção/Edição de Peça -->
    <v-dialog v-model="dialogPeca.show" max-width="500px">
      <v-card>
        <v-card-title>{{ dialogPeca.isEdit ? 'Editar Peça' : 'Adicionar Peça Manualmente' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="dialogPeca.data.codigo" label="Código" variant="outlined"></v-text-field>
          <v-text-field v-model="dialogPeca.data.descricao" label="Descrição" variant="outlined"></v-text-field>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model.number="dialogPeca.data.quantidade" label="Quantidade" type="number" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="dialogPeca.data.material" label="Material" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="dialogPeca.data.categoria"
                :items="['FABRICADO', 'COMPRADO']"
                label="Categoria"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="dialogPeca.data.statusSuprimento"
                :items="['NAO_SOLICITADO', 'EM_ORCAMENTO', 'COMPRADO', 'RECEBIDO']"
                label="Status Suprimento"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-combobox
                v-model="dialogPeca.data.subcategoria"
                :items="categoriasDisponiveis"
                label="Subcategoria (Filtro de Fornecedor)"
                variant="outlined"
                density="compact"
                hint="Filtrado pelas categorias oficiais de fornecedores"
                persistent-hint
              ></v-combobox>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="8">
              <v-select
                v-model="dialogPeca.data.fornecedorId"
                :items="filteredFornecedores"
                item-title="nome"
                item-value="id"
                label="Fornecedor"
                variant="outlined"
                density="compact"
                clearable
              ></v-select>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="dialogPeca.data.valorUnitario"
                label="Vlr. Unit."
                type="number"
                prefix="R$"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogPeca.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingPeca" @click="savePecaManual">Salvar Peça</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Processos -->
    <v-dialog v-model="dialogProcessos.show" max-width="700px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h5">Processos da Peça: {{ dialogProcessos.peca?.codigo }}</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogProcessos.show = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">{{ dialogProcessos.peca?.descricao }}</p>
          
          <v-list density="compact">
            <v-list-item v-for="(proc, index) in dialogProcessos.items" :key="index" class="pa-0 mb-2">
              <v-row dense align="center">
                <v-col cols="5">
                  <v-combobox
                    v-model="proc.nome"
                    :items="processosDisponiveis"
                    label="Nome do Processo"
                    placeholder="Selecione ou digite"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-combobox>
                </v-col>
                <v-col cols="3">
                  <v-select
                    v-model="proc.status"
                    :items="['NAO_INICIADO', 'EM_PRODUCAO', 'CONCLUIDA']"
                    label="Status"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
                <v-col cols="3">
                  <v-select
                    v-model="proc.fornecedorId"
                    :items="fornecedores"
                    item-title="nome"
                    item-value="id"
                    label="Fornecedor / Setor"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="1" class="text-right">
                  <v-btn icon="mdi-delete" color="error" variant="text" size="small" @click="removeProcess(index)"></v-btn>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>

          <v-btn
            prepend-icon="mdi-plus"
            variant="text"
            color="primary"
            class="mt-2"
            @click="addProcess"
          >
            Adicionar Processo
          </v-btn>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogProcessos.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingProcessos" @click="saveProcessos">Salvar Processos</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Hidden File Input for Drawing -->
    <input
      type="file"
      ref="drawingInput"
      style="display: none"
      accept=".pdf,.dwg,.dxf,image/*"
      @change="handleDrawingUpload"
    />

    <!-- Feedback de Importação -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
const route = useRoute()
const opId = route.params.id

const pecas = ref([])
const fornecedores = ref([])
const processosDisponiveis = ref([])
const categoriasDisponiveis = ref([])
const loading = ref(false)
const loadingImport = ref(false)
const savingProcessos = ref(false)
const fileInput = ref(null)
const drawingInput = ref(null)
const selectedPecaForDrawing = ref(null)
const loadingOS = ref(false)
const loadingRelease = ref(false)
const selected = ref([])

const loadFornecedores = async () => {
  try {
    fornecedores.value = await $fetch('/api/fornecedores')
  } catch (error) {
    console.error('Erro ao carregar fornecedores')
  }
}

const dialogProcessos = ref({
  show: false,
  peca: null,
  items: []
})

const dialogPeca = ref({
  show: false,
  isEdit: false,
  data: { 
    id: null, 
    codigo: '', 
    descricao: '', 
    quantidade: 1, 
    material: '',
    categoria: 'FABRICADO',
    subcategoria: '',
    statusSuprimento: 'NAO_SOLICITADO',
    valorUnitario: null,
    fornecedorId: null
  }
})

const filteredFornecedores = computed(() => {
  if (!dialogPeca.value.data.subcategoria) return fornecedores.value
  
  const sub = dialogPeca.value.data.subcategoria.toLowerCase()
  return fornecedores.value.filter(f => 
    f.categorias && f.categorias.some(c => c.toLowerCase() === sub)
  )
})

const savingPeca = ref(false)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const breadcrumbs = [
  { title: 'Dashboard', disabled: false, to: '/' },
  { title: 'OPs', disabled: false, to: '/ops' },
  { title: `OP #${opId}`, disabled: false, to: `/ops/${opId}` },
  { title: 'Peças', disabled: true }
]

const headers = [
  { title: 'Código', key: 'codigo', sortable: true },
  { title: 'Descrição', key: 'descricao', sortable: true },
  { title: 'Categoria', key: 'categoria', align: 'center' },
  { title: 'Desenho', key: 'desenho', align: 'center', sortable: false },
  { title: 'Processos', key: 'processos', align: 'center', sortable: false },
  { title: 'Suprimento', key: 'statusSuprimento', align: 'center' },
  { title: 'Qtd', key: 'quantidade', align: 'end' },
  { title: 'Material', key: 'material' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const pecasDisponiveis = computed(() => {
  return pecas.value.filter(p => p.temNoEstoque).length
})

const loadSettings = async () => {
  try {
    const [ppec, cforn] = await Promise.all([
      $fetch('/api/configuracoes/processos-peca'),
      $fetch('/api/configuracoes/categorias-fornecedor')
    ])
    processosDisponiveis.value = ppec.map(p => p.nome)
    categoriasDisponiveis.value = cforn.map(c => c.nome)
  } catch (error) {
    console.error('Erro ao carregar configurações de padronização')
  }
}

const loadPecas = async () => {
  loading.value = true
  try {
    const data = await $fetch(`/api/ops/${opId}/pecas`)
    pecas.value = data
  } catch (error) {
    showSnackbar('Erro ao carregar peças', 'error')
  } finally {
    loading.value = false
  }
}

const triggerImport = () => {
  fileInput.value.click()
}

const openAddPecaDialog = () => {
  dialogPeca.value = {
    show: true,
    isEdit: false,
    data: { 
      id: null, 
      codigo: '', 
      descricao: '', 
      quantidade: 1, 
      material: '',
      categoria: 'FABRICADO',
      statusSuprimento: 'NAO_SOLICITADO',
      valorUnitario: null,
      fornecedorId: null
    }
  }
}

const openEditPeca = (peca) => {
  dialogPeca.value = {
    show: true,
    isEdit: true,
    data: { ...peca }
  }
}

const savePecaManual = async () => {
  savingPeca.value = true
  try {
    const method = dialogPeca.value.isEdit ? 'PATCH' : 'POST'
    const url = dialogPeca.value.isEdit 
      ? `/api/pecas/${dialogPeca.value.data.id}` 
      : `/api/ops/${opId}/pecas`

    await $fetch(url, {
      method,
      body: dialogPeca.value.data
    })
    
    showSnackbar(dialogPeca.value.isEdit ? 'Peça atualizada com sucesso!' : 'Peça inserida com sucesso!')
    dialogPeca.value.show = false
    await loadPecas()
  } catch (error) {
    const message = error.data?.message || error.data?.statusMessage || 'Erro ao salvar dados da peça'
    showSnackbar(message, 'error')
  } finally {
    savingPeca.value = false
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  loadingImport.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await $fetch(`/api/ops/${opId}/pecas/import`, {
      method: 'POST',
      body: formData
    })
    
    showSnackbar(`Importação concluída: ${response.importedCount} itens carregados.`)
    await loadPecas()
  } catch (error) {
    showSnackbar('Erro ao importar arquivo Excel', 'error')
  } finally {
    loadingImport.value = false
    event.target.value = '' // Limpar input
  }
}

const generateOS = async () => {
  loadingOS.value = true
  try {
    const result = await $fetch(`/api/ops/${opId}/pcp/generate-os`, { method: 'POST' })
    if (result.success) {
      showSnackbar(result.message || 'Ordens de serviço processadas com sucesso!')
    }
  } catch (error) {
    console.error('Erro ao gerar OS:', error)
    showSnackbar('Erro ao gerar Ordens de Serviço. Certifique-se de que as peças possuem processos cadastrados.', 'error')
  } finally {
    loadingOS.value = false
  }
}

const openProcessos = async (peca) => {
  dialogProcessos.value = {
    show: true,
    peca,
    items: []
  }
  
  try {
    const data = await $fetch(`/api/pecas/${peca.id}/processos`)
    dialogProcessos.value.items = data.map(p => ({ ...p }))
  } catch (error) {
    showSnackbar('Erro ao carregar processos da peça', 'error')
  }
}

const addProcess = () => {
  dialogProcessos.value.items.push({
    nome: '',
    status: 'NAO_INICIADO',
    fornecedorId: null
  })
}

const removeProcess = (index) => {
  dialogProcessos.value.items.splice(index, 1)
}

const saveProcessos = async () => {
  savingProcessos.value = true
  try {
    await $fetch(`/api/pecas/${dialogProcessos.value.peca.id}/processos`, {
      method: 'POST',
      body: { processos: dialogProcessos.value.items }
    })
    showSnackbar('Processos salvos com sucesso!')
    dialogProcessos.value.show = false
    await loadPecas()
    await generateOS()
  } catch (error) {
    showSnackbar('Erro ao salvar processos', 'error')
  } finally {
    savingProcessos.value = false
  }
}

const getStatusColor = (status) => {
  const colors = {
    NAO_INICIADA: 'grey',
    EM_PRODUCAO: 'blue',
    CANCELADA: 'red',
    CONCLUIDA: 'success',
    EM_ESTOQUE: 'green-darken-2'
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

const triggerDrawingUpload = (peca) => {
  selectedPecaForDrawing.value = peca
  drawingInput.value.click()
}

const handleDrawingUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !selectedPecaForDrawing.value) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    await $fetch(`/api/pecas/${selectedPecaForDrawing.value.id}/desenho`, {
      method: 'POST',
      body: formData
    })
    showSnackbar('Desenho enviado com sucesso!')
    await loadPecas()
  } catch (error) {
    showSnackbar('Erro ao enviar desenho', 'error')
  } finally {
    event.target.value = ''
  }
}



const liberarParaCompra = async () => {
  if (selected.value.length === 0) return
  
  loadingRelease.value = true
  try {
    const result = await $fetch('/api/ops/liberar-itens-bom', {
      method: 'POST',
      body: { pecaIds: selected.value }
    })
    
    if (result.success) {
      showSnackbar(`${selected.value.length} itens liberados para compra!`)
      selected.value = []
      await loadPecas()
    }
  } catch (error) {
    console.error('Erro ao liberar itens:', error)
    showSnackbar('Erro ao liberar itens para compra', 'error')
  } finally {
    loadingRelease.value = false
  }
}

const reservarEstoque = async (peca) => {
  if (!confirm(`Deseja reservar ${peca.quantidade} unidades de "${peca.codigo}" do estoque?`)) return
  
  loading.value = true
  try {
    await $fetch(`/api/pecas/${peca.id}/reservar`, { method: 'POST' })
    showSnackbar('Reserva realizada com sucesso!')
    await loadPecas()
  } catch (error) {
    showSnackbar(error.data?.statusMessage || 'Erro ao realizar reserva', 'error')
  } finally {
    loading.value = false
  }
}

const confirmDeletePeca = async (peca) => {
  if (!confirm(`Tem certeza que deseja excluir a peça "${peca.codigo}"? Todos os processos e anexos vinculados serão removidos.`)) return
  
  loading.value = true
  try {
    await $fetch(`/api/pecas/${peca.id}`, { method: 'DELETE' })
    showSnackbar('Peça excluída com sucesso!')
    await loadPecas()
  } catch (error) {
    showSnackbar('Erro ao excluir peça', 'error')
  } finally {
    loading.value = false
  }
}

const viewDrawing = (url) => {
  window.open(url, '_blank')
}

const deleteAttachment = async (anexoId) => {
  if (!confirm('Tem certeza que deseja remover este anexo?')) return
  
  try {
    await $fetch(`/api/pecas/anexos/${anexoId}`, { method: 'DELETE' })
    showSnackbar('Anexo removido com sucesso!')
    await loadPecas()
  } catch (error) {
    showSnackbar('Erro ao remover anexo', 'error')
  }
}

const truncateName = (name) => {
  if (!name) return ''
  if (name.length <= 15) return name
  return name.substring(0, 12) + '...'
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  loadPecas()
  loadFornecedores()
  loadSettings()
})
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
