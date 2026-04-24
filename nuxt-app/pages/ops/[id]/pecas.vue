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
            v-if="hasPermission('PCP', 'canEdit')"
            color="white"
            variant="flat"
            prepend-icon="mdi-factory"
            @click="generateOS"
            :loading="loadingOS"
          >
            Gerar PCP
          </v-btn>
          <v-btn
            v-if="hasPermission('Peças', 'canEdit')"
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
            v-if="hasPermission('Peças', 'canEdit')"
            color="white"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="openAddPecaDialog"
          >
            Peça
          </v-btn>
          <v-btn
            v-if="hasPermission('Peças', 'canEdit')"
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

    <!-- Balanço Financeiro da OP -->
    <v-expand-transition>
      <v-card v-if="custos" variant="outlined" class="mb-4 bg-blue-grey-lighten-5 border-primary">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-finance</v-icon>
              <h3 class="text-h6 font-weight-bold">Balanço Financeiro da Fabricação</h3>
            </div>
            <v-chip :color="custos.resumo.financeiro.statusOrcamento === 'DENTRO' ? 'success' : 'error'" variant="flat">
              Orçamento: {{ custos.resumo.financeiro.statusOrcamento }}
            </v-chip>
          </div>

          <v-row dense>
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="border">
                <v-card-text class="py-2">
                  <div class="text-caption text-grey">Orçamento Disponível</div>
                  <div class="text-h6">R$ {{ custos.op.orcamentoPrevisto?.toFixed(2) || '0.00' }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="border">
                <v-card-text class="py-2">
                  <div class="text-caption text-grey">Custo Líquido Real</div>
                  <div class="text-h6 text-primary">R$ {{ custos.resumo.totais.liquido.toFixed(2) }}</div>
                  <div class="text-caption text-success">- R$ {{ custos.resumo.totais.creditosImpostos.toFixed(2) }} em créditos</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="border">
                <v-card-text class="py-2">
                  <div class="text-caption text-grey">Valor de Venda</div>
                  <div class="text-h6">R$ {{ custos.op.valorVenda?.toFixed(2) || '0.00' }}</div>
                  <div v-if="custos.op.valorVenda" class="text-caption mt-1 font-weight-medium">
                    Margem Global: 
                    <span :class="custos.resumo.financeiro.lucroPrejuizoGlobal >= 0 ? 'text-success' : 'text-error'">
                      {{ custos.resumo.financeiro.margemGlobalPercentual.toFixed(1) }}%
                    </span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-card 
                elevation="0" 
                class="border" 
                :class="custos.resumo.financeiro.lucroPrejuizo >= 0 ? 'bg-green-lighten-5' : 'bg-red-lighten-5'"
              >
                <v-card-text class="py-2">
                  <div class="text-caption text-grey">Lucro / Prejuízo</div>
                  <div 
                    class="text-h6 font-weight-bold" 
                    :class="custos.resumo.financeiro.lucroPrejuizo >= 0 ? 'text-success' : 'text-error'"
                  >
                    R$ {{ custos.resumo.financeiro.lucroPrejuizo.toFixed(2) }}
                  </div>
                  <div class="text-caption font-weight-bold">Margem: {{ custos.resumo.financeiro.margemPercentual.toFixed(1) }}%</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-expand-transition>

    <!-- Resumo do Estoque e Prontidão -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="text-center h-100">
          <v-card-text>
            <div class="text-overline mb-1">Total de Peças (BOM)</div>
            <div class="text-h4 font-weight-bold">{{ pecas.length }}</div>
            <div class="text-caption text-grey">Itens cadastrados na engenharia</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="text-center h-100" color="success">
          <v-card-text>
            <div class="text-overline mb-1">Materiais em Estoque</div>
            <div class="text-h4 font-weight-bold">{{ pecasDisponiveis }}</div>
            <div class="text-caption">Prontas para uso imediato</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="elevated" class="text-center h-100 bg-grey-lighten-4" elevation="1">
          <v-card-text class="d-flex align-center justify-space-around py-2">
            <div class="text-left">
              <div class="text-overline mb-0">Prontidão da Máquina</div>
              <div class="text-h4 font-weight-black" :color="getProntidaoColor">
                {{ prontidaoGeral }}%
              </div>
              <div class="text-subtitle-2 font-weight-bold mt-1" :class="`text-${getProntidaoColor}`">
                {{ getProntidaoStatus }}
              </div>
            </div>
            <v-progress-circular
              :model-value="prontidaoGeral"
              :size="80"
              :width="12"
              :color="getProntidaoColor"
              rotate="270"
            >
              <v-icon size="32" :color="getProntidaoColor">
                {{ prontidaoGeral === 100 ? 'mdi-check-decagram' : 'mdi-cog-play' }}
              </v-icon>
            </v-progress-circular>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Abas de Visualização -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="bom" prepend-icon="mdi-format-list-bulleted">Peças e Materiais</v-tab>
      <v-tab value="kits" prepend-icon="mdi-package-variant">Kits de Montagem</v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <!-- Aba 1: BOM Geral -->
      <v-tabs-window-item value="bom">
        <v-card variant="outlined">
          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="pecas"
            :loading="loading"
            item-value="id"
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
              v-if="item.temNoEstoque && item.status !== 'EM_ESTOQUE' && item.status !== 'CONCLUIDA' && hasPermission('Peças', 'canEdit')"
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
              v-if="hasPermission('Peças', 'canEdit')"
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
              v-if="hasPermission('Peças', 'canEdit')"
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

        <template v-slot:item.valorUnitario="{ item }">
          <div :class="item.categoria === 'FABRICADO' ? 'text-primary' : ''">
            {{ item.valorUnitario ? (item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-' }}
          </div>
        </template>

        <template v-slot:item.custoTotal="{ item }">
          <div :class="item.categoria === 'FABRICADO' ? 'text-primary font-weight-bold' : ''">
            {{ item.custoTotal ? (item.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-' }}
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
                      v-if="hasPermission('Peças', 'canDelete')"
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
                  v-if="hasPermission('Peças', 'canEdit')"
                  prepend-icon="mdi-plus"
                  title="Adicionar Anexo"
                  @click="triggerDrawingUpload(item)"
                ></v-list-item>
              </v-list>
            </v-menu>

            <v-btn
              v-if="hasPermission('Peças', 'canEdit')"
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="grey-darken-1"
              title="Editar Peça"
              @click="openEditPeca(item)"
            ></v-btn>
            <v-btn
              v-if="hasPermission('Peças', 'canDelete')"
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
      </v-tabs-window-item>

      <!-- Aba 2: Kits de Montagem -->
      <v-tabs-window-item value="kits">
        <v-row class="pa-2">
          <v-col cols="12" md="6" lg="4" v-for="(kit, name) in kitsGrouped" :key="name">
            <v-card variant="outlined" class="mb-4 overflow-hidden border-2" :class="kit.progresso === 100 ? 'border-success' : ''">
              <v-card-title class="d-flex justify-space-between align-center bg-grey-lighten-4 pa-3">
                <div class="d-flex align-center">
                  <v-icon :color="kit.progresso === 100 ? 'success' : 'primary'" class="mr-2">
                    {{ kit.progresso === 100 ? 'mdi-package-variant-closed' : 'mdi-package-variant' }}
                  </v-icon>
                  <span class="text-subtitle-1 font-weight-bold">{{ name }}</span>
                </div>
                <v-chip :color="kit.progresso === 100 ? 'success' : 'primary'" size="small" variant="flat">
                  {{ kit.progresso }}%
                </v-chip>
              </v-card-title>
              
              <v-progress-linear
                :model-value="kit.progresso"
                :color="kit.progresso === 100 ? 'success' : 'primary'"
                height="6"
              ></v-progress-linear>

              <v-card-text class="pa-0" style="max-height: 300px; overflow-y: auto;">
                <v-list density="compact" class="py-0">
                  <v-list-item v-for="peca in kit.itens" :key="peca.id" class="border-bottom py-1">
                    <template v-slot:prepend>
                      <v-icon :color="pecaPronta(peca) ? 'success' : 'grey-lighten-1'" size="18">
                        {{ pecaPronta(peca) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                    </template>
                    <v-list-item-title class="text-caption font-weight-medium">
                      {{ peca.codigo }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-truncate" style="font-size: 10px;">
                      {{ peca.descricao }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-chip size="x-small" :color="getSuprimentoColor(peca.statusSuprimento)" variant="tonal" class="text-uppercase" style="font-size: 8px;">
                        {{ peca.statusSuprimento?.replace('_', ' ') }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Diálogo de Inserção/Edição de Peça -->
    <v-dialog v-model="dialogPeca.show" max-width="500px">
      <v-card>
        <v-card-title>{{ dialogPeca.isEdit ? 'Editar Peça' : 'Adicionar Peça Manualmente' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="dialogPeca.data.codigo" label="Código" variant="outlined"></v-text-field>
          <v-text-field v-model="dialogPeca.data.descricao" label="Descrição" variant="outlined"></v-text-field>
          <v-row>
            <v-col cols="4">
              <v-text-field v-model.number="dialogPeca.data.quantidade" label="Quantidade" type="number" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="8">
              <v-text-field v-model="dialogPeca.data.material" label="Material" variant="outlined" density="compact"></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-combobox
                v-model="dialogPeca.data.subconjunto"
                :items="subconjuntosExistentes"
                label="Subconjunto (Kit de Montagem)"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Ex: Eixo X, Gabinete, Painel Elétrico..."
                hint="As peças serão agrupadas nos Kits de Montagem baseadas neste nome"
                persistent-hint
              ></v-combobox>
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
          <v-btn
            v-if="hasPermission('Peças', 'canEdit')"
            color="primary"
            variant="flat"
            :loading="savingPeca"
            @click="savePecaManual"
          >
            Salvar Peça
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Processos -->
    <v-dialog v-model="dialogProcessos.show" max-width="1200px" scrollable>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center px-6 py-4 bg-primary text-white">
          <div class="d-flex align-center">
            <v-icon color="white" class="mr-2">mdi-cogs</v-icon>
            <span class="text-h6 font-weight-bold">Fluxo de Processos: {{ dialogProcessos.peca?.codigo }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="dialogProcessos.show = false"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-6 bg-grey-lighten-4" style="height: 60vh;">
          <div class="mb-4">
            <div class="text-subtitle-1 font-weight-black">{{ dialogProcessos.peca?.descricao }}</div>
            <div class="text-caption text-grey-darken-1">Defina a sequência de fabricação ou serviços externos para este item.</div>
          </div>

          <div v-if="dialogProcessos.items.length === 0" class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-tray-plus</v-icon>
            <p class="text-grey">Nenhum processo cadastrado para esta peça.</p>
          </div>
          
          <v-row v-else>
            <v-col cols="12" v-for="(proc, index) in dialogProcessos.items" :key="index">
              <v-card variant="outlined" class="rounded-lg" :style="{ borderLeft: `10px solid ${getStatusColor(proc.status)}` }" elevation="1">
                <v-card-text class="pa-4">
                  <v-row dense>
                    <v-col cols="12" md="4">
                      <v-combobox
                        v-model="proc.nome"
                        :items="processosDisponiveis"
                        label="Etapa / Processo"
                        placeholder="Ex: Corte Laser, Dobra, Usinagem..."
                        variant="outlined"
                        density="compact"
                        :prefix="`${index + 1}. `"
                      ></v-combobox>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-select
                        v-model="proc.status"
                        :items="[
                          { title: 'Não Iniciado', value: 'NAO_INICIADO' },
                          { title: 'Em Andamento', value: 'EM_ANDAMENTO' },
                          { title: 'Concluído', value: 'CONCLUIDO' }
                        ]"
                        label="Status"
                        variant="outlined"
                        density="compact"
                      >
                        <template v-slot:selection="{ item }">
                          <v-chip :color="getStatusColor(item.value)" size="x-small" label variant="flat" class="text-white">
                            {{ item.title }}
                          </v-chip>
                        </template>
                      </v-select>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-select
                        v-model="proc.fornecedorId"
                        :items="fornecedores"
                        item-title="nome"
                        item-value="id"
                        label="Responsável / Fornecedor"
                        variant="outlined"
                        density="compact"
                        placeholder="Setor interno ou Terceiro"
                        clearable
                      >
                      </v-select>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-text-field
                        v-model.number="proc.valorCusto"
                        label="Custo Serv."
                        type="number"
                        variant="outlined"
                        density="compact"
                        prefix="R$"
                        placeholder="0,00"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="1" class="d-flex align-center justify-end">
                      <v-btn
                        icon="mdi-delete-outline"
                        color="error"
                        variant="text"
                        size="small"
                        title="Remover etapa"
                        @click="removeProcess(index)"
                      ></v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="d-flex justify-center mt-4">
            <v-btn
              v-if="hasPermission('Peças', 'canEdit')"
              prepend-icon="mdi-plus-circle"
              variant="tonal"
              color="primary"
              rounded="pill"
              @click="addProcess"
            >
              Adicionar Nova Etapa
            </v-btn>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogProcessos.show = false">Fechar</v-btn>
          <v-btn
            v-if="hasPermission('Peças', 'canEdit')"
            color="success"
            variant="flat"
            size="large"
            rounded="lg"
            :loading="savingProcessos"
            @click="saveProcessos"
            prepend-icon="mdi-content-save-check"
          >
            Salvar Fluxo
          </v-btn>
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
const { authHeaders, hasPermission } = useAuth()
const loading = ref(false)
const loadingImport = ref(false)
const savingProcessos = ref(false)
const fileInput = ref(null)
const drawingInput = ref(null)
const selectedPecaForDrawing = ref(null)
const loadingOS = ref(false)
const loadingRelease = ref(false)
const selected = ref([])
const activeTab = ref('bom')
const custos = ref(null)

const pecaPronta = (peca) => {
  // Peça está pronta se já estiver em estoque ou concluída no fluxo
  if (['CONCLUIDA', 'EM_ESTOQUE'].includes(peca.status)) return true
  
  // Peça comprada está pronta se foi recebida
  if (peca.statusSuprimento === 'RECEBIDO') return true
  
  return false
}

const kitsGrouped = computed(() => {
  const groups = {}
  pecas.value.forEach(p => {
    // Usar subconjunto ou fallback para "OUTROS"
    const sub = p.subconjunto || 'CONJUNTO GERAL'
    if (!groups[sub]) groups[sub] = { itens: [], progresso: 0 }
    groups[sub].itens.push(p)
  })

  // Calcular progresso por grupo (porcentagem de peças prontas)
  for (const name in groups) {
    const itens = groups[name].itens
    const total = itens.length
    const prontos = itens.filter(p => pecaPronta(p)).length
    groups[name].progresso = total > 0 ? Math.round((prontos / total) * 100) : 0
  }

  return groups
})

const prontidaoGeral = computed(() => {
  if (pecas.value.length === 0) return 0
  const prontos = pecas.value.filter(p => pecaPronta(p)).length
  return Math.round((prontos / pecas.value.length) * 100)
})

const getProntidaoColor = computed(() => {
  const v = prontidaoGeral.value
  if (v === 100) return 'success'
  if (v >= 80) return 'primary'
  if (v >= 50) return 'orange'
  return 'error'
})

const getProntidaoStatus = computed(() => {
  const v = prontidaoGeral.value
  if (v === 100) return 'EQUIPAMENTO PRONTO PARA FINALIZAR'
  if (v >= 80) return 'PRONTO PARA INICIAR MONTAGEM'
  if (v >= 50) return 'MONTAGEM PARCIAL LIBERADA'
  if (v > 0) return 'AGUARDANDO MATERIAIS CRÍTICOS'
  return 'ENGENHARIA PENDENTE'
})

const subconjuntosExistentes = computed(() => {
  const subs = pecas.value.map(p => p.subconjunto).filter(Boolean)
  return [...new Set(subs)]
})

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
  { title: 'Valor Unit.', key: 'valorUnitario', align: 'end' },
  { title: 'Custo Total', key: 'custoTotal', align: 'end' },
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

const loadCustos = async () => {
  try {
    custos.value = await $fetch(`/api/ops/${opId}/custos`)
  } catch (error) {
    console.error('Erro ao carregar custos:', error)
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
    fornecedorId: null,
    valorCusto: null
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
    // Status de Peça (PecaStatus)
    NAO_INICIADA: '#757575',
    EM_ESTOQUE: '#2E7D32',
    AGUARDANDO_RECEBIMENTO: '#0288D1',
    // Status de Processo (ProcessoStatus)
    NAO_INICIADO: '#757575',
    EM_ANDAMENTO: '#1976D2',
    EM_PRODUCAO: '#1976D2', 
    CONCLUIDO: '#4CAF50',
    CONCLUIDA: '#4CAF50',
    CANCELADO: '#D32F2F',
    BLOQUEADO: '#F44336'
  }
  return colors[status] || '#757575'
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
      showSnackbar(`${selected.value.length} itens liberados! Gerando ordens de serviço...`)
      
      // Chamar geração de OS automaticamente após liberar
      await $fetch(`/api/ops/${route.params.id}/pcp/generate-os`, { method: 'POST' })
      
      showSnackbar('Ordens de Serviço (OS) geradas com sucesso no PCP!', 'success')
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
  loadCustos()
})
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
