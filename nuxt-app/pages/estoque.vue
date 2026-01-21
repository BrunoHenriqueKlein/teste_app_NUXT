<template>
  <div class="pa-4">
    <!-- Header -->
    <v-card color="success" variant="flat" class="mb-4">
      <v-card-text class="d-flex justify-space-between align-center text-white">
        <div>
          <h1 class="text-h4 font-weight-bold">
            <v-icon icon="mdi-warehouse" class="mr-2"></v-icon>
            Gestão de Estoque
          </h1>
          <p class="text-body-1 mt-1">Controle de saldo, materiais e categorias</p>
        </div>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Novo Item
        </v-btn>
      </v-card-text>
    </v-card>

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
    </v-row>

    <!-- Tabela -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
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

        <template v-slot:item.acoes="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            color="primary"
            @click="editItem(item)"
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
                v-model="dialog.item.unidade"
                :items="['UN', 'KG', 'MT', 'L', 'PC', 'RL']"
                label="Unidade"
                variant="outlined"
              ></v-select>
            </v-col>
          </v-row>
          <v-text-field v-model="dialog.item.localizacao" label="Localização" variant="outlined"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog.show = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" @click="saveItem" :loading="saving">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const items = ref([])
const loading = ref(false)
const search = ref('')
const saving = ref(false)

const dialog = ref({
  show: false,
  isEdit: false,
  item: {}
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Código', key: 'codigo' },
  { title: 'Descrição', key: 'descricao' },
  { title: 'Saldo', key: 'quantidade', align: 'end' },
  { title: 'Mínimo', key: 'minEstoque', align: 'end' },
  { title: 'Localização', key: 'localizacao' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const itensCriticos = computed(() => {
  return items.value.filter(i => i.quantidade <= (i.minEstoque || 0)).length
})

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch('/api/estoque')
  } catch (error) {
    showSnackbar('Erro ao carregar estoque', 'error')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  dialog.value = {
    show: true,
    isEdit: false,
    item: { 
      codigo: '', 
      descricao: '', 
      quantidade: 0, 
      minEstoque: 0, 
      unidade: 'UN',
      categoria: 'Materia Prima'
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

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(loadItems)
</script>
