<template>
  <div class="pa-4">
    <!-- Header Standard -->
    <PageHeader 
      title="Gestão de Estoque" 
      subtitle="Controle de saldo, materiais e categorias"
      icon="mdi-warehouse"
    >
      <template #actions>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-clipboard-text"
          class="mr-2"
          :disabled="selected.length === 0"
          @click="openCompraDialog"
        >
          Gerar Requisição
        </v-btn>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openNewItemDialog"
        >
          Novo Item
        </v-btn>
      </template>
    </PageHeader>

    <!-- Resumo -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="outlined" color="error" v-if="itensCriticos > 0">
          <v-card-text class="text-center">
            <div class="text-overline">Itens Críticos</div>
            <div class="text-h4 font-weight-bold">{{ itensCriticos }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined" color="primary">
          <v-card-text class="text-center">
            <div class="text-overline">Valor Total em Estoque</div>
            <div class="text-h4 font-weight-bold">{{ formatCurrency(valorTotalEstoque) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabela -->
    <v-card variant="outlined">
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :loading="loading"
        show-select
        hover
        :search="search"
      >
        <template v-slot:top>
          <v-text-field
            v-model="search"
            label="Buscar no estoque..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            class="pa-4"
            hide-details
          ></v-text-field>
        </template>

        <template v-slot:item.codigo="{ item }">
          <div class="font-weight-bold">{{ item.codigo }}</div>
        </template>

        <template v-slot:item.quantidade="{ item }">
          <v-chip
            :color="item.quantidade <= (item.minEstoque || 0) ? 'error' : 'success'"
            size="small"
            variant="flat"
          >
            {{ item.quantidade }} {{ item.unidade }}
          </v-chip>
        </template>

        <template v-slot:item.valorUnitario="{ item }">
          {{ formatCurrency(item.valorUnitario) }}
        </template>
        
        <template v-slot:item.impostoIPI="{ item }">
          {{ item.impostoIPI ? item.impostoIPI + '%' : '0%' }}
        </template>
        
        <template v-slot:item.valorTotal="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.valorTotal) }}</span>
        </template>

        <template v-slot:item.acoes="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            color="primary"
            @click="editItem(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="deleteStockItem(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo Add/Edit -->
    <v-dialog v-model="dialog.show" max-width="500px">
      <v-card>
        <v-card-title>{{ dialog.isEdit ? 'Editar Item' : 'Novo Item no Estoque' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="dialog.item.codigo" label="Código" variant="outlined" :disabled="dialog.isEdit"></v-text-field>
          <v-text-field v-model="dialog.item.descricao" label="Descrição" variant="outlined"></v-text-field>
          <v-text-field v-model="dialog.item.material" label="Material" variant="outlined"></v-text-field>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model.number="dialog.item.quantidade" label="Saldo Atual" type="number" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="dialog.item.minEstoque" label="Mínimo" type="number" variant="outlined"></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="dialog.item.categoria"
                :items="['Materia Prima', 'Componente', 'Consumível', 'Ferramenta', 'Outros']"
                label="Categoria"
                variant="outlined"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="dialog.item.subcategoria"
                :items="categoriasDisponiveis"
                label="Subcategoria"
                variant="outlined"
                hint="Filtrado pelas categorias oficiais do sistema"
                persistent-hint
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="dialog.item.unidade"
                :items="['UN', 'KG', 'MT', 'L', 'PC', 'RL']"
                label="Unidade"
                variant="outlined"
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model.number="dialog.item.valorUnitario" label="Valor Unitário (R$)" type="number" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="dialog.item.impostoIPI" label="Impostos (%)" type="number" variant="outlined"></v-text-field>
            </v-col>
          </v-row>
          <v-text-field v-model="dialog.item.localizacao" label="Localização" variant="outlined"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="saveItem" :loading="saving">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo Gerar Requisição -->
    <v-dialog v-model="dialogCompra.show" max-width="800px">
      <v-card>
        <v-card-title>Gerar Requisição de Compra - Estoque</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            Esta ação criará uma Requisição de Compra no painel de Suprimentos para que a equipe possa cotar os valores com os fornecedores.
          </v-alert>
          <v-autocomplete
            v-model="dialogCompra.fornecedorId"
            :items="filteredFornecedores"
            item-title="nome"
            item-value="id"
            label="Fornecedor Sugerido (opcional)"
            variant="outlined"
            class="mb-4"
            hide-details
            clearable
            persistent-hint
            hint="Fornecedores filtrados de acordo com a subcategoria dos itens selecionados."
          ></v-autocomplete>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th width="120">Estoque Atual</th>
                <th width="120">Qtd a Pedir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in dialogCompra.itens" :key="index">
                <td>{{ item.codigo }}</td>
                <td>{{ item.descricao }}</td>
                <td>
                  <v-chip size="x-small" :color="item.quantidade <= (item.minEstoque || 0) ? 'error' : 'success'">
                    {{ item.quantidade }} {{ item.unidade }}
                  </v-chip>
                </td>
                <td>
                  <v-text-field v-model.number="item.quantidadeCompra" type="number" density="compact" variant="underlined" hide-details></v-text-field>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogCompra.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingCompra" @click="gerarCompra">Criar Requisição</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const items = ref([])
const categoriasDisponiveis = ref([])
const loading = ref(false)
const search = ref('')
const saving = ref(false)
const selected = ref([])
const dialogCompra = ref({ show: false, fornecedorId: null, itens: [] })
const savingCompra = ref(false)
const fornecedores = ref([])

const filteredFornecedores = computed(() => {
  if (!dialogCompra.value.itens.length) return fornecedores.value
  
  const subcategorias = [...new Set(dialogCompra.value.itens.map(i => i.subcategoria).filter(Boolean))].map(s => s.toLowerCase())
  if (subcategorias.length === 0) return fornecedores.value

  return fornecedores.value.filter(f => 
    f.categorias && f.categorias.some(c => subcategorias.includes(c.toLowerCase()))
  )
})

const dialog = ref({
  show: false,
  isEdit: false,
  item: {}
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Código', key: 'codigo' },
  { title: 'Descrição', key: 'descricao' },
  { title: 'Material', key: 'material' },
  { title: 'Categoria', key: 'categoria' },
  { title: 'Subcategoria', key: 'subcategoria' },
  { title: 'Saldo', key: 'quantidade', align: 'end' },
  { title: 'Mínimo', key: 'minEstoque', align: 'end' },
  { title: 'V. Unitário', key: 'valorUnitario', align: 'end' },
  { title: 'Impostos (%)', key: 'impostoIPI', align: 'end' },
  { title: 'Total (R$)', key: 'valorTotal', align: 'end' },
  { title: 'Localização', key: 'localizacao' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const valorTotalEstoque = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.valorTotal || 0), 0)
})

const itensCriticos = computed(() => {
  return items.value.filter(i => i.quantidade <= (i.minEstoque || 0)).length
})

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch('/api/estoque')
    const cforn = await $fetch('/api/configuracoes/categorias-fornecedor')
    categoriasDisponiveis.value = cforn.map(c => c.nome)
    fornecedores.value = await $fetch('/api/fornecedores')
  } catch (error) {
    showSnackbar('Erro ao carregar dados', 'error')
  } finally {
    loading.value = false
  }
}

const openNewItemDialog = () => {
  dialog.value = {
    show: true,
    isEdit: false,
    item: {
      codigo: '',
      unidade: 'UN',
      quantidade: 0,
      minEstoque: 0,
      material: ''
    }
  }
}

const editItem = (item) => {
  dialog.value = {
    show: true,
    isEdit: true,
    item: { ...item }
  }
}

const deleteStockItem = async (item) => {
  if (!confirm(`Tem certeza que deseja excluir o item "${item.codigo}" do estoque?`)) return
  
  loading.value = true
  try {
    await $fetch(`/api/estoque/${item.id}`, { method: 'DELETE' })
    showSnackbar('Item excluído com sucesso!')
    await loadItems()
  } catch (error) {
    showSnackbar('Erro ao excluir item', 'error')
  } finally {
    loading.value = false
  }
}

const saveItem = async () => {
  saving.value = true
  try {
    await $fetch('/api/estoque', {
      method: 'POST',
      body: dialog.value.item
    })
    showSnackbar('Item salvo com sucesso!')
    dialog.value.show = false
    await loadItems()
  } catch (error) {
    showSnackbar('Erro ao salvar item', 'error')
  } finally {
    saving.value = false
  }
}

const openCompraDialog = () => {
  dialogCompra.value.itens = selected.value.map(id => {
    const actualItem = typeof id === 'object' ? id : items.value.find(i => i.id === id)
    return {
      ...actualItem,
      quantidadeCompra: actualItem.minEstoque > actualItem.quantidade ? (actualItem.minEstoque - actualItem.quantidade) : 1
    }
  })
  dialogCompra.value.fornecedorId = null
  dialogCompra.value.show = true
}

const gerarCompra = async () => {
  savingCompra.value = true
  try {
    const fornecedorSelecionado = fornecedores.value.find(f => f.id === dialogCompra.value.fornecedorId)
    
    const body = {
      isEstoque: true,
      fornecedor: fornecedorSelecionado ? fornecedorSelecionado.nome : 'Pendente de Definição',
      fornecedorId: dialogCompra.value.fornecedorId,
      status: 'RASCUNHO',
      itens: dialogCompra.value.itens.map(i => ({
        descricao: i.descricao,
        quantidade: i.quantidadeCompra,
        estoqueId: i.id,
        valorUnitario: 0,
        aliqIPI: 0,
        aliqICMS: 0
      }))
    }
    await $fetch('/api/compras', {
      method: 'POST',
      body
    })
    showSnackbar('Requisição gerada com sucesso!')
    dialogCompra.value.show = false
    selected.value = []
  } catch (error) {
    showSnackbar('Erro ao gerar Ordem de Compra', 'error')
  } finally {
    savingCompra.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(loadItems)
</script>
