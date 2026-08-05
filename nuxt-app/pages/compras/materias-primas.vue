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
          Solicitar Orçamento ({{ selected.length }})
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-package-variant-closed"
          :disabled="selected.length === 0"
          @click="atenderEstoque"
        >
          Reservar Lote do Estoque ({{ selected.length }})
        </v-btn>
      </template>
    </PageHeader>

    <v-tabs v-model="activeTab" color="primary" class="mt-4">
      <v-tab value="bom">Necessidades (BOM)</v-tab>
      <v-tab value="cotacoes">Cotações ({{ itensCotacao.length }})</v-tab>
      <v-tab value="estoque">Estoque Físico</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="bom">
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
        :items="itemsComGrupo"
        :search="search"
        :loading="loading"
        :group-by="groupBy"
        show-select
        hover
        density="comfortable"
      >
        <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
          <tr style="background-color: rgba(0,0,0,0.03);">
            <td :colspan="columns.length">
              <v-btn
                variant="text"
                density="compact"
                :icon="isGroupOpen(item) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                @click="toggleGroup(item)"
              ></v-btn>
              <strong class="ml-2 text-primary">{{ item.value }}</strong>
              <v-chip class="ml-4" size="small" color="primary" variant="flat">
                Necessidade: {{ somarComprimento(item.items) }} mm
              </v-chip>
              <v-chip class="ml-2" size="small" color="blue-grey" variant="flat">
                {{ somarQtd(item.items) }} peças
              </v-chip>
              <v-chip class="ml-4" size="small" color="teal" variant="outlined" v-if="getEstoque(item.value) !== null">
                Estoque: {{ getEstoque(item.value) }} mm
              </v-chip>
              <v-chip class="ml-2" size="small" :color="getSaldoColor(item.value, item.items)" variant="flat" v-if="getEstoque(item.value) !== null">
                Faltam: {{ getFalta(item.value, item.items) }} mm
              </v-chip>
            </td>
          </tr>
        </template>
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
        <template v-slot:item.actions="{ item }">
          <v-btn 
            v-if="item.statusSuprimento !== 'ATENDIDO_ESTOQUE'"
            size="small" 
            color="info" 
            variant="outlined" 
            @click="abrirReservaEstoque(item)" 
          >Reservar do Estoque</v-btn>
          <v-btn 
            v-else
            size="small" 
            color="success" 
            variant="flat" 
            disabled
          >Reservado do Estoque</v-btn>
        </template>
      </v-data-table>
    </v-card>
      </v-window-item>

      <v-window-item value="cotacoes">
        <v-card variant="outlined" class="mt-4">
          <v-data-table
            v-model="selectedCotacao"
            :headers="headers"
            :items="itensCotacao"
            :loading="loading"
            :group-by="groupBy"
            show-select
            hover
            density="comfortable"
          >
            <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
              <tr style="background-color: rgba(0,0,0,0.03);">
                <td :colspan="columns.length">
                  <v-btn
                    variant="text"
                    density="compact"
                    :icon="isGroupOpen(item) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                    @click="toggleGroup(item)"
                  ></v-btn>
                  <strong class="ml-2 text-primary">{{ item.value }}</strong>
                  <v-chip class="ml-4" size="small" color="primary" variant="flat">
                    Necessidade Total: {{ somarComprimento(item.items) }} mm
                  </v-chip>
                  <v-btn class="ml-4" size="small" color="secondary" @click="abrirLancamentoCompra(item.value, item.items)">
                    Inserir Valores / Lançar Compra
                  </v-btn>
                </td>
              </tr>
            </template>
            <template v-slot:item.op.numeroOP="{ item }">
              <v-chip size="small" color="primary" variant="tonal">{{ item.op?.numeroOP }}</v-chip>
            </template>
            <template v-slot:item.codigo="{ item }">
              <div class="font-weight-bold">{{ item.codigo }}</div>
              <div class="text-caption text-grey text-truncate" style="max-width: 200px;">{{ item.descricao }}</div>
            </template>
            <template v-slot:item.statusSuprimento="{ item }">
              <v-chip :color="getStatusColor(item.statusSuprimento)" size="small">{{ formatStatus(item.statusSuprimento) }}</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn 
                v-if="item.statusSuprimento !== 'ATENDIDO_ESTOQUE'"
                size="small" 
                color="info" 
                variant="outlined" 
                @click="abrirReservaEstoque(item)" 
              >Reservar do Estoque</v-btn>
              <v-btn 
                v-else
                size="small" 
                color="success" 
                variant="flat" 
                disabled
              >Reservado do Estoque</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="estoque">
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="d-flex align-center py-3">
            <v-text-field
              v-model="searchEstoque"
              append-inner-icon="mdi-magnify"
              label="Buscar no estoque..."
              single-line
              hide-details
              variant="outlined"
              density="compact"
              style="max-width: 400px"
            ></v-text-field>
            <v-spacer></v-spacer>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="dialogAddEstoque = true">
              Registrar Entrada
            </v-btn>
          </v-card-title>
          
          <v-data-table
            :headers="headersEstoque"
            :items="estoqueFisico"
            :search="searchEstoque"
            :loading="loading"
            hover
            density="comfortable"
          >
            <template v-slot:item.quantidade="{ item }">
              <strong>{{ item.quantidade }} mm</strong>
            </template>
            <template v-slot:item.valorUnitario="{ item }">
              {{ item.valorUnitario ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitario) : '-' }}
            </template>
            <template v-slot:item.valorTotal="{ item }">
              <strong class="text-success">{{ item.valorUnitario && item.quantidade ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.quantidade / 6000) * item.valorUnitario) : '-' }}</strong>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn size="small" color="warning" variant="text" icon="mdi-minus" @click="abrirAjuste(item, 'deduct')" title="Diminuir Saldo"></v-btn>
              <v-btn size="small" color="success" variant="text" icon="mdi-plus" @click="abrirAjuste(item, 'add')" title="Aumentar Saldo"></v-btn>
              <v-btn size="small" color="primary" variant="text" icon="mdi-pencil" @click="abrirAjuste(item, 'edit')" title="Editar Nome/Liga"></v-btn>
              <v-btn size="small" color="error" variant="text" icon="mdi-delete" @click="excluirEstoque(item)" title="Excluir"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

    <v-dialog v-model="dialogAddEstoque" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ adjustAction === 'add' ? 'Adicionar Estoque' : 
               adjustAction === 'deduct' ? 'Baixar Estoque' : 
               adjustAction === 'edit' ? 'Editar Item' : 'Registrar' }}
          </span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formEstoque.tipoMaterial" label="Perfil / Tipo (Ex: Tubo Quadrado 50x50x2)" :readonly="formEstoque.isEdit && adjustAction !== 'edit'"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="formEstoque.material" label="Liga / Material (Ex: AISI 304)" :readonly="formEstoque.isEdit && adjustAction !== 'edit'"></v-text-field>
            </v-col>
            <v-col cols="12" v-if="adjustAction !== 'edit'">
              <v-text-field v-model="formEstoque.quantidade" label="Quantidade (mm)" type="number"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="formEstoque.valorUnitario" label="Valor por Barra 6000mm (R$)" type="number" prefix="R$"></v-text-field>
            </v-col>
            <v-col cols="12" md="6" v-if="formEstoque.quantidade && formEstoque.valorUnitario && adjustAction !== 'edit'">
              <v-text-field 
                :model-value="new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((formEstoque.quantidade / 6000) * formEstoque.valorUnitario)" 
                label="Valor Total (Movimentação)" 
                readonly 
                variant="outlined" 
                bg-color="grey-lighten-4"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialogAddEstoque = false">Cancelar</v-btn>
          <v-btn color="primary" @click="salvarEstoque" :loading="loadingEstoque">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Lançar Compra -->
    <v-dialog v-model="dialogCompra" max-width="600px">
      <v-card>
        <v-card-title class="bg-secondary text-white pa-4">
          Lançar Compra / Orçamento
          <div class="text-subtitle-2 font-weight-regular">{{ compraForm.materialInfo }}</div>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                v-model="compraForm.fornecedorId"
                :items="fornecedores"
                item-title="nome"
                item-value="id"
                label="Fornecedor"
                variant="outlined"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="compraForm.tipoFornecimento"
                :items="tiposFornecimento"
                label="Tipo de Fornecimento"
                variant="outlined"
              ></v-select>
            </v-col>
            
            <v-col cols="12" v-if="compraForm.tipoFornecimento === 'BARRA_INTEIRA'">
              <v-text-field
                v-model="compraForm.valor"
                label="Preço por Barra Padrão (6000mm) (R$)"
                type="number"
                prefix="R$"
                variant="outlined"
                hint="O custo será rateado por milímetro nas peças da OP."
                persistent-hint
              ></v-text-field>
            </v-col>
            <v-col cols="12" v-if="compraForm.tipoFornecimento === 'FRACIONADO'">
              <v-text-field
                v-model="compraForm.valor"
                label="Preço Total do Pedaço (R$)"
                type="number"
                prefix="R$"
                variant="outlined"
                hint="O custo total será rateado proporcionalmente às peças desta seleção."
                persistent-hint
              ></v-text-field>
            </v-col>
            <v-col cols="12" v-if="compraForm.tipoFornecimento === 'MEDIDA_INDIVIDUAL'">
              <v-text-field
                v-model="compraForm.valor"
                label="Preço Unitário (por peça cortada) (R$)"
                type="number"
                prefix="R$"
                variant="outlined"
                hint="Este custo será aplicado integralmente em cada peça, sem gerar sobras."
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogCompra = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" :loading="loadingCompra" @click="salvarCompra">Confirmar Compra</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogReservaEstoque" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white">Atender com Estoque Físico</v-card-title>
        <v-card-text class="pt-4">
          <div class="mb-4">
            <strong>Peça(s):</strong> {{ pecasParaReservaLote.length === 1 ? pecasParaReservaLote[0].codigo : pecasParaReservaLote.length + ' peças selecionadas' }} <br/>
            <strong>Material Necessário:</strong> {{ pecasParaReservaLote[0]?.tipoMaterial }} | {{ pecasParaReservaLote[0]?.material }} <br/>
            <strong>Quantidade Total:</strong> {{ quantidadeTotalReserva }} mm
          </div>
          
          <v-divider class="mb-4"></v-divider>
          
          <v-select
            v-model="estoqueSelecionado"
            :items="estoqueCompativel"
            item-title="descricaoCompleta"
            item-value="id"
            label="Selecione o Lote de Estoque"
            variant="outlined"
            persistent-hint
            :hint="estoqueSelecionadoDetalhe ? `Saldo Disponível: ${estoqueSelecionadoDetalhe.quantidade} mm | Valor Base: R$ ${estoqueSelecionadoDetalhe.valorUnitario || 0}` : 'Escolha um item de estoque com saldo suficiente'"
          ></v-select>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogReservaEstoque = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" :loading="loadingReserva" :disabled="!estoqueSelecionado" @click="confirmarReservaEstoque">Reservar Material</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const items = ref([])
const estoqueFisico = ref([])
const fornecedores = ref([])
const selected = ref([])
const selectedCotacao = ref([])
const search = ref('')
const searchEstoque = ref('')
const loading = ref(false)
const loadingEstoque = ref(false)
const statusFilter = ref('NAO_SOLICITADO')
const groupBy = ref([{ key: 'materialAgrupado', order: 'asc' }])
const activeTab = ref('bom')

const dialogAddEstoque = ref(false)
const adjustAction = ref('add')

const dialogReservaEstoque = ref(false)
const loadingReserva = ref(false)
const pecasParaReservaLote = ref([])
const estoqueSelecionado = ref(null)

const quantidadeTotalReserva = computed(() => {
  return pecasParaReservaLote.value.reduce((acc, p) => acc + (p.comprimentoMaterial || 0) * (p.quantidade || 1), 0)
})

const estoqueCompativel = computed(() => {
  if (pecasParaReservaLote.value.length === 0) return []
  const pecaDesc = pecasParaReservaLote.value[0]?.tipoMaterial?.toLowerCase().trim() || ''
  
  return estoqueFisico.value
    .filter(e => e.quantidade > 0)
    .map(e => {
      const estDesc = e.descricao?.toLowerCase().trim() || ''
      const isMatch = pecaDesc === estDesc || pecaDesc.includes(estDesc) || estDesc.includes(pecaDesc)
      return {
        ...e,
        isMatch,
        descricaoCompleta: `${e.codigo} - ${e.descricao} (Saldo: ${e.quantidade} mm)`
      }
    })
    .sort((a, b) => (a.isMatch === b.isMatch ? 0 : a.isMatch ? -1 : 1))
})

const estoqueSelecionadoDetalhe = computed(() => {
  return estoqueFisico.value.find(e => e.id === estoqueSelecionado.value)
})
const formEstoque = ref({
  id: null,
  tipoMaterial: '',
  material: '',
  quantidade: '',
  valorUnitario: '',
  isEdit: false
})

const dialogCompra = ref(false)
const loadingCompra = ref(false)
const compraForm = ref({
  pecaIds: [],
  materialInfo: '',
  fornecedorId: null,
  tipoFornecimento: 'BARRA_INTEIRA',
  valor: ''
})
const tiposFornecimento = [
  { title: 'Barra Inteira (6000mm)', value: 'BARRA_INTEIRA' },
  { title: 'Fração / Pedaço Bruto', value: 'FRACIONADO' },
  { title: 'Medida Individual (Cortada)', value: 'MEDIDA_INDIVIDUAL' }
]

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
  { title: 'Ações', key: 'actions', align: 'center', sortable: false }
]

const headersEstoque = [
  { title: 'Código', key: 'codigo' },
  { title: 'Perfil / Tipo', key: 'descricao' },
  { title: 'Liga / Material', key: 'material' },
  { title: 'Saldo Atual (mm)', key: 'quantidade', align: 'end' },
  { title: 'Valor Barra 6m', key: 'valorUnitario', align: 'end' },
  { title: 'Valor Total', key: 'valorTotal', align: 'end' },
  { title: 'Ações', key: 'actions', align: 'center', sortable: false }
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
  let result = items.value.filter(i => i.statusSuprimento !== 'EM_ORCAMENTO' && i.statusSuprimento !== 'COMPRADO')
  
  if (statusFilter.value) {
    if (statusFilter.value === 'RECEBIDO') {
      result = result.filter(i => i.statusSuprimento === 'RECEBIDO' || i.statusSuprimento === 'ATENDIDO_ESTOQUE')
    } else {
      result = result.filter(i => i.statusSuprimento === statusFilter.value)
    }
  }
  
  return result
})

const itemsComGrupo = computed(() => {
  return filteredItems.value.map(i => ({
    ...i,
    materialAgrupado: `${i.tipoMaterial} | ${i.material || ''}`
  }))
})

const itensCotacao = computed(() => {
  let result = items.value.filter(i => i.statusSuprimento === 'EM_ORCAMENTO' || i.statusSuprimento === 'PARA_COTACAO')
  return result.map(i => ({
    ...i,
    materialAgrupado: `${i.tipoMaterial} | ${i.material || ''}`
  }))
})

const somarComprimento = (groupItems) => {
  return somarComprimentoRaw(groupItems).toLocaleString('pt-BR')
}

const somarComprimentoRaw = (groupItems) => {
  let total = 0
  groupItems.forEach(i => {
    const rawItem = i.raw || i
    const comp = parseFloat(rawItem.comprimentoMaterial)
    const qtd = parseInt(rawItem.quantidade)
    if (!isNaN(comp) && !isNaN(qtd)) {
      total += (comp * qtd)
    }
  })
  return total
}

const normalizeKey = (str) => {
  if (!str) return ''
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, ' ')
}

const getEstoque = (key) => {
  const normKey = normalizeKey(key)
  const item = estoqueFisico.value.find(e => normalizeKey(e.codigo) === normKey)
  return item ? item.quantidade : null
}

const getFalta = (key, groupItems) => {
  const necessidade = somarComprimentoRaw(groupItems)
  const estoque = getEstoque(key) || 0
  const diff = necessidade - estoque
  return diff > 0 ? diff.toLocaleString('pt-BR') : '0'
}

const getSaldoColor = (key, groupItems) => {
  const necessidade = somarComprimentoRaw(groupItems)
  const estoque = getEstoque(key) || 0
  return (estoque >= necessidade) ? 'success' : 'error'
}

const somarQtd = (groupItems) => {
  let total = 0
  groupItems.forEach(i => {
    const rawItem = i.raw || i
    const qtd = parseInt(rawItem.quantidade)
    if (!isNaN(qtd)) {
      total += qtd
    }
  })
  return total
}

const carregarDados = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/compras/materias-primas')
    items.value = data.pecas || []
    estoqueFisico.value = data.estoque || []
    
    if (fornecedores.value.length === 0) {
      try {
        const respForn = await $fetch('/api/fornecedores')
        fornecedores.value = respForn
      } catch (e) {
        console.error('Falha ao buscar fornecedores', e)
      }
    }
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
    
    // Se atendeu pelo estoque, precisamos abater as quantidades
    if (status === 'RECEBIDO') {
       for (const item of selected.value) {
           const qtdNecessaria = (parseFloat(item.comprimentoMaterial) || 0) * (parseInt(item.quantidade) || 1)
           if (qtdNecessaria > 0) {
               try {
                   await $fetch('/api/estoque/materias-primas', {
                       method: 'POST',
                       body: {
                           action: 'deduct',
                           tipoMaterial: item.tipoMaterial,
                           material: item.material,
                           quantidade: qtdNecessaria,
                           motivo: `Baixa automática para Peça ${item.codigo} OP ${item.op?.numeroOP}`
                       }
                   })
               } catch (e) { console.error('Falha ao deduzir do estoque', e) }
           }
       }
    }
    
    await carregarDados()
  } catch (error) {
    showSnackbar('Erro ao atualizar status', 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const solicitarCompra = () => {
  atualizarStatusLote('EM_ORCAMENTO')
}

const atenderEstoque = () => {
  if (selected.value.length === 0) return
  
  const selectedPieces = itemsComGrupo.value.filter(i => selected.value.includes(i.id))
  
  if (selectedPieces.length === 0) return
  
  const firstGroup = selectedPieces[0].materialAgrupado
  const hasMultipleMaterials = selectedPieces.some(i => i.materialAgrupado !== firstGroup)
  
  if (hasMultipleMaterials) {
    showSnackbar('Selecione apenas peças do mesmo material para reservar em lote.', 'warning')
    return
  }
  
  pecasParaReservaLote.value = selectedPieces
  estoqueSelecionado.value = null
  dialogReservaEstoque.value = true
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

const abrirReservaEstoque = (item) => {
  pecasParaReservaLote.value = [item]
  estoqueSelecionado.value = null
  dialogReservaEstoque.value = true
}

const confirmarReservaEstoque = async () => {
  if (pecasParaReservaLote.value.length === 0 || !estoqueSelecionado.value) return
  
  loadingReserva.value = true
  try {
    const res = await $fetch('/api/estoque/reservar', {
      method: 'POST',
      body: {
        pecaIds: pecasParaReservaLote.value.map(p => p.id),
        estoqueId: estoqueSelecionado.value
      }
    })
    
    showSnackbar(res.message || 'Estoque reservado com sucesso!')
    dialogReservaEstoque.value = false
    selected.value = []
    await carregarDados() // Recarrega a BOM e Estoque
  } catch(e) {
    showSnackbar(e.data?.statusMessage || 'Erro ao reservar estoque', 'error')
  } finally {
    loadingReserva.value = false
  }
}

const abrirAjuste = (item, action) => {
  adjustAction.value = action
  formEstoque.value = {
    id: item.id,
    tipoMaterial: item.descricao || '',
    material: item.material || '',
    quantidade: '',
    valorUnitario: item.valorUnitario || '',
    isEdit: (action === 'edit' || action === 'deduct' || action === 'add')
  }
  dialogAddEstoque.value = true
}

const excluirEstoque = async (item) => {
  if (!confirm(`Tem certeza que deseja excluir o item ${item.codigo}? Todo o histórico será apagado.`)) return
  
  loadingEstoque.value = true
  try {
    await $fetch('/api/estoque/materias-primas', {
      method: 'POST',
      body: {
        action: 'delete',
        id: item.id
      }
    })
    showSnackbar('Item excluído com sucesso!')
    await carregarDados()
  } catch(e) {
    showSnackbar('Erro ao excluir item', 'error')
  } finally {
    loadingEstoque.value = false
  }
}

const salvarEstoque = async () => {
  if (!formEstoque.value.tipoMaterial || (adjustAction.value !== 'edit' && !formEstoque.value.quantidade)) {
    showSnackbar('Preencha os campos obrigatórios', 'error')
    return
  }
  
  loadingEstoque.value = true
  try {
    await $fetch('/api/estoque/materias-primas', {
      method: 'POST',
      body: {
        action: adjustAction.value,
        id: formEstoque.value.id,
        tipoMaterial: formEstoque.value.tipoMaterial,
        material: formEstoque.value.material,
        quantidade: formEstoque.value.quantidade,
        valorUnitario: formEstoque.value.valorUnitario
      }
    })
    
    showSnackbar('Estoque atualizado com sucesso!')
    dialogAddEstoque.value = false
    await carregarDados()
  } catch(e) {
    showSnackbar('Erro ao salvar estoque', 'error')
  } finally {
    loadingEstoque.value = false
  }
}

const abrirLancamentoCompra = (groupKey, groupItems) => {
  // Extrair IDs de todos os itens brutos do grupo
  const pecaIds = groupItems.map(i => (i.raw || i).id)
  
  compraForm.value = {
    pecaIds,
    materialInfo: groupKey,
    fornecedorId: null,
    tipoFornecimento: 'BARRA_INTEIRA',
    valor: ''
  }
  dialogCompra.value = true
}

const salvarCompra = async () => {
  if (!compraForm.value.tipoFornecimento || !compraForm.value.valor) {
    showSnackbar('Preencha os campos obrigatórios (Fornecimento e Valor)', 'error')
    return
  }

  loadingCompra.value = true
  try {
    await $fetch('/api/compras/materias-primas/comprar', {
      method: 'POST',
      body: {
        pecaIds: compraForm.value.pecaIds,
        fornecedorId: compraForm.value.fornecedorId,
        tipoFornecimento: compraForm.value.tipoFornecimento,
        valorFornecimento: compraForm.value.valor
      }
    })
    
    showSnackbar('Compra registrada com sucesso!')
    dialogCompra.value = false
    await carregarDados()
  } catch(e) {
    showSnackbar('Erro ao lançar compra', 'error')
    console.error(e)
  } finally {
    loadingCompra.value = false
  }
}

onMounted(() => {
  carregarDados()
})
</script>
