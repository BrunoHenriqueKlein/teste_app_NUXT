<template>
  <div class="w-100">
    <div v-if="loading">
      <div class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="text-h6 mt-4">Carregando processos...</div>
      </div>
    </div>

    <div v-else>
    <!-- Header Standard -->
    <PageHeader 
      title="Processos da OP" 
      :subtitle="`${op?.numeroOP || ''} - ${op?.descricaoMaquina || ''} | Cliente: ${op?.cliente || ''}`"
      icon="mdi-cog"
    >
      <template #actions>
        <v-btn icon color="white" variant="text" @click="$router.push('/ops')" title="Voltar para Lista">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-btn icon color="white" variant="text" @click="$router.push(`/ops/${$route.params.id}`)" title="Ver Gantt">
          <v-icon>mdi-chart-timeline</v-icon>
        </v-btn>
        <v-btn 
          color="white" 
          variant="outlined" 
          prepend-icon="mdi-plus"
          @click="openCreateProcessoDialog"
        >
          Novo Processo
        </v-btn>
        <v-btn 
          color="white" 
          variant="outlined" 
          prepend-icon="mdi-playlist-plus"
          @click="showTemplateDialog = true"
        >
          Aplicar Template
        </v-btn>
      </template>
    </PageHeader>

    <!-- Conteúdo principal apenas se tiver processos -->
    <div v-if="processos.length > 0">
      <!-- Progresso Geral -->
      <v-row class="mb-4">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="text-h6">
              Progresso Geral da OP
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-progress-circular 
                  :model-value="progressoGeral" 
                  :color="getProgressColor(progressoGeral)"
                  size="80"
                  width="8"
                >
                  <strong>{{ progressoGeral }}%</strong>
                </v-progress-circular>
                <div class="ml-4">
                  <div class="text-h6">{{ progressoGeral }}% Concluído</div>
                  <div class="text-caption text-grey">
                    {{ processosConcluidos }} de {{ processos.length }} processos finalizados
                  </div>
                </div>
              </div>
              
              <v-progress-linear 
                :model-value="progressoGeral" 
                :color="getProgressColor(progressoGeral)"
                height="12"
                rounded
              />
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="text-h6">
              Cronograma
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar color="blue" size="32">
                      <v-icon color="white">mdi-calendar-start</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>Início OP</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(dataInicioOP) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar color="green" size="32">
                      <v-icon color="white">mdi-calendar-end</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>Previsão Término</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(dataTerminoPrevista) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar color="orange" size="32">
                      <v-icon color="white">mdi-clock-outline</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>Duração Total</v-list-item-title>
                  <v-list-item-subtitle>{{ duracaoTotal }} dias</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar color="purple" size="32">
                      <v-icon color="white">mdi-progress-check</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>Progresso</v-list-item-title>
                  <v-list-item-subtitle>{{ progressoGeral }}%</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Lista de Processos -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Fluxo de Processos (Datas Calculadas Automaticamente)</span>
              <v-btn 
                variant="outlined" 
                color="primary" 
                prepend-icon="mdi-refresh"
                @click="loadProcessos"
                :loading="loading"
              >
                Atualizar
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-timeline align="start" side="end" class="px-4">
                <v-timeline-item
                  v-for="processo in processosComDatasCalculadas"
                  :key="processo.id"
                  :dot-color="getStatusColor(processo.status)"
                  size="small"
                >
                  <template v-slot:icon>
                    <v-avatar :color="getStatusColor(processo.status)" size="36">
                      <v-icon color="white">{{ getStatusIcon(processo.status) }}</v-icon>
                    </v-avatar>
                  </template>

                  <v-card class="processo-card">
                    <v-card-text class="pa-4">
                      <div class="d-flex justify-space-between align-start mb-2">
                        <div>
                          <h3 class="text-h6 font-weight-bold">{{ processo.nome }}</h3>
                          <p class="text-caption text-grey" v-if="processo.descricao">
                            {{ processo.descricao }}
                          </p>
                        </div>
                        <v-chip 
                          :color="getStatusColor(processo.status)" 
                          variant="flat"
                          :prepend-icon="getStatusIcon(processo.status)"
                        >
                          {{ formatStatus(processo.status) }}
                        </v-chip>
                      </div>

                      <!-- Informações do Processo -->
                      <v-row dense class="mt-2">
                        <v-col cols="12" sm="4">
                          <div class="text-caption text-grey">Sequência</div>
                          <div class="font-weight-medium">#{{ processo.sequencia }}</div>
                        </v-col>
                        <v-col cols="12" sm="4">
                          <div class="text-caption text-grey">Prazo</div>
                          <div class="font-weight-medium">{{ processo.prazoEstimado || 0 }} dia(s)</div>
                        </v-col>
                        <v-col cols="12" sm="4" v-if="processo.responsavel">
                          <div class="text-caption text-grey">Responsável</div>
                          <div class="font-weight-medium">{{ processo.responsavel.name }}</div>
                        </v-col>
                      </v-row>

                      <!-- Datas Calculadas -->
                      <v-row dense class="mt-3">
                        <v-col cols="12" sm="6">
                          <div class="text-caption text-grey">Início Previsto</div>
                          <div class="font-weight-medium text-blue">
                            {{ formatDate(processo.dataInicioPrevista) }}
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="text-caption text-grey">Término Previsto</div>
                          <div class="font-weight-medium text-green">
                            {{ formatDate(processo.dataTerminoPrevista) }}
                          </div>
                        </v-col>
                      </v-row>

                      <!-- Datas Reais (se existirem) -->
                      <v-row dense class="mt-2" v-if="processo.dataInicio || processo.dataFim">
                        <v-col cols="12" sm="6" v-if="processo.dataInicio">
                          <div class="text-caption text-grey">Início Real</div>
                          <div class="font-weight-medium text-orange">
                            {{ formatDate(processo.dataInicio) }}
                            <v-icon v-if="processo.dataInicio !== processo.dataInicioPrevista" color="warning" small class="ml-1">
                              mdi-alert
                            </v-icon>
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6" v-if="processo.dataFim">
                          <div class="text-caption text-grey">Término Real</div>
                          <div class="font-weight-medium text-orange">
                            {{ formatDate(processo.dataFim) }}
                            <v-icon v-if="processo.dataFim !== processo.dataTerminoPrevista" color="warning" small class="ml-1">
                              mdi-alert
                            </v-icon>
                          </div>
                        </v-col>
                      </v-row>

                      <!-- Progresso do Processo -->
                      <div class="mt-3">
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Progresso do Processo</span>
                          <span class="text-caption font-weight-bold">{{ processo.progresso }}%</span>
                        </div>
                        <v-progress-linear 
                          :model-value="processo.progresso" 
                          :color="getProgressColor(processo.progresso)"
                          height="8"
                          rounded
                        />
                      </div>

                      <!-- Ações -->
                      <div class="d-flex gap-2 mt-4 flex-wrap">
                        <v-btn 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          @click="editarProcesso(processo)"
                          prepend-icon="mdi-pencil"
                        >
                          Editar
                        </v-btn>
                        
                        <v-btn 
                          size="small" 
                          variant="outlined" 
                          color="green"
                          @click="iniciarProcesso(processo)"
                          v-if="processo.status === 'NAO_INICIADO' || processo.status === 'AGUARDANDO'"
                          prepend-icon="mdi-play"
                        >
                          Iniciar
                        </v-btn>
                        
                        
                        <v-btn 
                          size="small" 
                          variant="outlined" 
                          color="green"
                          @click="concluirProcesso(processo)"
                          v-if="processo.status === 'EM_ANDAMENTO' || processo.status === 'AGUARDANDO'"
                          prepend-icon="mdi-check"
                        >
                          Concluir
                        </v-btn>
                        
                        <v-btn 
                          size="small" 
                          variant="outlined" 
                          color="red"
                          @click="excluirProcesso(processo)"
                          prepend-icon="mdi-delete"
                        >
                          Excluir
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Estado vazio -->
    <div v-else class="text-center py-16">
      <v-icon size="96" color="grey-lighten-1" class="mb-4">mdi-cog-off</v-icon>
      <div class="text-h4 text-grey">Nenhum processo cadastrado</div>
      <div class="text-body-1 text-grey mt-2">Esta OP ainda não possui processos</div>
      <div class="d-flex justify-center gap-4 mt-6">
        <v-btn color="primary" size="large" @click="openCreateProcessoDialog">
          <v-icon start>mdi-plus</v-icon>
          Adicionar Primeiro Processo
        </v-btn>
        <v-btn color="secondary" size="large" @click="showTemplateDialog = true">
          <v-icon start>mdi-playlist-plus</v-icon>
          Usar Template
        </v-btn>
      </div>
    </div>

    <!-- Dialog Criar/Editar Processo -->
    <v-dialog v-model="showProcessoDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ editingProcesso ? 'Editar Processo' : 'Novo Processo' }}</span>
          <v-btn icon @click="closeProcessoDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="salvarProcesso" ref="processoForm">
            
            <!-- Data de Início da OP (apenas no primeiro processo) -->
            <v-card variant="outlined" color="primary" class="mb-4" v-if="!editingProcesso && processos.length === 0">
              <v-card-text class="pb-3">
                <div class="text-caption font-weight-bold mb-2">🎯 CONFIGURAÇÃO DA OP</div>
                <v-text-field
                  v-model="dataInicioOP"
                  label="Data de Início da OP *"
                  type="date"
                  variant="outlined"
                  :min="minDate"
                  :max="maxDate"
                  :rules="[v => !!v || 'Data de início da OP é obrigatória']"
                />
                <div class="text-caption text-grey">
                  Esta data será usada para calcular automaticamente todas as datas dos processos em cascata
                </div>
              </v-card-text>
            </v-card>

            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="formProcesso.nome"
                  :items="padronizados"
                  label="Nome do Processo *"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Nome é obrigatório']"
                  hint="Selecione um processo padronizado ou digite um novo"
                  persistent-hint
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formProcesso.descricao"
                  label="Descrição"
                  variant="outlined"
                  rows="2"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formProcesso.sequencia"
                  label="Sequência *"
                  type="number"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Sequência é obrigatória']"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formProcesso.prazoEstimado"
                  label="Prazo Estimado (dias) *"
                  type="number"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Prazo estimado é obrigatório']"
                  :min="1"
                  :max="365"
                />
              </v-col>

              <!-- Datas Calculadas (apenas exibição) -->
              <v-col cols="12" v-if="formProcesso.prazoEstimado && !editingProcesso">
                <v-card variant="outlined" color="info">
                  <v-card-text class="py-3">
                    <div class="text-caption font-weight-bold">📅 DATAS CALCULADAS AUTOMATICAMENTE</div>
                    <div class="text-body-2">
                      <div>Início Previsto: <strong>{{ calcularDataInicioDisplay() }}</strong></div>
                      <div>Término Previsto: <strong>{{ calcularDataTerminoDisplay() }}</strong></div>
                    </div>
                    <div class="text-caption text-grey mt-1">
                      * As datas são calculadas automaticamente em cascata
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProcesso.responsavelId"
                  label="Responsável"
                  :items="usuarios"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  clearable
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProcesso.status"
                  label="Status"
                  :items="statusOptions"
                  variant="outlined"
                />
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formProcesso.progresso"
                  label="Progresso (%)"
                  type="number"
                  variant="outlined"
                  min="0"
                  max="100"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formProcesso.vinculoStatusOP"
                  label="Vínculo com Status da OP"
                  :items="statusOPList"
                  variant="outlined"
                  clearable
                  hint="A OP mudará para este status automaticamente ao iniciar este processo"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="outlined" @click="closeProcessoDialog">Cancelar</v-btn>
          <v-btn 
            color="primary" 
            @click="salvarProcesso" 
            :loading="salvando"
            prepend-icon="mdi-content-save"
          >
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Template -->
    <v-dialog v-model="showTemplateDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Usar Template de Processos
        </v-card-title>
        
        <v-card-text>
          <v-select
            v-model="selectedTemplate"
            label="Selecione um template"
            :items="templatesDB"
            item-title="nome"
            item-value="id"
            variant="outlined"
            class="mb-4"
          />
          
          <v-alert v-if="selectedTemplate" type="info" variant="tonal">
            Serão criados processos com datas calculadas automaticamente baseados no template selecionado
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showTemplateDialog = false">
            Cancelar
          </v-btn>
          <v-btn 
            color="primary" 
            @click="aplicarTemplate" 
            :loading="aplicandoTemplate"
            :disabled="!selectedTemplate"
          >
            Aplicar Template
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </div>
  </div>
</template>

<script setup>
// Composables
const useProcessosTemplates = () => {
  const templates = {
    PADRAO_MAQUINA: [
      { nome: 'Lançamento da OP no Sistema', descricao: 'Registro inicial da Ordem de Produção no sistema', sequencia: 1, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Criação da Pasta do Projeto', descricao: 'Criação da estrutura de pastas para documentação do projeto', sequencia: 2, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Início do Projeto Mecânico', descricao: 'Início do desenvolvimento do projeto 3D no SolidWorks', sequencia: 3, prazoEstimado: 15, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Detalhamento das Peças', descricao: 'Criação dos desenhos técnicos e detalhamento de todas as peças', sequencia: 4, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Geração da Lista de Peças (BOM)', descricao: 'Exportação da planilha BOM do SolidWorks', sequencia: 5, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Importação da Lista de Peças', descricao: 'Upload e importação da planilha BOM no sistema', sequencia: 6, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Criação de Roteiros de Fabricação', descricao: 'Criação dos roteiros de pintura, zincagem e calibração', sequencia: 7, prazoEstimado: 3, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Solicitação de Orçamentos', descricao: 'Envio de e-mails para cotação de peças e serviços', sequencia: 8, prazoEstimado: 5, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Solicitação de Compras', descricao: 'Emissão de ordens de compra baseadas nos orçamentos aprovados', sequencia: 9, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Recebimento de Materiais', descricao: 'Controle de recebimento e inspeção de materiais comprados', sequencia: 10, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Montagem do Equipamento', descricao: 'Montagem mecânica completa do equipamento', sequencia: 11, prazoEstimado: 15, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Projeto Elétrico e CLP', descricao: 'Desenvolvimento da parte elétrica e programação do CLP/IHM', sequencia: 12, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Testes do Equipamento', descricao: 'Testes funcionais e de qualidade do equipamento montado', sequencia: 13, prazoEstimado: 5, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Documentação Técnica', descricao: 'Elaboração de manual técnico, fotos e vídeos', sequencia: 14, prazoEstimado: 5, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Embalagem e Expedição', descricao: 'Preparação para envio e expedição ao cliente', sequencia: 15, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 }
    ],
    SIMPLES: [
      { nome: 'Lançamento da OP', descricao: 'Registro inicial da OP', sequencia: 1, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Projeto Mecânico', descricao: 'Desenvolvimento do projeto 3D', sequencia: 2, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Lista de Peças', descricao: 'Geração e importação do BOM', sequencia: 3, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Compras', descricao: 'Solicitação e acompanhamento de compras', sequencia: 4, prazoEstimado: 7, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Montagem', descricao: 'Montagem do equipamento', sequencia: 5, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
      { nome: 'Testes e Entrega', descricao: 'Testes finais e expedição', sequencia: 6, prazoEstimado: 3, status: 'NAO_INICIADO', progresso: 0 }
    ]
  }

  const getTemplate = (templateName) => {
    return templates[templateName] || templates.PADRAO_MAQUINA
  }

  const getTemplateNames = () => {
    return [
      { value: 'PADRAO_MAQUINA', title: 'Padrão Máquina Completa' },
      { value: 'SIMPLES', title: 'Processos Simplificados' }
    ]
  }

  return {
    templates,
    getTemplate,
    getTemplateNames
  }
}

// Composables
const { getTemplate, getTemplateNames } = useProcessosTemplates()

// Estado
const { authHeaders } = useAuth()
const route = useRoute()
const op = ref(null)
const processos = ref([])
const templatesDB = ref([])
const padronizados = ref([])
const processosPadraoFull = ref([])
const loading = ref(true)
const salvando = ref(false)
const showProcessoDialog = ref(false)
const showTemplateDialog = ref(false)
const aplicandoTemplate = ref(false)

const statusOPList = [
  'AGUARDANDO', 'EM_ENGENHARIA', 'EM_COMPRAS', 'EM_FABRICACAO', 
  'EM_AUTOMACAO', 'EM_PROJETO_ELETRICO', 'EM_CALIBRACAO', 
  'EM_MONTAGEM', 'EM_TESTES', 'EM_DOCUMENTACAO', 'EM_EXPEDICAO', 
  'AGUARDANDO_ENTREGA', 'CANCELADA', 'CONCLUIDA'
]
const editingProcesso = ref(null)
const usuarios = ref([])
const selectedTemplate = ref(null)

// ✅ VARIÁVEIS PARA CÁLCULO AUTOMÁTICO
const dataInicioOP = ref('')
const minDate = ref(new Date().toISOString().split('T')[0])
const maxDate = ref(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0])

// Formulário
const formProcesso = ref({
  nome: '',
  descricao: '',
  sequencia: 1,
  status: 'NAO_INICIADO',
  progresso: 0,
  prazoEstimado: null,
  responsavelId: null,
  vinculoStatusOP: null
})

// Opções
const statusOptions = [
  { title: 'Não Iniciado', value: 'NAO_INICIADO' },
  { title: 'Em Andamento', value: 'EM_ANDAMENTO' },
  { title: 'Aguardando', value: 'AGUARDANDO' },
  { title: 'Concluído', value: 'CONCLUIDO' },
  { title: 'Bloqueado', value: 'BLOQUEADO' },
  { title: 'Cancelado', value: 'CANCELADO' }
]

// ✅ AUTO-PREENCHER CAMPOS AO SELECIONAR PROCESSO PADRONIZADO
watch(() => formProcesso.value.nome, (newNome) => {
  if (!newNome || editingProcesso.value) return

  const padrao = processosPadraoFull.value.find(p => p.nome === newNome)
  if (padrao) {
    console.log('✨ Aplicando configurações automáticas do processo padronizado:', newNome)
    
    if (padrao.descricao) formProcesso.value.descricao = padrao.descricao
    if (padrao.prazoEstimadoPadrao) formProcesso.value.prazoEstimado = padrao.prazoEstimadoPadrao
    if (padrao.responsavelId) formProcesso.value.responsavelId = padrao.responsavelId
    if (padrao.vinculoStatusOP) formProcesso.value.vinculoStatusOP = padrao.vinculoStatusOP
  }
})

// Computed
const templateOptions = computed(() => {
  return getTemplateNames()
})

// ✅ PROCESSOS COM DATAS CALCULADAS EM CASCATA
const processosComDatasCalculadas = computed(() => {
  if (!processos.value.length || !dataInicioOP.value) return processos.value

  console.log('🔄 Calculando datas em cascata...')
  const processosCalculados = JSON.parse(JSON.stringify(processos.value))
  
  let dataInicioAtual = new Date(dataInicioOP.value)
  
  for (let i = 0; i < processosCalculados.length; i++) {
    const processo = processosCalculados[i]
    
    if (i === 0) {
      // Primeiro processo: inicia na data da OP
      processo.dataInicioPrevista = dataInicioOP.value
    } else {
      // Processos subsequentes: iniciam no dia seguinte ao término do anterior
      const processoAnterior = processosCalculados[i - 1]
      const dataTerminoAnterior = new Date(processoAnterior.dataTerminoPrevista)
      dataTerminoAnterior.setDate(dataTerminoAnterior.getDate() + 1)
      processo.dataInicioPrevista = dataTerminoAnterior.toISOString().split('T')[0]
      dataInicioAtual = new Date(processo.dataInicioPrevista)
    }
    
    // Calcular data de término baseada no prazo
    if (processo.prazoEstimado && processo.prazoEstimado > 0) {
      const dataTermino = new Date(dataInicioAtual)
      dataTermino.setDate(dataTermino.getDate() + processo.prazoEstimado - 1)
      processo.dataTerminoPrevista = dataTermino.toISOString().split('T')[0]
    }
  }
  
  return processosCalculados
})

const processosOrdenados = computed(() => {
  if (!Array.isArray(processosComDatasCalculadas.value)) return []
  return [...processosComDatasCalculadas.value].sort((a, b) => (a.sequencia || 0) - (b.sequencia || 0))
})

const processosConcluidos = computed(() => {
  if (!Array.isArray(processosComDatasCalculadas.value)) return 0
  return processosComDatasCalculadas.value.filter(p => p.status === 'CONCLUIDO').length
})

const progressoGeral = computed(() => {
  if (!Array.isArray(processosComDatasCalculadas.value) || processosComDatasCalculadas.value.length === 0) return 0
  const totalProgresso = processosComDatasCalculadas.value.reduce((sum, processo) => sum + (processo.progresso || 0), 0)
  return Math.round(totalProgresso / processosComDatasCalculadas.value.length)
})

// ✅ DATA DE TÉRMINO PREVISTA DA OP (último processo)
const dataTerminoPrevista = computed(() => {
  if (!processosComDatasCalculadas.value.length) return null
  const ultimoProcesso = processosComDatasCalculadas.value[processosComDatasCalculadas.value.length - 1]
  return ultimoProcesso.dataTerminoPrevista
})

// ✅ DURAÇÃO TOTAL EM DIAS
const duracaoTotal = computed(() => {
  if (!dataInicioOP.value || !dataTerminoPrevista.value) return 0
  const inicio = new Date(dataInicioOP.value)
  const termino = new Date(dataTerminoPrevista.value)
  const diffTime = Math.abs(termino - inicio)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
})

const estatisticas = computed(() => {
  if (!Array.isArray(processosComDatasCalculadas.value)) {
    return { emAndamento: 0, concluidos: 0, naoIniciados: 0, aguardando: 0 }
  }
  
  return {
    emAndamento: processosComDatasCalculadas.value.filter(p => p.status === 'EM_ANDAMENTO').length,
    concluidos: processosConcluidos.value,
    naoIniciados: processosComDatasCalculadas.value.filter(p => p.status === 'NAO_INICIADO').length,
    aguardando: processosComDatasCalculadas.value.filter(p => p.status === 'AGUARDANDO').length
  }
})

// Carregar dados
onMounted(async () => {
  console.log('🚀 Iniciando página de processos...')
  console.log('📌 ID da OP:', route.params.id)
  
  try {
    await Promise.all([
      loadOP(),
      loadProcessos(), 
      loadUsuarios()
    ])
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
})

// Carregar OP
const loadOP = async () => {
  try {
    const data = await $fetch(`/api/ops/${route.params.id}`, {
      headers: authHeaders.value
    })
    op.value = data
    
    // ✅ DEFINIR DATA DE INÍCIO DA OP
    dataInicioOP.value = op.value.dataInicio || 
                        op.value.dataPedido || 
                        new Date().toISOString().split('T')[0]
    
    console.log('✅ OP carregada:', {
      numeroOP: op.value?.numeroOP,
      dataInicio: dataInicioOP.value
    })
    
  } catch (error) {
    console.error('❌ Erro ao carregar OP:', error)
    op.value = {
      id: parseInt(route.params.id),
      numeroOP: 'OP-' + route.params.id,
      descricaoMaquina: 'Máquina não encontrada',
      cliente: 'Cliente não identificado',
      dataEntrega: null
    }
    dataInicioOP.value = new Date().toISOString().split('T')[0]
  }
}

// Carregar processos
const loadProcessos = async () => {
  try {
    console.log('📡 Carregando processos e configurações...')
    const [data, tps, pads] = await Promise.all([
      $fetch(`/api/ops/${route.params.id}/processos`, { headers: authHeaders.value }),
      $fetch('/api/configuracoes/templates-op', { headers: authHeaders.value }),
      $fetch('/api/configuracoes/processos-padrao', { headers: authHeaders.value })
    ])
    processos.value = Array.isArray(data) ? data : []
    templatesDB.value = tps
    processosPadraoFull.value = Array.isArray(pads) ? pads : []
    padronizados.value = processosPadraoFull.value.map(p => p.nome)
    console.log('✅ Dados carregados')
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error)
    processos.value = []
  }
}

// Carregar usuários
const loadUsuarios = async () => {
  try {
    const data = await $fetch('/api/user', {
      headers: authHeaders.value
    })
    usuarios.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    usuarios.value = [{ id: 1, name: 'Usuário Padrão' }]
  }
}

// ✅ MÉTODOS PARA CÁLCULO DE DATAS NO DIALOG
const calcularDataInicioDisplay = () => {
  if (!formProcesso.value.prazoEstimado) return '—'
  
  if (processos.value.length === 0) {
    return dataInicioOP.value ? formatDate(dataInicioOP.value) : '—'
  }
  
  // Para novos processos, calcular baseado no último processo
  const ultimoProcesso = processosComDatasCalculadas.value[processosComDatasCalculadas.value.length - 1]
  if (ultimoProcesso && ultimoProcesso.dataTerminoPrevista) {
    const dataInicio = new Date(ultimoProcesso.dataTerminoPrevista)
    dataInicio.setDate(dataInicio.getDate() + 1)
    return formatDate(dataInicio.toISOString().split('T')[0])
  }
  
  return 'A calcular...'
}

const calcularDataTerminoDisplay = () => {
  const dataInicio = calcularDataInicioDisplay()
  if (dataInicio === '—' || dataInicio === 'A calcular...' || !formProcesso.value.prazoEstimado) {
    return '—'
  }
  
  // Converter data de início para Date
  const [dia, mes, ano] = dataInicio.split('/')
  const dataInicioDate = new Date(`${ano}-${mes}-${dia}`)
  
  // Calcular data de término
  const dataTermino = new Date(dataInicioDate)
  dataTermino.setDate(dataTermino.getDate() + formProcesso.value.prazoEstimado - 1)
  
  return formatDate(dataTermino.toISOString().split('T')[0])
}

// Template functions
const getTemplateProcesses = (templateName) => {
  return getTemplate(templateName)
}

const aplicarTemplate = async () => {
  aplicandoTemplate.value = true
  try {
    const result = await $fetch(`/api/ops/${route.params.id}/processos/template`, {
      method: 'POST',
      body: {
        templateId: selectedTemplate.value
      },
      headers: authHeaders.value
    })
    
    await loadProcessos()
    showTemplateDialog.value = false
    selectedTemplate.value = null
    
    alert(`✅ ${result.message}`)
  } catch (error) {
    console.error('❌ Erro ao aplicar template:', error)
    alert('Erro ao aplicar template: ' + (error.data?.message || error.message))
  } finally {
    aplicandoTemplate.value = false
  }
}

// Utilitários
const getStatusColor = (status) => {
  const colors = {
    'NAO_INICIADO': 'grey',
    'EM_ANDAMENTO': 'blue',
    'AGUARDANDO': 'orange',
    'CONCLUIDO': 'green',
    'BLOQUEADO': 'red',
    'CANCELADO': 'red'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    'NAO_INICIADO': 'mdi-clock-outline',
    'EM_ANDAMENTO': 'mdi-play',
    'AGUARDANDO': 'mdi-pause',
    'CONCLUIDO': 'mdi-check',
    'BLOQUEADO': 'mdi-alert',
    'CANCELADO': 'mdi-close'
  }
  return icons[status] || 'mdi-help'
}

const getProgressColor = (progresso) => {
  if (progresso >= 80) return 'green'
  if (progresso >= 50) return 'orange'
  return 'red'
}

const formatStatus = (status) => {
  const statusMap = {
    'NAO_INICIADO': 'Não Iniciado',
    'EM_ANDAMENTO': 'Em Andamento',
    'AGUARDANDO': 'Aguardando',
    'CONCLUIDO': 'Concluído',
    'BLOQUEADO': 'Bloqueado',
    'CANCELADO': 'Cancelado'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Ações
const openCreateProcessoDialog = () => {
  editingProcesso.value = null
  formProcesso.value = {
    nome: '',
    descricao: '',
    sequencia: processos.value.length + 1,
    status: 'NAO_INICIADO',
    progresso: 0,
    prazoEstimado: null,
    responsavelId: null,
    vinculoStatusOP: null
  }
  showProcessoDialog.value = true
}

const editarProcesso = (processo) => {
  editingProcesso.value = processo
  formProcesso.value = { 
    ...processo,
    responsavelId: processo.responsavel?.id || processo.responsavelId,
    vinculoStatusOP: processo.vinculoStatusOP || null
  }
  
  showProcessoDialog.value = true
}

const closeProcessoDialog = () => {
  showProcessoDialog.value = false
  editingProcesso.value = null
}

const salvarProcesso = async () => {
  // Validação
  if (!formProcesso.value.prazoEstimado) {
    alert('❌ Prazo estimado é obrigatório')
    return
  }

  if (processos.value.length === 0 && !dataInicioOP.value) {
    alert('❌ Data de início da OP é obrigatória para o primeiro processo')
    return
  }

  salvando.value = true
  try {
    // ✅ CALCULAR DATAS PARA O PROCESSO ATUAL
    let dataInicioCalculada = ''
    let dataTerminoCalculada = ''
    
    if (editingProcesso.value) {
      // Para edição, manter as datas existentes
      dataInicioCalculada = formProcesso.value.dataInicioPrevista
      dataTerminoCalculada = formProcesso.value.dataTerminoPrevista
    } else {
      // ✅ CALCULAR NOVAS DATAS EM CASCATA
      const novaSequencia = parseInt(formProcesso.value.sequencia)
      
      if (processos.value.length === 0) {
        // Primeiro processo: inicia na data da OP
        dataInicioCalculada = dataInicioOP.value
      } else {
        // Encontrar o processo anterior na sequência
        const processosOrdenados = [...processos.value].sort((a, b) => a.sequencia - b.sequencia)
        
        // Se a sequência for maior que todos, pega o último processo
        if (novaSequencia > processosOrdenados[processosOrdenados.length - 1].sequencia) {
          const ultimoProcesso = processosOrdenados[processosOrdenados.length - 1]
          const dataInicioDate = new Date(ultimoProcesso.dataTerminoPrevista || dataInicioOP.value)
          dataInicioDate.setDate(dataInicioDate.getDate() + 1)
          dataInicioCalculada = dataInicioDate.toISOString().split('T')[0]
        } else {
          // Encontrar onde inserir e recalcular todos
          dataInicioCalculada = dataInicioOP.value
        }
      }
      
      // Calcular data de término baseada no prazo
      if (formProcesso.value.prazoEstimado && formProcesso.value.prazoEstimado > 0) {
        const dataTerminoDate = new Date(dataInicioCalculada)
        dataTerminoDate.setDate(dataTerminoDate.getDate() + parseInt(formProcesso.value.prazoEstimado) - 1)
        dataTerminoCalculada = dataTerminoDate.toISOString().split('T')[0]
      }
    }

    console.log('📅 Datas calculadas:', {
      inicio: dataInicioCalculada,
      termino: dataTerminoCalculada
    })

    // Preparar dados para envio (INCLUINDO AS DATAS CALCULADAS)
    const dadosEnvio = {
      ...formProcesso.value,
      sequencia: parseInt(formProcesso.value.sequencia),
      progresso: parseInt(formProcesso.value.progresso || 0),
      prazoEstimado: parseInt(formProcesso.value.prazoEstimado),
      // ✅ ENVIAR DATAS CALCULADAS PARA A API
      dataInicioPrevista: dataInicioCalculada,
      dataTerminoPrevista: dataTerminoCalculada
    }

    console.log('💾 Salvando processo com datas:', dadosEnvio)

    // Chamada API
    if (editingProcesso.value) {
      const data = await $fetch(`/api/ops/${route.params.id}/processos/${editingProcesso.value.id}`, {
        method: 'PUT',
        body: dadosEnvio,
        headers: authHeaders.value
      })
      
      const index = processos.value.findIndex(p => p.id === editingProcesso.value.id)
      if (index !== -1) {
        processos.value[index] = data.processo
      }
    } else {
      const data = await $fetch(`/api/ops/${route.params.id}/processos`, {
        method: 'POST',
        body: dadosEnvio,
        headers: authHeaders.value
      })
      
      processos.value.push(data.processo)
    }
    
    // ✅ RECALCULAR TODOS OS PROCESSOS SE FOR NOVO OU SEQUÊNCIA ALTERADA
    if (!editingProcesso.value || formProcesso.value.sequencia !== editingProcesso.value.sequencia) {
      await recalcularDatasCascata()
    }
    
    closeProcessoDialog()
    
  } catch (error) {
    console.error('❌ Erro ao salvar processo:', error)
    alert('Erro ao salvar processo: ' + (error.data?.message || error.message))
  } finally {
    salvando.value = false
  }
}

const recalcularDatasCascata = async () => {
  try {
    console.log('🔄 Recalculando datas em cascata para todos os processos...')
    
    // Carregar processos ordenados
    await loadProcessos()
    const processosAtualizados = [...processos.value].sort((a, b) => a.sequencia - b.sequencia)
    
    // Recalcular datas para todos os processos
    let dataInicioAtual = new Date(dataInicioOP.value)
    
    for (let i = 0; i < processosAtualizados.length; i++) {
      const processo = processosAtualizados[i]
      
      if (i === 0) {
        // Primeiro processo: inicia na data da OP
        processo.dataInicioPrevista = dataInicioOP.value
      } else {
        // Processos subsequentes: iniciam no dia seguinte ao término do anterior
        const processoAnterior = processosAtualizados[i - 1]
        const dataTerminoAnterior = new Date(processoAnterior.dataTerminoPrevista || dataInicioOP.value)
        dataTerminoAnterior.setDate(dataTerminoAnterior.getDate() + 1)
        processo.dataInicioPrevista = dataTerminoAnterior.toISOString().split('T')[0]
        dataInicioAtual = new Date(processo.dataInicioPrevista)
      }
      
      // Calcular data de término baseada no prazo
      if (processo.prazoEstimado && processo.prazoEstimado > 0) {
        const dataTermino = new Date(dataInicioAtual)
        dataTermino.setDate(dataTermino.getDate() + processo.prazoEstimado - 1)
        processo.dataTerminoPrevista = dataTermino.toISOString().split('T')[0]
        
        // ✅ ATUALIZAR NO BANCO DE DADOS
        if (processo.id) {
          await $fetch(`/api/ops/${route.params.id}/processos/${processo.id}`, {
            method: 'PUT',
            body: {
              dataInicioPrevista: processo.dataInicioPrevista,
              dataTerminoPrevista: processo.dataTerminoPrevista
            },
            headers: authHeaders.value
          })
        }
      }
    }
    
    // Recarregar processos após atualização
    await loadProcessos()
    
    console.log('✅ Datas recalculadas e salvas no banco')
  } catch (error) {
    console.error('❌ Erro ao recalcular datas:', error)
  }
}

const iniciarProcesso = async (processo) => {
  try {
    const response = await $fetch(`/api/ops/${route.params.id}/processos/${processo.id}/iniciar`, {
      method: 'POST'
    })
    
    // Atualizar objeto local com resposta da API
    if (response && response.processo) {
      Object.assign(processo, response.processo)
    }
    
    // Recarregar tudo para atualizar progresso geral
    await loadProcessos()
    await loadOP()
  } catch (error) {
    console.error('Erro ao iniciar processo:', error)
    alert('Erro ao iniciar processo: ' + (error.data?.message || error.message))
  }
}


const concluirProcesso = async (processo) => {
  try {
    const response = await $fetch(`/api/ops/${route.params.id}/processos/${processo.id}/concluir`, {
      method: 'POST'
    })
    
    if (response && response.processo) {
      Object.assign(processo, response.processo)
    }
    
    // Concluir afeta muito o progresso geral, importante recarregar
    await loadProcessos()
    await loadOP()
  } catch (error) {
    console.error('Erro ao concluir processo:', error)
    alert('Erro ao concluir processo: ' + (error.data?.message || error.message))
  }
}

const excluirProcesso = async (processo) => {
  if (confirm(`Tem certeza que deseja excluir o processo "${processo.nome}"?`)) {
    try {
      await $fetch(`/api/ops/${route.params.id}/processos/${processo.id}`, {
        method: 'DELETE'
      })
      
      processos.value = processos.value.filter(p => p.id !== processo.id)
    } catch (error) {
      console.error('Erro ao excluir processo:', error)
      alert('Erro ao excluir processo: ' + (error.data?.message || error.message))
    }
  }
}
</script>

<style scoped>
.processo-card {
  border-left: 4px solid v-bind('getStatusColor(processo?.status || "NAO_INICIADO")');
}

.gap-2 {
  gap: 8px;
}
</style>