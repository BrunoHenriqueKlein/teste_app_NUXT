<template>
  <div class="pa-4">
    <!-- Breadcrumbs -->
    <v-breadcrumbs :items="breadcrumbs" class="px-0 pt-0"></v-breadcrumbs>

    <!-- Header Standard -->
    <PageHeader icon="mdi-cogs">
      <template #title>
        <h1 class="text-h5 font-weight-bold mb-1">
          Lista de Peças (BOM) - OP {{ custos?.op?.numeroOP || '...' }}
        </h1>
      </template>
      <template #subtitle>
        <div class="text-subtitle-1 font-weight-medium mb-1">
          Equipamento: {{ custos?.op?.codigoMaquina || '...' }} - {{ custos?.op?.descricaoMaquina || '...' }}
        </div>
        <div class="text-caption opacity-80">
          Cliente: {{ custos?.op?.cliente || '...' }}
        </div>
      </template>
      <template #actions>
          <v-btn
            v-if="hasPermission('PCP', 'canEdit')"
            :color="temProcessoPendenteOS ? 'warning' : 'white'"
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
          <v-btn
            color="white"
            variant="outlined"
            prepend-icon="mdi-export"
            @click="exportBOM"
          >
            Exportar
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
          <v-expansion-panels class="mb-4" variant="accordion">
            <v-expansion-panel elevation="0" class="border">
              <v-expansion-panel-title class="text-subtitle-2 text-primary font-weight-bold">
                <v-icon start color="primary">mdi-filter-variant</v-icon> Filtros Avançados
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense class="mt-2">
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="filtrosAvançados.busca"
                      label="Buscar Código ou Descrição"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filtrosAvançados.categoria"
                      :items="categoriasUnicasBOM"
                      label="Categoria"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filtrosAvançados.subcategoria"
                      :items="subcategoriasUnicasBOM"
                      label="Subcategoria"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filtrosAvançados.subconjunto"
                      :items="subconjuntosExistentes"
                      label="Subconjunto"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filtrosAvançados.processo"
                      :items="processosUnicosBOM"
                      label="Processo"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-select
                      v-model="filtrosAvançados.fornecedor"
                      :items="fornecedoresUnicos"
                      label="Fornecedor"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="pecasFiltradas"
            :loading="loading"
            item-value="id"
            show-select
            hover
            density="compact"
            items-per-page="-1"
            no-data-text="Nenhuma peça encontrada."
          >
            <template v-slot:bottom></template>
        <!-- Customização das Colunas -->
        <template v-slot:item.peca="{ item }">
          <div style="white-space: normal; word-break: break-all; overflow-wrap: break-word;">
            <div class="font-weight-bold text-primary">{{ item.codigo }}</div>
            <div class="text-caption text-grey-darken-1 mt-1">{{ item.descricao }}</div>
          </div>
        </template>

        <template v-slot:item.categoria="{ item }">
          <v-chip size="x-small" :color="item.categoria === 'COMERCIAL' ? 'blue' : 'orange'" class="font-weight-bold" variant="outlined">
            {{ item.categoria }}
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
            class="text-uppercase"
          >
            {{ item.status === 'EM_ESTOQUE' ? 'FINALIZADA' : item.status.replace('_', ' ') }}
          </v-chip>
        </template>

        <template v-slot:item.statusSuprimento="{ item }">
          <div class="d-flex flex-column align-center">
            <v-chip
              :color="getSuprimentoColor(item.statusSuprimento)"
              size="x-small"
              variant="flat"
              class="text-uppercase"
            >
              {{ item.statusSuprimento.replace('_', ' ') }}
            </v-chip>
            <div v-if="item.compras && item.compras.length > 0" class="mt-1 d-flex flex-column gap-1 align-center">
              <v-chip
                v-for="comp in item.compras"
                :key="comp.id"
                color="indigo-darken-1"
                variant="outlined"
                size="x-small"
                prepend-icon="mdi-file-document-outline"
              >
                {{ comp.compra?.numero }}
              </v-chip>
            </div>
          </div>
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
            <div v-if="item.anexos && item.anexos.length > 0" class="d-flex flex-column gap-1 mb-1 align-center">
              <v-chip
                v-for="anexo in item.anexos"
                :key="anexo.id"
                size="x-small"
                color="info"
                variant="tonal"
                @click="viewDrawing(anexo.url)"
                :title="'Visualizar: ' + anexo.nome"
                class="px-2 pr-1"
                style="max-width: 120px;"
              >
                <v-icon start size="12">mdi-file-pdf-box</v-icon>
                <span class="text-truncate" style="font-size: 10px;">{{ truncateName(anexo.nome) }}</span>
                <v-btn icon="mdi-download" size="x-small" variant="text" class="ml-1" @click.stop="downloadDrawing(anexo.url, anexo.nome)" title="Baixar Arquivo" density="compact" style="height: 16px; width: 16px;"></v-btn>
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
          <div class="d-flex justify-center align-center h-100 w-100">
            <div 
              v-if="item.processos && item.processos.length > 0" 
              class="d-flex flex-column align-center justify-center pa-2 rounded hover-bg" 
              @click="openProcessos(item)" 
              style="cursor: pointer; min-width: 120px;"
            >
              <v-chip :color="getEtapaColor(item.processos)" size="x-small" variant="flat" class="mb-1 font-weight-bold">
                {{ getEtapaAtiva(item.processos) }}
              </v-chip>
              <div class="d-flex align-center w-100" style="gap: 4px;">
                <v-progress-linear 
                  :model-value="getProgressoProcessos(item.processos)"
                  :color="getProgressoProcessos(item.processos) === 100 ? 'success' : 'primary'"
                  height="6"
                  rounded
                ></v-progress-linear>
                <span class="text-caption font-weight-bold" style="font-size: 10px;">
                  {{ item.processos.filter(p => p.status === 'CONCLUIDO').length }}/{{ item.processos.length }}
                </span>
              </div>
            </div>
            
            <v-btn
              v-else-if="hasPermission('Peças', 'canEdit')"
              icon="mdi-plus"
              variant="tonal"
              size="small"
              color="grey"
              title="Criar Roteiro"
              @click="openProcessos(item)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:item.valores="{ item }">
          <div class="d-flex flex-column align-end" :class="item.categoria === 'FABRICADO' ? 'text-primary' : ''">
            <div class="font-weight-bold">
              {{ item.custoTotal ? (item.custoTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-' }}
            </div>
            <div class="text-caption text-grey" style="white-space: nowrap;">
              {{ item.quantidade }}x 
              <template v-if="item.valorUnitario">
                {{ (item.valorUnitario + (item.valorUnitario * (item.valorIPI || 0) / 100) + (item.valorUnitario * (item.valorICMS || 0) / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                <v-tooltip activator="parent" location="top" v-if="item.valorIPI || item.valorICMS">
                  Base: {{ item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }} | IPI: {{ item.valorIPI || 0 }}% | ICMS: {{ item.valorICMS || 0 }}%
                </v-tooltip>
              </template>
              <span v-else>?</span>
            </div>
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
                  title="Visualizar em nova guia"
                >
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-file-pdf-box</v-icon>
                  </template>
                  <v-list-item-title>{{ truncateName(anexo.nome) }}</v-list-item-title>
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-download"
                      variant="text"
                      size="x-small"
                      color="primary"
                      @click.stop="downloadDrawing(anexo.url, anexo.nome)"
                      title="Baixar Arquivo"
                      class="mr-1"
                    ></v-btn>
                    <v-btn
                      v-if="hasPermission('Peças', 'canDelete')"
                      icon="mdi-delete"
                      variant="text"
                      size="x-small"
                      color="error"
                      @click.stop="deleteAttachment(anexo.id)"
                      title="Remover Anexo"
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
              :color="isPecaBloqueada(item) ? 'grey-lighten-2' : 'grey-darken-1'"
              :title="isPecaBloqueada(item) ? 'Edição bloqueada: Peça já está no fluxo de compras' : 'Editar Peça'"
              :disabled="isPecaBloqueada(item)"
              @click="openEditPeca(item)"
            ></v-btn>
            <v-btn
              v-if="hasPermission('Peças', 'canDelete')"
              icon="mdi-delete"
              variant="text"
              size="small"
              :color="isPecaBloqueada(item) ? 'grey-lighten-2' : 'error'"
              :title="isPecaBloqueada(item) ? 'Exclusão bloqueada: Peça já está no fluxo de compras' : 'Excluir Peça'"
              :disabled="isPecaBloqueada(item)"
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
                label="Categoria *"
                :items="['FABRICADO', 'COMERCIAL']"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Categoria obrigatória']"
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
          <v-row v-if="dialogPeca.data.categoria === 'COMERCIAL'">
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
          <v-row v-if="dialogPeca.data.categoria === 'COMERCIAL'">
            <v-col cols="12">
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
            <v-col cols="4">
              <v-text-field
                v-model.number="dialogPeca.data.valorIPI"
                label="IPI"
                type="number"
                suffix="%"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="dialogPeca.data.valorICMS"
                label="ICMS"
                type="number"
                suffix="%"
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
                    <v-col cols="12" md="3" class="d-flex align-center justify-center">
                      <div class="d-flex flex-column align-center w-100">
                        <div class="text-caption mb-1">Status da Etapa</div>
                        
                        <v-btn
                          v-if="proc.status === 'NAO_INICIADO'"
                          color="primary"
                          variant="tonal"
                          size="small"
                          prepend-icon="mdi-truck-fast"
                          @click="proc.status = 'EM_ANDAMENTO'"
                          class="w-100"
                        >
                          Despachar / Iniciar
                        </v-btn>

                        <v-btn
                          v-else-if="proc.status === 'EM_ANDAMENTO'"
                          color="warning"
                          variant="elevated"
                          size="small"
                          prepend-icon="mdi-package-down"
                          @click="proc.status = 'CONCLUIDO'"
                          class="w-100 font-weight-bold"
                        >
                          Registrar Retorno
                        </v-btn>

                        <v-chip
                          v-else-if="proc.status === 'CONCLUIDO'"
                          color="success"
                          variant="flat"
                          prepend-icon="mdi-check-circle"
                          class="w-100 justify-center font-weight-bold"
                        >
                          Concluído
                        </v-chip>
                        
                        <!-- Permite desfazer clicando num botão pequeno caso tenha errado -->
                        <v-btn
                          v-if="proc.status !== 'NAO_INICIADO'"
                          variant="text"
                          size="x-small"
                          color="grey"
                          class="mt-1"
                          @click="proc.status = 'NAO_INICIADO'"
                        >
                          Desfazer Status
                        </v-btn>
                      </div>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-select
                        v-model="proc.fornecedorId"
                        :items="fornecedores"
                        item-title="nome"
                        item-value="id"
                        label="Fornecedor/Responsável"
                        variant="outlined"
                        density="compact"
                        placeholder="Quem faz?"
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
                    <v-col cols="12" md="2">
                      <v-text-field
                        v-model.number="proc.valorIPI"
                        label="IPI"
                        type="number"
                        variant="outlined"
                        density="compact"
                        suffix="%"
                        placeholder="0,00"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-text-field
                        v-model.number="proc.valorICMS"
                        label="ICMS"
                        type="number"
                        variant="outlined"
                        density="compact"
                        suffix="%"
                        placeholder="0,00"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="1" class="d-flex flex-column align-center justify-center">
                      <div class="d-flex w-100 justify-space-between mb-1" style="max-width: 60px;">
                        <v-btn
                          icon="mdi-arrow-up"
                          color="primary"
                          variant="tonal"
                          size="x-small"
                          title="Mover para cima"
                          :disabled="index === 0 || !canMoveProcess(index, -1)"
                          @click="moveProcess(index, -1)"
                        ></v-btn>
                        <v-btn
                          icon="mdi-arrow-down"
                          color="primary"
                          variant="tonal"
                          size="x-small"
                          title="Mover para baixo"
                          :disabled="index === dialogProcessos.items.length - 1 || !canMoveProcess(index, 1)"
                          @click="moveProcess(index, 1)"
                        ></v-btn>
                      </div>
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
import * as XLSX from 'xlsx'

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

const filtrosAvançados = reactive({
  busca: '',
  categoria: null,
  subcategoria: null,
  subconjunto: null,
  processo: null,
  fornecedor: null
})

const fornecedoresUnicos = computed(() => {
  const fSet = new Set()
  pecas.value.forEach(p => {
    if (p.fornecedor && p.fornecedor.nome) {
      fSet.add(p.fornecedor.nome)
    }
    if (p.compras && p.compras.length > 0) {
      p.compras.forEach(c => {
        if (c.compra && c.compra.fornecedor) fSet.add(c.compra.fornecedor)
      })
    }
    if (p.processos && p.processos.length > 0) {
      p.processos.forEach(proc => {
        if (proc.fornecedorRef && proc.fornecedorRef.nome) fSet.add(proc.fornecedorRef.nome)
      })
    }
  })
  return Array.from(fSet).sort()
})

const categoriasUnicasBOM = computed(() => {
  const cSet = new Set()
  pecas.value.forEach(p => {
    if (p.categoria) cSet.add(p.categoria)
  })
  return Array.from(cSet).sort()
})

const subcategoriasUnicasBOM = computed(() => {
  const scSet = new Set()
  pecas.value.forEach(p => {
    if (p.subcategoria) scSet.add(p.subcategoria)
  })
  return Array.from(scSet).sort()
})

const processosUnicosBOM = computed(() => {
  const pSet = new Set()
  pecas.value.forEach(p => {
    if (p.processos && p.processos.length > 0) {
      p.processos.forEach(proc => pSet.add(proc.nome))
    }
  })
  return Array.from(pSet).sort()
})

const pecasFiltradas = computed(() => {
  return pecas.value.filter(p => {
    if (filtrosAvançados.busca) {
      const q = filtrosAvançados.busca.toLowerCase()
      const codigoMatch = p.codigo?.toLowerCase().includes(q)
      const descMatch = p.descricao?.toLowerCase().includes(q)
      if (!codigoMatch && !descMatch) return false
    }
    if (filtrosAvançados.categoria && p.categoria !== filtrosAvançados.categoria) return false
    if (filtrosAvançados.subcategoria && p.subcategoria !== filtrosAvançados.subcategoria) return false
    if (filtrosAvançados.subconjunto && p.subconjunto !== filtrosAvançados.subconjunto) return false
    if (filtrosAvançados.processo) {
      const temProcesso = p.processos?.some(proc => proc.nome === filtrosAvançados.processo)
      if (!temProcesso) return false
    }
    if (filtrosAvançados.fornecedor) {
      const f = filtrosAvançados.fornecedor
      const temFornecedorDireto = p.fornecedor?.nome === f
      const temCompra = p.compras?.some(c => c.compra?.fornecedor === f)
      const temProcessoExt = p.processos?.some(proc => proc.fornecedorRef?.nome === f)
      if (!temFornecedorDireto && !temCompra && !temProcessoExt) return false
    }
    return true
  })
})

const pecaPronta = (peca) => {
  // Peça está pronta se já estiver em estoque ou concluída no fluxo
  if (['CONCLUIDA', 'EM_ESTOQUE'].includes(peca.status)) return true
  
  // Peça comprada está pronta se foi recebida
  if (peca.statusSuprimento === 'RECEBIDO') return true
  
  return false
}

const isPecaBloqueada = (peca) => {
  // Bloqueia edição se a peça já foi comprada ou recebida (mesmo que parcialmente)
  const statusBloqueados = ['COMPRADO', 'RECEBIDO_PARCIAL', 'RECEBIDO']
  return statusBloqueados.includes(peca.statusSuprimento)
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

const temProcessoPendenteOS = computed(() => {
  return pecas.value.some(peca => 
    peca.processos && peca.processos.some(p => p.osId === null)
  )
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
  { title: 'Peça', key: 'peca', sortable: true, minWidth: '300px' },
  { title: 'Qtd', key: 'quantidade', align: 'end', width: '60px' },
  { title: 'Categoria', key: 'categoria', align: 'center', width: '100px' },
  { title: 'Material', key: 'material', width: '100px' },
  { title: 'Desenho', key: 'desenho', align: 'center', sortable: false, width: '120px' },
  { title: 'Processos', key: 'processos', align: 'center', sortable: false, width: '90px' },
  { title: 'Status', key: 'status', align: 'center', width: '120px' },
  { title: 'Suprimento', key: 'statusSuprimento', align: 'center', width: '120px' },
  { title: 'Estoque', key: 'estoque', align: 'center', width: '130px' },
  { title: 'Valores', key: 'valores', align: 'end', width: '110px' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false, width: '100px' }
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
      valorIPI: null,
      valorICMS: null,
      fornecedorId: null
    }
  }
}

const openEditPeca = (peca) => {
  if (isPecaBloqueada(peca)) {
    showSnackbar('Esta peça não pode mais ser editada pois já passou pelo setor de suprimentos.', 'warning')
    return
  }
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

const exportBOM = () => {
  if (!pecas.value || pecas.value.length === 0) {
    showSnackbar('A Lista de Peças está vazia', 'warning')
    return
  }

  // Preparar os dados para exportação no mesmo padrão do template de importação
  const exportData = pecas.value.map(peca => {
    const row = {
      'Codigo': peca.codigo,
      'Descricao': peca.descricao,
      'Quantidade': peca.quantidade,
      'Material': peca.material || '',
      'Subcategoria': peca.subcategoria || '',
      'Subconjunto': peca.subconjunto || '',
      'Categoria': peca.categoria || '',
      'ValorUnitario': peca.valorUnitario || ''
    }

    if (peca.processos && peca.processos.length > 0) {
      // Ordenar por sequencia para garantir a ordem correta
      const processosOrdenados = [...peca.processos].sort((a, b) => a.sequencia - b.sequencia)
      processosOrdenados.forEach((p, index) => {
        row[`Processo${index + 1}`] = p.nome
      })
    }
    
    return row
  })

  // Criar a planilha
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Peças')

  // Gerar o arquivo e realizar o download
  const opNumber = opId || 'OP'
  XLSX.writeFile(workbook, `BOM_${opNumber}.xlsx`)
  showSnackbar('Arquivo exportado com sucesso!')
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

const canMoveProcess = (index, direction) => {
  const currentProcess = dialogProcessos.value.items[index]
  const targetProcess = dialogProcessos.value.items[index + direction]
  
  if (!currentProcess || !targetProcess) return false
  
  // Só permite reordenar se ambos os processos envolvidos na troca estiverem NÃO_INICIADO
  return currentProcess.status === 'NAO_INICIADO' && targetProcess.status === 'NAO_INICIADO'
}

const moveProcess = (index, direction) => {
  if (!canMoveProcess(index, direction)) {
    showSnackbar('Ação não permitida: Processos já iniciados não podem ser reordenados.', 'warning')
    return
  }
  
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= dialogProcessos.value.items.length) return
  
  const items = dialogProcessos.value.items
  const temp = items[index]
  items[index] = items[newIndex]
  items[newIndex] = temp
}

const addProcess = () => {
  dialogProcessos.value.items.push({
    nome: '',
    status: 'NAO_INICIADO',
    fornecedorId: null,
    valorCusto: null,
    valorIPI: null,
    valorICMS: null
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
    PARA_COTACAO: 'purple-darken-1',
    EM_ORCAMENTO: 'orange-darken-1',
    COMPRADO: 'blue-darken-2',
    RECEBIDO_PARCIAL: 'teal',
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

const downloadDrawing = async (url, name) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = name || 'desenho'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
  } catch (error) {
    console.error('Erro ao forçar download, abrindo em nova guia:', error)
    window.open(url, '_blank')
  }
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

const getEtapaAtiva = (processos) => {
  if (!processos || processos.length === 0) return 'Sem roteiro'
  
  // Ordena por sequencia
  const ordenados = [...processos].sort((a, b) => a.sequencia - b.sequencia)
  
  // 1. Procura o que está em andamento
  const emAndamento = ordenados.find(p => p.status === 'EM_ANDAMENTO')
  if (emAndamento) return `${emAndamento.sequencia}. ${emAndamento.nome}`

  // 2. Se tudo concluído
  const todosConcluidos = ordenados.every(p => p.status === 'CONCLUIDO')
  if (todosConcluidos) return 'Finalizado'

  // 3. Procura o próximo a ser iniciado (o primeiro não iniciado)
  const proximo = ordenados.find(p => p.status === 'NAO_INICIADO')
  if (proximo) return `Aguardando ${proximo.sequencia}. ${proximo.nome}`

  return 'Pendente'
}

const getEtapaColor = (processos) => {
  if (!processos || processos.length === 0) return 'grey'
  const ordenados = [...processos].sort((a, b) => a.sequencia - b.sequencia)
  
  if (ordenados.every(p => p.status === 'CONCLUIDO')) return 'success'
  if (ordenados.some(p => p.status === 'EM_ANDAMENTO')) return 'warning'
  return 'primary'
}

const getProgressoProcessos = (processos) => {
  if (!processos || processos.length === 0) return 0
  const concluidos = processos.filter(p => p.status === 'CONCLUIDO').length
  return Math.round((concluidos / processos.length) * 100)
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

:deep(.v-data-table th),
:deep(.v-data-table td) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}
</style>
