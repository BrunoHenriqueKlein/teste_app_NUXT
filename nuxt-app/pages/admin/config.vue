<template>
  <div class="pa-4">
    <v-card color="teal-darken-3" variant="flat" class="mb-4">
      <v-card-text class="d-flex justify-space-between align-center text-white">
        <div>
          <h1 class="text-h4 font-weight-bold">
            <v-icon icon="mdi-cog" class="mr-2"></v-icon>
            Configurações do Sistema
          </h1>
          <p class="text-body-1 mt-1">Padronize categorias, processos e templates para evitar erros.</p>
        </div>
      </v-card-text>
    </v-card>

    <v-tabs v-model="tab" color="teal-darken-3" class="mb-4">
      <v-tab value="categorias">Categorias Fornecedor</v-tab>
      <v-tab value="processos-op">Processos da OP</v-tab>
      <v-tab value="templates">Templates de OP</v-tab>
      <v-tab value="processos-peca">Processos de Peças</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Aba de Categorias de Fornecedor -->
      <v-window-item value="categorias">
        <v-card variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center">
            Lista de Categorias
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog('categoria')">Nova Categoria</v-btn>
          </v-card-title>
          <v-data-table :headers="headersSimple" :items="categorias" :loading="loading">
            <template v-slot:item.acoes="{ item }">
              <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editItem('categoria', item)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem('categoria', item)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- Aba de Processos da OP -->
      <v-window-item value="processos-op">
        <v-card variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center">
            Processos Superiores (OP)
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog('processo-op')">Novo Processo</v-btn>
          </v-card-title>
          <v-data-table :headers="headersProcessoOp" :items="processosOp" :loading="loading">
            <template v-slot:item.acoes="{ item }">
               <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editItem('processo-op', item)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem('processo-op', item)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- Aba de Processos de Peça -->
      <v-window-item value="processos-peca">
        <v-card variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center">
            Processos de Fabricação (Peças)
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog('processo-peca')">Novo Processo</v-btn>
          </v-card-title>
          <v-data-table :headers="headersProcessoPeca" :items="processosPeca" :loading="loading">
            <template v-slot:item.acoes="{ item }">
              <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editItem('processo-peca', item)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem('processo-peca', item)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- Aba de Templates -->
      <v-window-item value="templates">
        <v-card variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center">
            Templates de Fluxo de OP
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openTemplateDialog">Novo Template</v-btn>
          </v-card-title>
          <v-data-table :headers="headersTemplate" :items="templates" :loading="loading">
            <template v-slot:item.processos="{ item }">
              <div class="d-flex gap-1 flex-wrap py-2">
                <v-chip v-for="p in item.processos" :key="p.id" size="x-small" color="info" variant="flat">
                  {{ p.processo.nome }}
                </v-chip>
              </div>
            </template>
            <template v-slot:item.acoes="{ item }">
              <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editTemplate(item)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem('template', item)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Diálogo Simples (Nome + Descrição + Prazo) -->
    <v-dialog v-model="dialog.show" max-width="500px">
      <v-card>
        <v-card-title>Adicionar {{ dialog.title }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="dialog.nome" label="Nome" variant="outlined"></v-text-field>
          <v-textarea v-model="dialog.descricao" label="Descrição (Opcional)" variant="outlined" rows="2"></v-textarea>
            <v-text-field 
            v-if="dialog.type === 'processo-op'" 
            v-model.number="dialog.prazoEstimadoPadrao" 
            label="Prazo Estimado Padrão (Dias)" 
            type="number" 
            variant="outlined"
          ></v-text-field>
          <v-autocomplete
            v-if="dialog.type === 'processo-op'"
            v-model="dialog.responsavelId"
            :items="usuarios"
            item-title="name"
            item-value="id"
            label="Responsável Padrão"
            variant="outlined"
            clearable
          ></v-autocomplete>
          <v-select
            v-if="dialog.type === 'processo-op'"
            v-model="dialog.vinculoStatusOP"
            :items="statusOPList"
            label="Vínculo com Status da OP"
            variant="outlined"
            clearable
            hint="A OP mudará para este status automaticamente ao iniciar este processo"
            persistent-hint
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveSimple">
            {{ dialog.id ? 'Atualizar' : 'Salvar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Template -->
    <v-dialog v-model="dialogTemplate.show" max-width="600px">
      <v-card>
        <v-card-title>Criar Novo Template de OP</v-card-title>
        <v-card-text>
          <v-text-field v-model="dialogTemplate.nome" label="Nome do Template (Ex: Máquina Padrão)" variant="outlined"></v-text-field>
          
          <div class="text-subtitle-1 mb-2 font-weight-bold">Selecione os Processos (em ordem):</div>
          <v-list density="compact" class="border rounded px-2">
            <v-list-item v-for="(proc, index) in processosOp" :key="proc.id">
              <template v-slot:prepend>
                <v-checkbox-btn v-model="dialogTemplate.selecionados" :value="proc"></v-checkbox-btn>
              </template>
              <v-list-item-title>{{ proc.nome }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <div class="mt-4" v-if="dialogTemplate.selecionados.length > 0">
            <div class="text-caption">Ordem definida:</div>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <v-chip v-for="(p, i) in dialogTemplate.selecionados" :key="p.id" size="small" closable @click:close="dialogTemplate.selecionados.splice(i, 1)">
                {{ i + 1 }}. {{ p.nome }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogTemplate.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveTemplate">
            {{ dialogTemplate.id ? 'Atualizar Template' : 'Criar Template' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const { authHeaders } = useAuth()
const tab = ref('categorias')
const loading = ref(false)
const saving = ref(false)

const categorias = ref([])
const processosOp = ref([])
const processosPeca = ref([])
const templates = ref([])
const usuarios = ref([])

const dialog = ref({ show: false, type: '', title: '', nome: '' })
const dialogTemplate = ref({ show: false, nome: '', selecionados: [] })
const snackbar = ref({ show: false, text: '', color: 'success' })

const statusOPList = [
  'AGUARDANDO', 'EM_ENGENHARIA', 'EM_COMPRAS', 'EM_FABRICACAO', 
  'EM_AUTOMACAO', 'EM_PROJETO_ELETRICO', 'EM_CALIBRACAO', 
  'EM_MONTAGEM', 'EM_TESTES', 'EM_DOCUMENTACAO', 'EM_EXPEDICAO', 
  'AGUARDANDO_ENTREGA', 'CANCELADA', 'CONCLUIDA'
]

const headersSimple = [
  { title: 'Nome', key: 'nome', sortable: true },
  { title: 'Descrição', key: 'descricao', sortable: true },
  { title: 'Ações', key: 'acoes', align: 'end', sortable: false }
]

const headersProcessoOp = [
  { title: 'Nome', key: 'nome', sortable: true },
  { title: 'Descrição', key: 'descricao', sortable: true },
  { title: 'Prazo Padrão', key: 'prazoEstimadoPadrao', sortable: true },
  { title: 'Responsável', key: 'responsavel.name', sortable: true },
  { title: 'Status OP', key: 'vinculoStatusOP', sortable: true },
  { title: 'Ações', key: 'acoes', align: 'end', sortable: false }
]

const headersProcessoPeca = [
  { title: 'Nome', key: 'nome', sortable: true },
  { title: 'Descrição', key: 'descricao', sortable: true },
  { title: 'Ações', key: 'acoes', align: 'end', sortable: false }
]

const headersTemplate = [
  { title: 'Nome do Template', key: 'nome', sortable: true },
  { title: 'Processos Incluídos', key: 'processos', sortable: false },
  { title: 'Ações', key: 'acoes', align: 'end', sortable: false }
]

const loadData = async () => {
  loading.value = true
  try {
    const [cat, pop, ppec, temp, userList] = await Promise.all([
      $fetch('/api/configuracoes/categorias-fornecedor', { headers: authHeaders.value }),
      $fetch('/api/configuracoes/processos-padrao', { headers: authHeaders.value }),
      $fetch('/api/configuracoes/processos-peca', { headers: authHeaders.value }),
      $fetch('/api/configuracoes/templates-op', { headers: authHeaders.value }),
      $fetch('/api/user', { headers: authHeaders.value })
    ])
    categorias.value = cat
    processosOp.value = pop
    processosPeca.value = ppec
    templates.value = temp
    usuarios.value = userList
  } catch (error) {
    showSnackbar('Erro ao carregar configurações', 'error')
  } finally {
    loading.value = false
  }
}

const openDialog = (type) => {
  const titles = {
    'processo-op': 'Processo Superior (OP)',
    'processo-peca': 'Processo de Peça'
  }
  dialog.value = { 
    show: true, 
    type, 
    title: titles[type], 
    id: null, 
    nome: '', 
    descricao: '', 
    prazoEstimadoPadrao: null, 
    responsavelId: null,
    vinculoStatusOP: null 
  }
}

const editItem = (type, item) => {
  const titles = {
    'categoria': 'Categoria de Fornecedor',
    'processo-op': 'Processo Superior (OP)',
    'processo-peca': 'Processo de Peça'
  }
  dialog.value = { 
    show: true, 
    type, 
    title: titles[type], 
    id: item.id, 
    nome: item.nome, 
    descricao: item.descricao || '', 
    prazoEstimadoPadrao: item.prazoEstimadoPadrao || null,
    responsavelId: item.responsavelId || null,
    vinculoStatusOP: item.vinculoStatusOP || null
  }
}

const openTemplateDialog = () => {
  dialogTemplate.value = { show: true, id: null, nome: '', selecionados: [] }
}

const editTemplate = (item) => {
  dialogTemplate.value = { 
    show: true, 
    id: item.id, 
    nome: item.nome, 
    selecionados: item.processos.map(p => p.processo) 
  }
}

const saveSimple = async () => {
  if (!dialog.value.nome) return
  saving.value = true
  try {
    const endpoints = {
      'categoria': 'categorias-fornecedor',
      'processo-op': 'processos-padrao',
      'processo-peca': 'processos-peca'
    }
    await $fetch(`/api/configuracoes/${endpoints[dialog.value.type]}`, {
      method: dialog.value.id ? 'PUT' : 'POST',
      body: { 
        id: dialog.value.id,
        nome: dialog.value.nome,
        descricao: dialog.value.descricao,
        prazoEstimadoPadrao: dialog.value.prazoEstimadoPadrao,
        responsavelId: dialog.value.responsavelId,
        vinculoStatusOP: dialog.value.vinculoStatusOP
      },
      headers: authHeaders.value
    })
    showSnackbar(dialog.value.id ? 'Atualizado com sucesso!' : 'Salvo com sucesso!')
    dialog.value.show = false
    await loadData()
  } catch (error) {
    showSnackbar('Erro ao salvar item', 'error')
  } finally {
    saving.value = false
  }
}

const saveTemplate = async () => {
  if (!dialogTemplate.value.nome) return
  saving.value = true
  try {
    await $fetch('/api/configuracoes/templates-op', {
      method: dialogTemplate.value.id ? 'PUT' : 'POST',
      body: { 
        id: dialogTemplate.value.id,
        nome: dialogTemplate.value.nome,
        processos: dialogTemplate.value.selecionados 
      },
      headers: authHeaders.value
    })
    showSnackbar(dialogTemplate.value.id ? 'Template atualizado!' : 'Template criado!')
    dialogTemplate.value.show = false
    await loadData()
  } catch (error) {
    showSnackbar('Erro ao criar template', 'error')
  } finally {
    saving.value = false
  }
}

const deleteItem = async (type, item) => {
  if (!confirm(`Tem certeza que deseja excluir "${item.nome}"?`)) return
  
  loading.value = true
  try {
    const endpoints = {
      'categoria': 'categorias-fornecedor',
      'processo-op': 'processos-padrao',
      'processo-peca': 'processos-peca',
      'template': 'templates-op'
    }
    await $fetch(`/api/configuracoes/${endpoints[type]}`, {
      method: 'DELETE',
      body: { id: item.id },
      headers: authHeaders.value
    })
    showSnackbar('Excluído com sucesso!')
    await loadData()
  } catch (error) {
    showSnackbar('Erro ao excluir item. Ele pode estar sendo usado.', 'error')
  } finally {
    loading.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(loadData)
</script>
