<template>
  <div>
    <v-row class="mb-4" align="center">
      <v-col>
        <h1 class="text-h4">Roteiros (Tratamento Superficial)</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="abrirModalNovo">
          <v-icon left>mdi-plus</v-icon> Novo Roteiro
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table
      :headers="headers"
      :items="roteiros"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.op="{ item }">
        {{ item.op?.numeroOP || '-' }}
      </template>
      <template v-slot:item.maquina="{ item }">
        {{ item.op?.descricaoMaquina || '-' }}
      </template>
      <template v-slot:item.tipo="{ item }">
        <v-chip :color="corTipo(item.tipo)" dark small>
          {{ item.tipo }}
        </v-chip>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip :color="corStatus(item.status)" small>
          {{ item.status }}
        </v-chip>
      </template>
      <template v-slot:item.dataCriacao="{ item }">
        {{ formatarData(item.dataCriacao) }}
      </template>
      <template v-slot:item.acoes="{ item }">
        <v-btn icon="mdi-eye" size="small" color="primary" variant="text" :to="`/roteiros/${item.id}`" class="mr-2" title="Visualizar"></v-btn>
        <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="excluirRoteiro(item)" v-if="item.status === 'CRIADO'" title="Excluir"></v-btn>
      </template>
    </v-data-table>

    <!-- Modal Novo Roteiro -->
    <v-dialog v-model="modalNovo" max-width="600px">
      <v-card>
        <v-card-title>Novo Roteiro</v-card-title>
        <v-card-text>
          <v-form ref="formNovo" @submit.prevent="criarRoteiro">
            <v-text-field
              v-model="novoRoteiro.numero"
              label="Número do Roteiro (Ex: ROT-001)"
              required
            ></v-text-field>
            <v-select
              v-model="novoRoteiro.tipo"
              :items="['ZINCO', 'PINTURA', 'OUTROS']"
              label="Tipo de Tratamento"
              required
            ></v-select>
            <v-autocomplete
              v-model="novoRoteiro.opId"
              :items="ops"
              item-title="numeroOP"
              item-value="id"
              label="OP (Opcional)"
              clearable
            ></v-autocomplete>
            <v-autocomplete
              v-model="novoRoteiro.fornecedorId"
              :items="fornecedores"
              item-title="nome"
              item-value="id"
              label="Fornecedor (Opcional)"
              clearable
            ></v-autocomplete>
            <v-textarea
              v-model="novoRoteiro.observacoes"
              label="Observações"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="modalNovo = false">Cancelar</v-btn>
          <v-btn color="primary" @click="criarRoteiro" :loading="salvando">Criar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roteiros = ref([])
const loading = ref(true)
const modalNovo = ref(false)
const salvando = ref(false)

const novoRoteiro = ref({
  numero: '',
  tipo: 'ZINCO',
  observacoes: '',
  opId: null,
  fornecedorId: null
})

const ops = ref([])
const fornecedores = ref([])

const headers = [
  { title: 'Número', key: 'numero' },
  { title: 'OP', key: 'op' },
  { title: 'Máquina', key: 'maquina' },
  { title: 'Tipo', key: 'tipo' },
  { title: 'Fornecedor', key: 'fornecedor.nome' },
  { title: 'Data', key: 'dataCriacao' },
  { title: 'Status', key: 'status' },
  { title: 'Ações', key: 'acoes', sortable: false }
]

const carregarRoteiros = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/roteiros')
    roteiros.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const abrirModalNovo = () => {
  novoRoteiro.value = { numero: '', tipo: 'ZINCO', observacoes: '', opId: null, fornecedorId: null }
  modalNovo.value = true
}

const criarRoteiro = async () => {
  salvando.value = true
  try {
    const data = await $fetch('/api/roteiros', {
      method: 'POST',
      body: novoRoteiro.value
    })
    modalNovo.value = false
    router.push(`/roteiros/${data.id}`)
  } catch (error) {
    console.error(error)
    alert('Erro ao criar roteiro. Verifique se o número já existe.')
  } finally {
    salvando.value = false
  }
}

const excluirRoteiro = async (roteiro) => {
  if (!confirm(`Tem certeza que deseja excluir o roteiro ${roteiro.numero}?`)) return
  
  try {
    await $fetch(`/api/roteiros/${roteiro.id}`, { method: 'DELETE' })
    await carregarRoteiros()
  } catch (error) {
    alert('Erro ao excluir o roteiro.')
    console.error(error)
  }
}

const formatarData = (dataStr) => {
  if (!dataStr) return '-'
  const date = new Date(dataStr)
  return date.toLocaleDateString('pt-BR')
}

const corTipo = (tipo) => {
  if (tipo === 'ZINCO') return 'blue-grey'
  if (tipo === 'PINTURA') return 'deep-purple'
  return 'grey'
}

const corStatus = (status) => {
  if (status === 'CRIADO') return 'orange'
  if (status === 'ENVIADO') return 'blue'
  return 'default'
}

onMounted(async () => {
  await carregarRoteiros()
  try {
    const [opsData, fornecedoresData] = await Promise.all([
      $fetch('/api/ops'),
      $fetch('/api/fornecedores')
    ])
    ops.value = opsData
    fornecedores.value = fornecedoresData
  } catch (e) {
    console.error('Erro ao carregar auxiliares', e)
  }
})
</script>
