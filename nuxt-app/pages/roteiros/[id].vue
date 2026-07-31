<template>
  <div v-if="roteiro">
    <!-- Layout Exclusivo de Impressão (Estilo Excel SOMEH) -->
    <div class="d-none d-print-block print-layout-someh">
      <!-- Cabeçalho -->
      <div class="print-header">
        <div class="print-logo">
          <img src="~/assets/imagens/logo-someh-fundo-claro.png" alt="SOMEH Logo" class="someh-logo-img">
        </div>
        <div class="print-info-box">
          <table class="info-table">
            <tr><td>OP:</td><td>{{ roteiroOP?.numeroOP || '-' }}</td></tr>
            <tr><td>Código Equipamento:</td><td>{{ roteiroOP?.codigoMaquina || '-' }}</td></tr>
            <tr><td>Descrição Equipamento:</td><td>{{ roteiroOP?.descricaoMaquina || '-' }}</td></tr>
          </table>
        </div>
      </div>

    </div>

    <v-row align="center">
      <v-col>
        <v-btn icon to="/roteiros" class="mr-4 d-print-none"><v-icon>mdi-arrow-left</v-icon></v-btn>
        <h2 class="text-h4 d-inline align-middle">Roteiro {{ roteiro.numero }}</h2>
        <span class="ml-4 text-subtitle-1 font-weight-bold align-middle print-totals">
          <span v-if="roteiro.tipo === 'PINTURA'">Área Total: {{ areaTotal.toFixed(2) }} m² <span class="mx-2">|</span> </span>
          <span v-if="roteiro.tipo === 'ZINCO'">
            <template v-if="roteiro.precoKgZinco || roteiro.valorTotal">
              Valor/kg: R$ {{ roteiro.precoKgZinco ? roteiro.precoKgZinco.toFixed(2) : (pesoTotal > 0 ? (roteiro.valorTotal / pesoTotal).toFixed(2) : '0.00') }} <span class="mx-2">|</span> 
              Valor Total: R$ {{ (roteiro.valorTotal || (roteiro.precoKgZinco * pesoTotal)).toFixed(2) }} <span class="mx-2">|</span> 
            </template>
          </span>
          Peso Total: {{ pesoTotal.toFixed(2) }} kg
        </span>
      </v-col>
    </v-row>
    <v-card class="mt-4 d-print-none bg-blue-grey-lighten-5 border">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <h3 class="text-h6 mb-2">Informações da OP</h3>
            <div v-if="roteiro.status === 'CRIADO'">
              <v-autocomplete
                v-model="editOpId"
                :items="ops"
                item-title="numeroOP"
                item-value="id"
                label="Selecionar OP"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                class="mb-2"
                @update:modelValue="salvarMetadados"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.descricaoMaquina"></v-list-item>
                </template>
              </v-autocomplete>
            </div>
            <div v-else>
              <p><strong>OP:</strong> {{ roteiroOP?.numeroOP || '-' }}</p>
              <p><strong>Código Equipamento:</strong> {{ roteiroOP?.codigoMaquina || '-' }}</p>
              <p><strong>Descrição Equipamento:</strong> {{ roteiroOP?.descricaoMaquina || '-' }}</p>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <h3 class="text-h6 mb-2">Fornecedor Destino</h3>
            <div v-if="roteiro.status === 'CRIADO' || roteiro.status === 'AGUARDANDO_ORCAMENTO'">
              <v-autocomplete
                v-model="editFornecedorId"
                :items="fornecedores"
                item-title="nome"
                item-value="id"
                label="Selecionar Fornecedor"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                @update:modelValue="salvarMetadados"
              ></v-autocomplete>
            </div>
            <div v-else>
              <p><strong>Nome:</strong> {{ roteiro.fornecedor?.nome || 'Não definido' }}</p>
              <p><strong>Contato:</strong> {{ roteiro.fornecedor?.contato || '-' }} ({{ roteiro.fornecedor?.telefone || roteiro.fornecedor?.whatsapp || '-' }})</p>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card class="mt-4 d-print-none">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <p><strong>Status:</strong> <v-chip class="ml-2" color="primary">{{ roteiro.status }}</v-chip></p>
            <p class="mt-2"><strong>Data de Criação:</strong> {{ formatarData(roteiro.dataCriacao) }}</p>
            <p v-if="roteiro.dataEnvio" class="mt-2"><strong>Enviado em:</strong> {{ formatarData(roteiro.dataEnvio) }}</p>
            <p v-if="roteiro.dataRetorno" class="mt-2"><strong>Recebido em:</strong> {{ formatarData(roteiro.dataRetorno) }}</p>
            <p v-if="roteiro.observacoes" class="mt-2"><strong>Observações:</strong> {{ roteiro.observacoes }}</p>
          </v-col>
          <v-col cols="12" md="6" class="text-right d-print-none">
            <v-btn v-if="roteiro.tipo !== 'ZINCO' && (roteiro.status === 'CRIADO' || roteiro.status === 'AGUARDANDO_ORCAMENTO')" color="warning" @click="loadEmailPreview" class="mr-2" :loading="loadingEmailPreview">
              {{ roteiro.status === 'AGUARDANDO_ORCAMENTO' ? 'Reenviar Orçamento' : 'Solicitar Orçamento' }}
            </v-btn>
            <v-btn v-if="roteiro.tipo === 'ZINCO' && roteiro.status === 'CRIADO'" color="success" @click="mudarStatus('ENVIADO')" class="mr-2">
              Enviar Roteiro
            </v-btn>
            <v-btn v-if="roteiro.status === 'AGUARDANDO_ORCAMENTO'" color="success" @click="mudarStatus('ENVIADO')" class="mr-2">
              Confirmar Envio
            </v-btn>
            <v-btn v-if="roteiro.status === 'ENVIADO'" color="primary" @click="tentarConfirmarRecebimento" class="mr-2">
              <v-icon start>mdi-check-all</v-icon> Confirmar Recebimento
            </v-btn>
            <v-btn color="secondary" @click="imprimirRoteiro" class="mr-2">
              <v-icon start>mdi-printer</v-icon> Imprimir / PDF
            </v-btn>
            <v-btn v-if="roteiro.status === 'CRIADO'" color="error" @click="excluirRoteiro" class="mr-2">
              <v-icon start>mdi-delete</v-icon> Excluir
            </v-btn>
            <!-- Botão de E-mail antigo ocultado se estiver no novo fluxo -->
            <v-btn v-if="roteiro.tipo !== 'ZINCO' && false" color="info" @click="enviarEmail">
              <v-icon start>mdi-email</v-icon> Enviar E-mail
            </v-btn>
          </v-col>
        </v-row>

        <!-- Controle de Preço do Zinco -->
        <div v-if="roteiro.tipo === 'ZINCO'" class="d-flex flex-wrap align-center mt-4 pt-4 border-t d-print-none">
          <div v-for="(preco, trat) in precosTratamento" :key="trat" class="mr-4 mb-2">
            <v-text-field 
              v-model.number="precosTratamento[trat]" 
              :label="'R$/Kg - ' + trat" 
              density="compact" 
              hide-details 
              style="min-width: 150px; max-width: 250px" 
              type="number"
              step="0.01"
            ></v-text-field>
          </div>
          <v-btn color="success" @click="atualizarPrecoZinco" :loading="salvandoPreco" variant="tonal" class="mb-2">
            Calcular Preços
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mt-4 mb-4 bg-grey-lighten-4">
      <v-card-text class="d-flex justify-end">
        <h3 class="text-h6" v-if="roteiro.valorTotal">Valor Total: R$ {{ roteiro.valorTotal.toFixed(2) }}</h3>
      </v-card-text>
    </v-card>

    <v-row class="mt-2 mb-2 d-print-none" align="center">
      <v-col>
        <h3 class="text-h5">Itens do Roteiro</h3>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="abrirModalPCP" class="mr-2">
          <v-icon start>mdi-magnify</v-icon> Buscar do PCP
        </v-btn>
        <v-btn color="secondary" @click="modalAdd = true">
          <v-icon start>mdi-plus</v-icon> Adicionar Peça
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabela de Itens do Roteiro -->
    <v-data-table
      :headers="itemHeaders"
      :items="roteiro.itens"
      class="elevation-1 mt-4 print-table"
      :items-per-page="-1"
    >
      <template v-slot:bottom></template>
      <template v-slot:item.imagemUrl="{ item }">
        <v-img
          v-if="item.imagemUrl || item.peca?.imagem"
          :src="item.imagemUrl || item.peca?.imagem"
          max-width="90"
          max-height="70"
          class="my-2 rounded border cursor-pointer bg-white"
          contain
          @click="abrirFotoRoteiro(item)"
        ></v-img>
        <v-icon v-else size="60" color="grey">mdi-image-outline</v-icon>
      </template>
      <template v-slot:item.peca.codigo="{ item }">
        <strong style="white-space: nowrap;">{{ item.peca ? item.peca.codigo : 'N/A' }}</strong>
      </template>
      <template v-slot:item.quantidadeEnviada="{ item }">
        <v-text-field
          v-model.number="item.quantidadeEnviada"
          type="number"
          density="compact"
          hide-details
          variant="outlined"
          style="min-width: 60px"
          @change="salvarQtdItem(item, 'enviada')"
          :disabled="roteiro.status === 'RECEBIDO' || roteiro.status === 'FINALIZADO'"
        ></v-text-field>
      </template>
      <template v-slot:item.quantidadeRecebida="{ item }">
        <v-text-field
          v-if="roteiro.status === 'ENVIADO' || roteiro.status === 'RECEBIDO' || roteiro.status === 'FINALIZADO'"
          v-model.number="item.quantidadeRecebida"
          type="number"
          density="compact"
          hide-details
          variant="outlined"
          style="min-width: 60px"
          @change="salvarQtdItem(item, 'recebida')"
          :disabled="roteiro.status === 'RECEBIDO' || roteiro.status === 'FINALIZADO'"
        ></v-text-field>
        <span v-else>-</span>
      </template>
      <template v-slot:item.statusItem="{ item }">
        <v-chip size="small" :color="getItemStatusColor(getItemStatus(item))">
          {{ getItemStatus(item) }}
        </v-chip>
      </template>
      <template v-slot:item.peca.detalheTratamento="{ item }">
        {{ item.peca?.detalheTratamento || '-' }}
      </template>
      <template v-slot:item.pesoIndividual="{ item }">
        {{ item.pesoIndividual ? Number(item.pesoIndividual).toFixed(1) + ' kg' : '-' }}
      </template>
      <template v-slot:item.areaSuperficial="{ item }">
        {{ item.areaSuperficial ? Number(item.areaSuperficial).toFixed(1) : '-' }}
      </template>
      <template v-slot:item.valorUnitario="{ item }">
        <v-text-field
          v-model.number="item.valorUnitario"
          type="number"
          step="0.01"
          density="compact"
          hide-details
          variant="outlined"
          style="min-width: 120px"
          prefix="R$"
          @change="salvarPrecoItem(item)"
          :disabled="roteiro.status === 'RECEBIDO' || roteiro.status === 'FINALIZADO'"
        ></v-text-field>
      </template>
      <template v-slot:item.valorTotal="{ item }">
        <span v-if="item.valorTotal">R$ {{ Number(item.valorTotal).toFixed(2) }}</span>
        <span v-else>-</span>
      </template>
    </v-data-table>

    <!-- Modal Buscar do PCP -->
    <v-dialog v-model="modalPCP" max-width="900px">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          Peças Pendentes no PCP
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="modalPCP = false"></v-btn>
        </v-card-title>
        <v-card-text class="pt-4">
          <div v-if="loadingPCP" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2">Buscando processos...</p>
          </div>
          <div v-else>
            <v-text-field
              v-model="searchPCP"
              append-inner-icon="mdi-magnify"
              label="Buscar por OP, Código da Peça ou Processo..."
              single-line
              hide-details
              density="compact"
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-data-table
              v-model="processosSelecionados"
              :headers="pcpHeaders"
              :items="pendentesPCP"
              :search="searchPCP"
              show-select
              item-value="id"
              class="elevation-0 border"
              :items-per-page="-1"
            >
              <template v-slot:item.peca.op.numeroOP="{ item }">
                <strong>{{ item.peca.op.numeroOP }}</strong>
              </template>
              <template v-slot:item.foto="{ item }">
                <v-img
                  v-if="item.peca.imagem || (item.peca.anexos && item.peca.anexos.length > 0)"
                  :src="item.peca.imagem || item.peca.anexos[0].url"
                  max-width="40"
                  max-height="40"
                  class="my-1 rounded border"
                  cover
                ></v-img>
                <v-icon v-else size="32" color="grey">mdi-image-outline</v-icon>
              </template>
            </v-data-table>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="modalPCP = false">Cancelar</v-btn>
          <v-btn 
            color="primary" 
            @click="importarPCP" 
            :loading="importandoPCP"
            :disabled="processosSelecionados.length === 0"
          >
            Importar Selecionadas ({{ processosSelecionados.length }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Adicionar Manual -->
    <v-dialog v-model="modalAdd" max-width="800px">
      <v-card>
        <v-card-title>Adicionar Peça ao Roteiro</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="salvarItem">
            <v-text-field
              v-model.number="novoItem.pecaId"
              label="ID da Peça (Engenharia)"
              type="number"
              required
            ></v-text-field>
            <v-text-field
              v-model.number="novoItem.quantidade"
              label="Quantidade no Roteiro"
              type="number"
              required
            ></v-text-field>
            <v-text-field v-model="novoItem.tratamento" label="Tratamento (Ex: Zinco Branco)" required></v-text-field>
            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="novoItem.pesoIndividual" label="Peso Individual (kg)" type="number"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="novoItem.areaSuperficial" label="Área (m²)" type="number"></v-text-field>
              </v-col>
            </v-row>
            <v-text-field v-model="novoItem.dimensoesExternas" label="Dimensões (Ex: 100 x 50 x 10)"></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="modalAdd = false">Cancelar</v-btn>
          <v-btn color="primary" @click="salvarItem" :loading="salvandoItem">Adicionar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal Visualizar Foto -->
    <v-dialog v-model="dialogFoto" max-width="800px">
      <v-card v-if="fotoSelecionada">
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title>Visualizar Imagem</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogFoto = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="text-center pa-4 bg-grey-lighten-4">
          <v-img :src="fotoSelecionada.imagemUrl || fotoSelecionada.peca?.imagem" max-height="600" contain></v-img>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Revisão de E-mail de Orçamento -->
    <v-dialog v-model="dialogEmail.show" max-width="900px" persistent>
      <v-card>
        <v-card-title class="pa-4 bg-primary text-white d-flex align-center">
          Revisar E-mail de Orçamento
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="dialogEmail.show = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-text-field
            v-model="dialogEmail.data.to"
            label="Para"
            variant="outlined"
            density="compact"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="dialogEmail.data.subject"
            label="Assunto"
            variant="outlined"
            density="compact"
            class="mb-4"
          ></v-text-field>

          <p class="text-caption mb-2 text-grey-darken-1">Mensagem (HTML suportado):</p>
          <v-textarea
            v-model="dialogEmail.data.html"
            variant="outlined"
            auto-grow
            rows="10"
            class="mb-4"
            style="font-family: monospace; font-size: 13px;"
          ></v-textarea>
          
          <v-card variant="outlined" class="pa-4 bg-grey-lighten-4">
            <h4 class="text-subtitle-2 mb-2">Pré-visualização do Corpo do E-mail:</h4>
            <div class="email-preview-box" v-html="dialogEmail.data.html" style="max-height: 400px; overflow-y: auto; background: white; padding: 15px; border: 1px solid #ccc; border-radius: 4px;"></div>
          </v-card>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" @click="dialogEmail.show = false">Cancelar</v-btn>
          <v-btn
            color="success"
            prepend-icon="mdi-send"
            :loading="sendingEmail"
            @click="sendFinalEmail"
          >
            Enviar E-mail
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  <div v-else>
    Carregando...
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const roteiro = ref(null)

const dialogFoto = ref(false)
const fotoSelecionada = ref(null)

const abrirFotoRoteiro = (item) => {
  fotoSelecionada.value = item
  dialogFoto.value = true
}

// Estados Modal Manual
const modalAdd = ref(false)
const salvandoItem = ref(false)
const novoItem = ref({ pecaId: null, quantidade: 1, tratamento: '', pesoIndividual: null, areaSuperficial: null, dimensoesExternas: null })

// Estados Modal PCP
const modalPCP = ref(false)
const loadingPCP = ref(false)
const pendentesPCP = ref([])
const processosSelecionados = ref([])
const importandoPCP = ref(false)
const searchPCP = ref('')

const ops = ref([])
const fornecedores = ref([])
const editOpId = ref(null)
const editFornecedorId = ref(null)

const dialogEmail = ref({
  show: false,
  data: {}
})
const loadingEmailPreview = ref(false)
const sendingEmail = ref(false)

const pcpHeaders = [
  { title: 'OP', key: 'peca.op.numeroOP' },
  { title: 'Foto', key: 'foto', sortable: false },
  { title: 'Código da Peça', key: 'peca.codigo' },
  { title: 'Tratamento Solicitado', key: 'nome' },
  { title: 'Qtd.', key: 'peca.quantidade' }
]

const precosTratamento = ref({})

const carregarRoteiro = async () => {
  try {
    const data = await $fetch(`/api/roteiros/${route.params.id}`)
    roteiro.value = data
    editOpId.value = data.opId
    editFornecedorId.value = data.fornecedorId

    const precos = {}
    if (data.itens) {
      data.itens.forEach(item => {
        let trat = item.tratamento || 'Zinco'
        if (item.peca?.detalheTratamento) {
          trat = `${trat} - ${item.peca.detalheTratamento}`
        }
        if (precos[trat] === undefined) precos[trat] = 0
        if (item.valorUnitario && item.pesoIndividual && precos[trat] === 0) {
          precos[trat] = item.valorUnitario / item.pesoIndividual
        }
      })
    }
    precosTratamento.value = precos
  } catch (error) {
    console.error(error)
  }
}

const salvarMetadados = async () => {
  try {
    await $fetch(`/api/roteiros/${route.params.id}`, {
      method: 'PATCH',
      body: { 
        opId: editOpId.value,
        fornecedorId: editFornecedorId.value
      }
    })
    await carregarRoteiro()
  } catch (error) {
    console.error('Erro ao atualizar roteiro', error)
  }
}

const imprimindo = ref(false)

const itemHeaders = computed(() => {
  const base = [
    { title: 'Foto', key: 'imagemUrl', sortable: false, width: '15%' },
    { title: 'Código', key: 'peca.codigo', width: '23%' },
    { title: 'Qtd', key: 'quantidade', width: '5%' },
  ]

  if (!imprimindo.value) {
    base.push({ title: 'Qtd. Env', key: 'quantidadeEnviada', width: '8%', sortable: false, align: 'center' })
    base.push({ title: 'Qtd. Rec', key: 'quantidadeRecebida', width: '8%', sortable: false, align: 'center' })
    base.push({ title: 'Status', key: 'statusItem', width: '10%', sortable: false })
  }

  base.push(
    { title: 'Tratamento', key: 'tratamento', width: '10%' },
    { title: 'Cor / Detalhe', key: 'peca.detalheTratamento', width: '14%' },
    { title: 'Peso Un.', key: 'pesoIndividual', width: '9%' },
    { title: 'Área (m²)', key: 'areaSuperficial', width: '9%' },
    { title: 'Dimensões', key: 'dimensoesExternas', width: '15%' }
  )

  if (!imprimindo.value) {
    if (roteiro.value?.tipo !== 'ZINCO') {
      base.push({ title: 'Preço Un.', key: 'valorUnitario', width: '14%', sortable: false, align: 'center' })
    }
    base.push({ title: 'Total Peça', key: 'valorTotal', width: '9%' })
  }

  return base
})

const roteiroOP = computed(() => {
  if (roteiro.value?.op) return roteiro.value.op
  if (roteiro.value?.itens?.length > 0 && roteiro.value.itens[0].peca?.op) return roteiro.value.itens[0].peca.op
  return null
})

const pesoTotal = computed(() => {
  if (!roteiro.value || !roteiro.value.itens) return 0
  return roteiro.value.itens.reduce((sum, item) => sum + ((item.pesoIndividual || 0) * (item.quantidade || 0)), 0)
})

const areaTotal = computed(() => {
  if (!roteiro.value || !roteiro.value.itens) return 0
  return roteiro.value.itens.reduce((sum, item) => sum + ((item.areaSuperficial || 0) * (item.quantidade || 0)), 0)
})

const salvandoPreco = ref(false)

const atualizarPrecoZinco = async () => {
  salvandoPreco.value = true
  try {
    await $fetch(`/api/roteiros/${route.params.id}/zinco`, {
      method: 'POST',
      body: { precosTratamento: precosTratamento.value }
    })
    await carregarRoteiro()
  } catch (e) {
    alert('Erro ao calcular preços do zinco: ' + e.message)
  } finally {
    salvandoPreco.value = false
  }
}

const mudarStatus = async (novoStatus) => {
  try {
    await $fetch(`/api/roteiros/${route.params.id}`, {
      method: 'PATCH',
      body: { status: novoStatus }
    })
    await carregarRoteiro()
  } catch (e) {
    alert('Erro ao mudar status.')
  }
}

const excluirRoteiro = async () => {
  if (!confirm(`Tem certeza que deseja excluir o roteiro ${roteiro.value.numero}? Esta ação não pode ser desfeita e os itens voltarão para o PCP.`)) return
  
  try {
    await $fetch(`/api/roteiros/${route.params.id}`, { method: 'DELETE' })
    router.push('/roteiros')
  } catch (error) {
    alert('Erro ao excluir o roteiro.')
    console.error(error)
  }
}

const imprimirRoteiro = async () => {
  imprimindo.value = true
  await nextTick()
  window.print()
  imprimindo.value = false
}

const enviarEmail = () => {
  const subject = encodeURIComponent(`Solicitação de Orçamento - Roteiro ${roteiro.value.numero}`)
  const body = encodeURIComponent(`Olá,

Gostaríamos de solicitar um orçamento para as peças do Roteiro ${roteiro.value.numero}.
O documento em PDF com as fotos, quantidades e especificações de tratamento está em anexo.

Por favor, analise e nos retorne com a proposta.

Atenciosamente,
Equipe PCP`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}

const abrirModalPCP = async () => {
  modalPCP.value = true
  loadingPCP.value = true
  processosSelecionados.value = []
  try {
    let url = `/api/roteiros/pendentes?tipo=${roteiro.value.tipo}`
    if (roteiro.value.opId) url += `&opId=${roteiro.value.opId}`
    const data = await $fetch(url)
    pendentesPCP.value = data
  } catch (error) {
    console.error(error)
    alert('Erro ao buscar pendentes do PCP')
  } finally {
    loadingPCP.value = false
  }
}

const loadEmailPreview = async () => {
  loadingEmailPreview.value = true
  try {
    const data = await $fetch(`/api/roteiros/${route.params.id}/orcamento-email`, {
      method: 'POST',
      body: { preview: true }
    })
    
    dialogEmail.value = {
      show: true,
      data: data.emailData
    }
  } catch (error) {
    alert('Erro ao gerar rascunho de e-mail: ' + (error.data?.statusMessage || error.message))
  } finally {
    loadingEmailPreview.value = false
  }
}

const sendFinalEmail = async () => {
  sendingEmail.value = true
  try {
    const res = await $fetch(`/api/roteiros/${route.params.id}/orcamento-email`, {
      method: 'POST',
      body: {
        preview: false,
        htmlEditado: dialogEmail.value.data.html,
        subjectEditado: dialogEmail.value.data.subject,
        toEditado: dialogEmail.value.data.to
      }
    })
    
    alert(res.message || 'E-mail enviado com sucesso!')
    dialogEmail.value.show = false
    await carregarRoteiro() // Atualiza os status
  } catch (error) {
    alert('Erro ao enviar e-mail: ' + (error.data?.statusMessage || error.message))
  } finally {
    sendingEmail.value = false
  }
}

const importarPCP = async () => {
  if (processosSelecionados.value.length === 0) return
  importandoPCP.value = true
  try {
    await $fetch(`/api/roteiros/${route.params.id}/importar`, {
      method: 'POST',
      body: { processosIds: processosSelecionados.value }
    })
    modalPCP.value = false
    await carregarRoteiro()
    await verificarConclusaoRoteiro()
  } catch (error) {
    console.error(error)
    alert('Erro ao importar itens')
  } finally {
    importandoPCP.value = false
  }
}

const salvarItem = async () => {
  salvandoItem.value = true
  try {
    await $fetch(`/api/roteiros/${route.params.id}/itens`, {
      method: 'POST',
      body: novoItem.value
    })
    modalAdd.value = false
    novoItem.value = { pecaId: null, quantidade: 1, tratamento: '', pesoIndividual: null, areaSuperficial: null, dimensoesExternas: null }
    await carregarRoteiro() // Recarrega
    await verificarConclusaoRoteiro()
  } catch (error) {
    console.error(error)
    alert('Erro ao salvar item')
  } finally {
    salvandoItem.value = false
  }
}

const getItemStatus = (item) => {
  if (item.quantidadeEnviada === 0) return 'Aguardando Envio'
  if (item.quantidadeEnviada > 0 && item.quantidadeEnviada < item.quantidade) return 'Enviada Parcial'
  if (item.quantidadeEnviada === item.quantidade && item.quantidadeRecebida === 0) return 'Enviada'
  if (item.quantidadeRecebida > 0 && item.quantidadeRecebida < item.quantidadeEnviada) return 'Recebida Parcial'
  if (item.quantidadeRecebida === item.quantidade) return 'Recebida'
  return 'Pendente'
}

const getItemStatusColor = (status) => {
  switch (status) {
    case 'Aguardando Envio': return 'grey'
    case 'Enviada Parcial': return 'warning'
    case 'Enviada': return 'info'
    case 'Recebida Parcial': return 'purple'
    case 'Recebida': return 'success'
    default: return 'grey'
  }
}

const verificarConclusaoRoteiro = async () => {
  if (!roteiro.value || !roteiro.value.itens || roteiro.value.itens.length === 0) return
  const todosRecebidos = roteiro.value.itens.every(item => item.quantidadeRecebida === item.quantidade)
  
  if (todosRecebidos && roteiro.value.status !== 'RECEBIDO' && roteiro.value.status !== 'FINALIZADO') {
    await mudarStatus('RECEBIDO')
  } else if (!todosRecebidos && (roteiro.value.status === 'RECEBIDO' || roteiro.value.status === 'FINALIZADO')) {
    await mudarStatus('ENVIADO')
  }
}

const tentarConfirmarRecebimento = () => {
  const pendentes = roteiro.value.itens.some(item => item.quantidadeRecebida < item.quantidade)
  
  if (pendentes) {
    const forcar = confirm('Atenção: Você tem peças que ainda não foram totalmente recebidas neste roteiro. Se você confirmar, o roteiro será finalizado e você não poderá mais editar as quantidades. Deseja finalizar o roteiro mesmo assim?')
    if (!forcar) return
  }
  
  mudarStatus('RECEBIDO')
}

const salvarQtdItem = async (item, tipo) => {
  if (item.quantidadeEnviada < 0) item.quantidadeEnviada = 0;
  if (item.quantidadeEnviada > item.quantidade) item.quantidadeEnviada = item.quantidade;
  if (item.quantidadeRecebida < 0) item.quantidadeRecebida = 0;
  if (item.quantidadeRecebida > item.quantidadeEnviada) {
    alert('Não é possível receber mais do que foi enviado!');
    item.quantidadeRecebida = item.quantidadeEnviada;
  }

  try {
    await $fetch(`/api/roteiros/${route.params.id}/itens/${item.id}`, {
      method: 'PATCH',
      body: { 
        quantidadeEnviada: item.quantidadeEnviada,
        quantidadeRecebida: item.quantidadeRecebida
      }
    })
    await verificarConclusaoRoteiro()
  } catch (e) {
    console.error('Erro ao atualizar item', e)
    alert('Erro ao atualizar quantidades')
  }
}

const salvarPrecoItem = async (item) => {
  try {
    await $fetch(`/api/roteiros/${route.params.id}/itens/${item.id}/preco`, {
      method: 'PATCH',
      body: { valorUnitario: item.valorUnitario }
    })
    await carregarRoteiro() // Recarrega para atualizar os totais
  } catch (e) {
    console.error('Erro ao atualizar preço do item', e)
    alert('Erro ao atualizar preço da peça')
  }
}

const formatarData = (dataStr) => {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

onMounted(async () => {
  await carregarRoteiro()
  await verificarConclusaoRoteiro()
  try {
    const [opsData, fornecedoresData] = await Promise.all([
      $fetch('/api/ops'),
      $fetch('/api/fornecedores')
    ])
    ops.value = opsData
    fornecedores.value = fornecedoresData
  } catch (e) {
    console.error('Erro ao carregar OPs e Fornecedores', e)
  }
})
</script>

<style>
@media print {
  @page { size: portrait; margin: 1cm; }

  html, body, .v-application, .v-application--wrap, .v-main, .v-container {
    background: white !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .d-print-none { 
    display: none !important; 
  }

  /* Oculta layout do Vuetify (Menu Lateral e Topbar) */
  .v-navigation-drawer, .v-app-bar, header, nav { 
    display: none !important; 
  }
  
  /* Ajustes do Título Principal */
  h2.text-h4 { font-size: 18px !important; margin: 8px 0 !important; font-weight: bold; }

  /* Tabela na impressão - garantindo legibilidade e evitando corte */
  .print-table { 
    border: 1px solid #ccc !important; 
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
  }
  .print-table table { width: 100% !important; max-width: 100% !important; table-layout: fixed !important; }
  .print-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .print-table th { 
    font-weight: bold !important; 
    border-bottom: 2px solid #ccc !important; 
    font-size: 11px !important;
    padding: 4px !important;
  }
  .print-table td { 
    padding: 4px !important; 
    border-bottom: 1px solid #eee !important; 
    vertical-align: middle !important; 
    font-size: 11px !important;
    word-wrap: break-word !important;
    white-space: normal !important;
  }
  .print-table th:last-child, .print-table td:last-child {
    padding-right: 12px !important;
  }
  /* Oculta os cards e a tabela genérica na impressão */
  .v-card, .d-print-none { 
    display: none !important; 
  }
  
  /* ESTILOS DO CABEÇALHO SOMEH */
  .print-layout-someh {
    display: block !important;
    width: 100%;
    font-family: Arial, Helvetica, sans-serif;
  }
  .print-header {
    display: flex;
    border-bottom: 2px solid #000;
    margin-bottom: 10px;
    padding-bottom: 5px;
    align-items: center;
  }
  .print-logo {
    width: 35%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .someh-logo-img {
    max-width: 100%;
    max-height: 80px;
    object-fit: contain;
    object-position: left;
  }
  .print-info-box {
    width: 65%;
    display: flex;
    justify-content: flex-start;
    padding-left: 0;
  }
  .info-table {
    width: 100%;
    font-size: 14px;
  }
  .info-table td { padding: 2px 5px; }
  .info-table td:first-child { width: 130px; font-weight: bold; }
}
</style>
