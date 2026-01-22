<template>
  <div class="pa-4">
    <!-- Header -->
    <v-card color="teal-darken-1" variant="flat" class="mb-4">
      <v-card-text class="d-flex justify-space-between align-center text-white">
        <div>
          <h1 class="text-h4 font-weight-bold">
            <v-icon icon="mdi-account-group" class="mr-2"></v-icon>
            Gestão de Fornecedores
          </h1>
          <p class="text-body-1 mt-1">Cadastro e controle de parceiros e serviços externos</p>
        </div>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Novo Fornecedor
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Filtro e Busca -->
    <v-card variant="outlined" class="mb-4">
      <v-card-text>
        <v-text-field
          v-model="search"
          label="Buscar fornecedor..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
        ></v-text-field>
      </v-card-text>
    </v-card>

    <!-- Tabela de Fornecedores -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="fornecedores"
        :loading="loading"
        :search="search"
        hover
        no-data-text="Nenhum fornecedor cadastrado."
      >
        <template v-slot:item.nome="{ item }">
          <div class="font-weight-bold text-primary">{{ item.nome }}</div>
          <div class="text-caption text-grey">{{ item.cnpj || 'CNPJ não informado' }}</div>
          <div class="mt-1 d-flex flex-wrap gap-1">
            <v-chip
              v-for="cat in item.categorias"
              :key="cat"
              size="x-small"
              color="teal-lighten-4"
              variant="flat"
              class="text-teal-darken-3"
            >
              {{ cat }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.contato_info="{ item }">
          <div v-if="item.email" class="d-flex align-center mb-1">
            <v-icon size="small" icon="mdi-email" class="mr-1" color="grey"></v-icon>
            <span class="text-body-2">{{ item.email }}</span>
          </div>
          <div v-if="item.whatsapp" class="d-flex align-center">
            <v-icon size="small" icon="mdi-whatsapp" class="mr-1" color="success"></v-icon>
            <span class="text-body-2">{{ item.whatsapp }}</span>
          </div>
        </template>

        <template v-slot:item.acoes="{ item }">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            size="small"
            color="primary"
            class="mr-1"
            @click="editItem(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="deleteItem(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo Add/Edit -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title class="pa-4 bg-teal-darken-1 text-white">
          {{ dialog.isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field v-model="dialog.item.nome" label="Razão Social / Nome" variant="outlined" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="dialog.item.cnpj" label="CNPJ" variant="outlined" density="comfortable"></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-combobox
                v-model="dialog.item.categorias"
                :items="['Usinagem', 'Pintura', 'Solda', 'Caldeiraria', 'Montagem', 'Matéria-prima', 'Componentes Comerciais', 'Tratamento Térmico', 'Galvanoplastia']"
                label="Categorias / O que fornece?"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                hint="Selecione ou digite novas especialidades"
                persistent-hint
              ></v-combobox>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field v-model="dialog.item.contato" label="Pessoa de Contato" variant="outlined" density="comfortable" prepend-inner-icon="mdi-account"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="dialog.item.email" label="E-mail para Orçamentos" variant="outlined" density="comfortable" prepend-inner-icon="mdi-email"></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="dialog.item.telefone" label="Telefone" variant="outlined" density="comfortable" prepend-inner-icon="mdi-phone"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="dialog.item.whatsapp" label="WhatsApp" variant="outlined" density="comfortable" prepend-inner-icon="mdi-whatsapp"></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="dialog.item.endereco" label="Endereço Completo" variant="outlined" density="comfortable" rows="2"></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog.show = false">Cancelar</v-btn>
          <v-btn color="teal" variant="flat" :loading="saving" @click="saveItem">Salvar Fornecedor</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const fornecedores = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')

const dialog = ref({
  show: false,
  isEdit: false,
  item: { nome: '', cnpj: '', email: '', whatsapp: '', telefone: '', contato: '', endereco: '', categorias: [] }
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Fornecedor', key: 'nome', sortable: true },
  { title: 'Contato / Email', key: 'contato_info', sortable: false },
  { title: 'Pessoa Contato', key: 'contato' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const loadFornecedores = async () => {
  loading.value = true
  try {
    fornecedores.value = await $fetch('/api/fornecedores')
  } catch (error) {
    showSnackbar('Erro ao carregar fornecedores', 'error')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  dialog.value = {
    show: true,
    isEdit: false,
    item: { nome: '', cnpj: '', email: '', whatsapp: '', telefone: '', contato: '', endereco: '', categorias: [] }
  }
}

const editItem = (item) => {
  dialog.value = {
    show: true,
    isEdit: true,
    item: { ...item, categorias: item.categorias || [] }
  }
}

const saveItem = async () => {
  if (!dialog.value.item.nome) {
    showSnackbar('Nome é obrigatório', 'error')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/fornecedores', {
      method: 'POST',
      body: dialog.value.item
    })
    showSnackbar(dialog.value.isEdit ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!')
    dialog.value.show = false
    await loadFornecedores()
  } catch (error) {
    showSnackbar('Erro ao salvar fornecedor', 'error')
  } finally {
    saving.value = false
  }
}

const deleteItem = async (item) => {
  if (confirm(`Deseja realmente excluir o fornecedor ${item.nome}?`)) {
    try {
      await $fetch('/api/fornecedores', {
        method: 'DELETE',
        body: { id: item.id }
      })
      showSnackbar('Fornecedor excluído!')
      await loadFornecedores()
    } catch (error) {
      showSnackbar('Erro ao excluir fornecedor', 'error')
    }
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(loadFornecedores)
</script>
