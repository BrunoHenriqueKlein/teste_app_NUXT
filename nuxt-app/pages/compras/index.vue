<template>
  <div class="pa-4">
    <!-- Header Standard -->
    <PageHeader 
      title="Gestão de Compras" 
      subtitle="Requisições, cotações e ordens de compra"
      icon="mdi-cart"
    >
      <template #actions>
        <v-btn
          v-if="hasPermission('Compras', 'canEdit')"
          color="white"
          variant="outlined"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
        >
          Nova Requisição
        </v-btn>
      </template>
    </PageHeader>

    <!-- Hub de Navegação -->
    <v-row class="mt-2">
      <v-col cols="12" md="4">
        <v-card 
          link 
          to="/compras/cotacoes" 
          variant="outlined" 
          class="pa-4 d-flex align-center" 
          height="120"
          hover
        >
          <v-icon size="40" color="primary" class="mr-4">mdi-calculator</v-icon>
          <div>
            <div class="text-h6">Cotações e Orçamentos</div>
            <div class="text-body-2 text-grey">Definir preços, fornecedores e impostos</div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card 
          link 
          to="/compras/recebimento" 
          variant="outlined" 
          class="pa-4 d-flex align-center" 
          height="120"
          hover
        >
          <v-icon size="40" color="success" class="mr-4">mdi-truck-check</v-icon>
          <div>
            <div class="text-h6">Recebimento</div>
            <div class="text-body-2 text-grey">Dar baixa em OCs e conferir NF</div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card 
          variant="outlined" 
          class="pa-4 d-flex align-center grey lighten-4" 
          height="120"
          style="opacity: 0.7"
        >
          <v-icon size="40" color="orange" class="mr-4">mdi-store-alert</v-icon>
          <div>
            <div class="text-h6 text-grey-darken-2">Gestão de Estoque</div>
            <div class="text-body-2 text-grey">Em breve: Reposição automática</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="requisicoes">
        <v-badge :content="requisicoesEngenharia.length" color="error" :model-value="requisicoesEngenharia.length > 0" class="mr-2">
          Requisições da Engenharia
        </v-badge>
      </v-tab>
      <v-tab value="pedidos">Pedidos de Compra (OCs)</v-tab>
      <v-tab value="finalizadas">Finalizadas / Recebidas</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="requisicoes">
        <v-card variant="outlined">
          <v-data-table
            :headers="headersRequisicoes"
            :items="requisicoesEngenharia"
            :loading="loading"
            hover
          >
            <template v-slot:item.op="{ item }">
              <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span>
            </template>
            <template v-slot:item.categoria="{ item }">
              <v-chip size="x-small" color="indigo" variant="flat">
                {{ item.fornecedor.replace('REQ_', '') }}
              </v-chip>
            </template>
            <template v-slot:item.acoes="{ item }">
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-eye"
                @click="verDetalhesRequisicao(item)"
              >
                Tratar
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="pedidos">
        <v-card variant="outlined">
          <v-data-table
            :headers="headers"
            :items="activeOrders"
            :loading="loading"
            hover
          >
            <template v-slot:item.numero="{ item }">
              <div class="font-weight-bold">{{ item.numero }}</div>
            </template>
            <template v-slot:item.op="{ item }">
              <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small">
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.acoes_oc="{ item }">
              <v-btn
                icon="mdi-truck-check"
                variant="text"
                color="success"
                size="small"
                @click="abrirRecebimento(item)"
                title="Registrar Recebimento (NF)"
              ></v-btn>
              <v-btn
                icon="mdi-printer"
                variant="text"
                color="primary"
                size="small"
                @click="prepararImpressao(item)"
                title="Imprimir OC"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="finalizadas">
        <v-card variant="outlined">
          <v-data-table
            :headers="headers"
            :items="finalizedOrders"
            :loading="loading"
            hover
          >
            <template v-slot:item.numero="{ item }">
              <div class="font-weight-bold">{{ item.numero }}</div>
            </template>
            <template v-slot:item.op="{ item }">
              <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip color="success" size="small" variant="tonal">
                RECEBIDA
              </v-chip>
            </template>
            <template v-slot:item.acoes_oc="{ item }">
              <v-btn
                icon="mdi-eye"
                variant="text"
                color="primary"
                size="small"
                @click="verDetalhesOC(item)"
                title="Ver Detalhes"
              ></v-btn>
              <v-btn
                icon="mdi-printer"
                variant="text"
                color="grey"
                size="small"
                @click="prepararImpressao(item)"
                title="Imprimir OC"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Adicionar Requisição Manual -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title>Nova Requisição de Compra</v-card-title>
        <v-card-text>
          <v-select
            v-model="dialog.data.opId"
            :items="ops"
            item-title="numeroOP"
            item-value="id"
            label="Vincular à OP"
            variant="outlined"
          ></v-select>
          <v-text-field v-model="dialog.data.fornecedor" label="Fornecedor Sugerido" variant="outlined"></v-text-field>
          
          <h3 class="text-subtitle-1 mb-2">Itens para Compra</h3>
          <v-row v-for="(item, index) in dialog.data.itens" :key="index" dense>
            <v-col cols="8">
              <v-text-field v-model="item.descricao" label="Descrição do Item" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="item.quantidade" label="Qtd" type="number" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="1">
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeItem(index)"></v-btn>
            </v-col>
          </v-row>
          <v-btn variant="text" color="primary" prepend-icon="mdi-plus" @click="addItem">Adicionar Item</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveCompra">Solicitar Compra</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Diálogo de Detalhes da Requisição -->
    <v-dialog v-model="dialogDetalhes.show" max-width="900px">
      <v-card v-if="dialogDetalhes.requisicao">
        <v-card-title class="bg-primary text-white d-flex justify-space-between align-center pa-4">
          <div>
            <div class="text-h6">Requisição {{ dialogDetalhes.requisicao.numero }}</div>
            <div class="text-subtitle-2">OP #{{ dialogDetalhes.requisicao.op?.numeroOP }} - {{ dialogDetalhes.requisicao.op?.cliente }}</div>
          </div>
          <v-chip color="white" variant="flat" size="small">
            {{ (dialogDetalhes.requisicao.fornecedor || '').replace('REQ_', '') }}
          </v-chip>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            title="Instruções para Compras"
          >
            Selecione o fornecedor vencedor e preencha os valores negociados. Ao emitir a OC, os status de produção da peça na BOM serão atualizados automaticamente.
          </v-alert>

          <v-row dense>
             <v-col cols="12" md="8">
               <v-select
                 v-model="dialogDetalhes.fornecedorId"
                 :items="fornecedores"
                 item-title="nome"
                 item-value="id"
                 label="Fornecedor Vencedor"
                 variant="outlined"
                 density="compact"
                 color="primary"
                 prepend-inner-icon="mdi-badge-account"
               ></v-select>
             </v-col>
             <v-col cols="12" md="4">
               <v-text-field
                 v-model="dialogDetalhes.dataPrevisao"
                 label="Previsão de Entrega"
                 type="date"
                 variant="outlined"
                 density="compact"
               ></v-text-field>
             </v-col>
          </v-row>

          <v-table density="compact" class="mb-4">
            <thead>
              <tr>
                <th style="width: 40px;">
                  <v-checkbox-btn
                    v-model="selecionarTodosItens"
                    color="white"
                    density="compact"
                    hide-details
                    @change="toggleSelectAll"
                  ></v-checkbox-btn>
                </th>
                <th class="text-left font-weight-bold">Item / Descrição</th>
                <th class="text-center font-weight-bold" style="width: 80px;">Qtd</th>
                <th class="text-center font-weight-bold" style="width: 120px;">Vlr. Unit (R$)</th>
                <th class="text-center font-weight-bold" style="width: 80px;">IPI (%)</th>
                <th class="text-center font-weight-bold" style="width: 80px;">ICMS (%)</th>
                <th class="text-right font-weight-bold" style="width: 120px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dialogDetalhes.requisicao.itens" :key="item.id" :class="{'bg-blue-lighten-5': item.selected}">
                <td>
                  <v-checkbox-btn
                    v-model="item.selected"
                    color="primary"
                    density="compact"
                    hide-details
                  ></v-checkbox-btn>
                </td>
                <td>
                  <div class="font-weight-bold">{{ item.peca?.codigo || '-' }}</div>
                  <div class="text-caption text-grey">{{ item.descricao }}</div>
                </td>
                <td class="text-center">{{ item.quantidade }}</td>
                <td>
                  <v-text-field
                    v-model.number="item.valorUnitario"
                    type="number"
                    variant="underlined"
                    density="compact"
                    hide-details
                    prefix="R$"
                    @update:model-value="recacheTotals"
                  ></v-text-field>
                </td>
                <td>
                  <v-text-field
                    v-model.number="item.aliqIPI"
                    type="number"
                    variant="underlined"
                    density="compact"
                    hide-details
                    suffix="%"
                    @update:model-value="recacheTotals"
                  ></v-text-field>
                </td>
                <td>
                  <v-text-field
                    v-model.number="item.aliqICMS"
                    type="number"
                    variant="underlined"
                    density="compact"
                    hide-details
                    suffix="%"
                    @update:model-value="recacheTotals"
                  ></v-text-field>
                </td>
                <td class="text-right font-weight-bold">
                  {{ formatCurrency(calculateItemTotal(item)) }}
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-4"></v-divider>

          <!-- Gestão de Orçamentos Anexos -->
          <div class="mb-4">
            <div class="text-subtitle-1 font-weight-bold d-flex justify-space-between align-center mb-2">
              Orçamentos Recebidos (Anexos)
              <v-btn size="small" variant="tonal" prepend-icon="mdi-upload" @click="$refs.anexoInput.click()" :loading="uploading">
                Anexar PDF / Imagem
              </v-btn>
              <input type="file" ref="anexoInput" class="d-none" @change="uploadAnexo" accept=".pdf,.png,.jpg,.jpeg">
            </div>
            
            <div v-if="dialogDetalhes.requisicao.anexos && dialogDetalhes.requisicao.anexos.length > 0">
              <v-list density="compact" class="bg-grey-lighten-4 rounded" border>
                <v-list-item v-for="anexo in dialogDetalhes.requisicao.anexos" :key="anexo.id">
                  <template v-slot:prepend>
                    <v-icon color="error" v-if="anexo.url.endsWith('.pdf')">mdi-file-pdf-box</v-icon>
                    <v-icon color="primary" v-else>mdi-file-image</v-icon>
                  </template>
                  <v-list-item-title class="text-caption font-weight-bold">{{ anexo.nome }}</v-list-item-title>
                  <template v-slot:append>
                    <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="visualizarAnexo(anexo)" title="Visualizar Orçamento Inline"></v-btn>
                    <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="excluirAnexo(dialogDetalhes.requisicao.id, anexo.id)"></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            <div v-else class="text-caption text-grey text-center py-4 bg-grey-lighten-4 rounded border">
              <v-icon size="24" color="grey-lighten-1" class="mb-2">mdi-file-hidden</v-icon><br>
              Nenhum orçamento anexado. Insira a proposta do fornecedor para auditar a compra.
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="dialogDetalhes.valorFrete"
                label="Valor do Frete"
                prefix="R$"
                variant="outlined"
                density="compact"
                @update:model-value="recacheTotals"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="dialogDetalhes.valorDesconto"
                label="Desconto Total"
                prefix="R$"
                variant="outlined"
                density="compact"
                @update:model-value="recacheTotals"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <!-- Removido redundante -->
            </v-col>
            <v-col cols="12" md="3" class="text-right">
              <div class="text-overline">Total do Pedido</div>
              <div class="text-h5 font-weight-bold text-success">{{ formatCurrency(totalPedidoCalculado) }}</div>
            </v-col>
          </v-row>

          <v-textarea
            v-model="dialogDetalhes.observacoes"
            label="Observações para o Fornecedor"
            variant="outlined"
            rows="2"
            class="mt-2"
          ></v-textarea>
        </v-card-text>

        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDetalhes.show = false">Desistir</v-btn>
          <v-btn
            v-if="temItensSelecionados"
            :color="todosItensSelecionados ? 'success' : 'indigo'"
            variant="flat"
            :loading="saving"
            @click="emitirOC"
            :prepend-icon="todosItensSelecionados ? 'mdi-file-check' : 'mdi-content-cut'"
          >
            {{ todosItensSelecionados ? 'Emitir Ordem de Compra' : 'Emitir OC Parcial (itens marcados)' }}
          </v-btn>
          <v-btn v-else disabled variant="tonal">Selecione itens</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Layout de Impressão de OC (Oculto na Web) -->
    <div id="print-oc" class="d-none print-only pa-8">
      <div v-if="printData" class="oc-layout">
        <!-- Cabeçalho Empresa -->
        <div class="d-flex justify-space-between align-start mb-8 border-bottom pb-4">
          <div class="d-flex">
            <v-img :src="empresa?.logoUrl" width="100" class="mr-4" v-if="empresa?.logoUrl"></v-img>
            <div>
              <h1 class="text-h4 font-weight-black">{{ empresa?.nomeFantasia }}</h1>
              <div class="text-caption font-weight-bold">{{ empresa?.razaoSocial }} - CNPJ: {{ empresa?.cnpj }}</div>
              <div class="text-caption">{{ empresa?.endereco }}, {{ empresa?.cidade }}-{{ empresa?.estado }}</div>
              <div class="text-caption">Telefone: {{ empresa?.telefone }} | E-mail: {{ empresa?.email }}</div>
            </div>
          </div>
          <div class="text-right">
            <h2 class="text-h5 text-primary font-weight-black">ORDEM DE COMPRA</h2>
            <div class="text-h4 font-weight-bold mb-1">{{ printData.numero }}</div>
            <div class="text-overline">Data: {{ formatDate(printData.dataCompra) }}</div>
          </div>
        </div>

        <!-- Fornecedor / OP -->
        <v-row class="mb-6">
          <v-col cols="7">
            <div class="bg-grey-lighten-3 pa-3 rounded">
              <div class="text-overline text-primary">FORNECEDOR</div>
              <div class="text-h6 font-weight-bold">{{ printData.fornecedor }}</div>
            </div>
          </v-col>
          <v-col cols="5">
            <div class="bg-grey-lighten-3 pa-3 rounded">
              <div class="text-overline text-primary">REFERÊNCIA / PROJETO</div>
              <div class="font-weight-bold">OP #{{ printData.op?.numeroOP }}</div>
              <div class="text-caption">{{ printData.op?.cliente }} - {{ printData.op?.codigoMaquina }}</div>
            </div>
          </v-col>
        </v-row>

        <!-- Itens -->
        <table class="oc-table w-100 mb-6">
          <thead>
            <tr class="bg-primary text-white">
              <th class="pa-2 text-left">Item</th>
              <th class="pa-2 text-left">Descrição</th>
              <th class="pa-2 text-center" style="width: 60px;">Qtd</th>
              <th class="pa-2 text-right">Unitário</th>
              <th class="pa-2 text-right">IPI</th>
              <th class="pa-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in printData.itens" :key="item.id" class="border-bottom">
              <td class="pa-2 font-weight-bold">{{ item.peca?.codigo || '-' }}</td>
              <td class="pa-2">{{ item.descricao }}</td>
              <td class="pa-2 text-center">{{ item.quantidade }}</td>
              <td class="pa-2 text-right">{{ formatCurrency(item.valorUnitario) }}</td>
              <td class="pa-2 text-right">{{ item.aliqIPI }}%</td>
              <td class="pa-2 text-right font-weight-bold">{{ formatCurrency(calculateItemTotal(item)) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totais -->
        <v-row class="justify-end">
          <v-col cols="5">
            <v-table density="compact" class="totals-table">
              <tr>
                <td class="text-right text-grey">Subtotal de Itens:</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(printData.itensSum) }}</td>
              </tr>
              <tr>
                <td class="text-right text-grey">Total IPI:</td>
                <td class="text-right font-weight-bold text-orange">{{ formatCurrency(printData.totalIPI) }}</td>
              </tr>
              <tr>
                <td class="text-right text-grey">Frete (+) / Desconto (-):</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(printData.valorFrete - printData.valorDesconto) }}</td>
              </tr>
              <tr class="bg-success-lighten-5">
                <td class="text-right text-h6 font-weight-black">VALOR TOTAL:</td>
                <td class="text-right text-h6 font-weight-black text-success">{{ formatCurrency(printData.valorTotal) }}</td>
              </tr>
            </v-table>
          </v-col>
        </v-row>

        <!-- Rodapé / Assinatura -->
        <div class="mt-12 pt-8 d-flex justify-space-between text-center border-top">
          <div style="width: 250px;">
            <div class="border-top pt-2">Responsável Compras</div>
          </div>
          <div style="width: 250px;">
            <div class="border-top pt-2">Aprovação Financeira</div>
          </div>
          <div style="width: 250px;">
            <div class="border-top pt-2">Setor Solicitante</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editar Demanda (Item da BOM) -->
    <v-dialog v-model="dialogDemanda.show" max-width="500px">
      <v-card>
        <v-card-title>Atualizar Demanda Comercial</v-card-title>
        <v-card-text>
          <div class="text-subtitle-1 font-weight-bold mb-4">Item: {{ dialogDemanda.data.codigo }}</div>
          
          <v-select
            v-model="dialogDemanda.data.fornecedorId"
            :items="filteredFornecedoresDemandas"
            item-title="nome"
            item-value="id"
            label="Fornecedor Vencedor"
            variant="outlined"
            clearable
            :hint="dialogDemanda.data.subcategoria ? `Filtrando por: ${dialogDemanda.data.subcategoria}` : ''"
            persistent-hint
          ></v-select>

          <v-text-field
            v-model.number="dialogDemanda.data.valorUnitario"
            label="Valor Unitário (R$)"
            type="number"
            variant="outlined"
            prefix="R$"
          ></v-text-field>

          <v-select
            v-model="dialogDemanda.data.statusSuprimento"
            :items="['NAO_SOLICITADO', 'EM_ORCAMENTO', 'COMPRADO', 'RECEBIDO']"
            label="Status de Suprimento"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDemanda.show = false">Cancelar</v-btn>
          <v-btn color="indigo" variant="flat" :loading="saving" @click="saveDemanda">Salvar Alterações</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Visualizador de Arquivos (PDF e Imagens) -->
    <v-dialog v-model="dialogVisualizador.show" max-width="1000px" height="90vh">
      <v-card class="h-100 d-flex flex-column">
        <v-card-title class="d-flex justify-space-between align-center bg-grey-lighten-3">
          <div class="text-subtitle-1 font-weight-bold">
            <v-icon class="mr-2">{{ dialogVisualizador.anexo?.url?.endsWith('.pdf') ? 'mdi-file-pdf-box' : 'mdi-file-image' }}</v-icon>
            {{ dialogVisualizador.anexo?.nome }}
          </div>
          <div>
            <v-btn icon="mdi-download" variant="text" color="primary" :href="dialogVisualizador.anexo?.url" target="_blank" title="Baixar Original" class="mr-2"></v-btn>
            <v-btn icon="mdi-close" variant="text" @click="dialogVisualizador.show = false" title="Fechar"></v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pa-0 flex-grow-1 bg-grey-darken-3 d-flex justify-center align-center" style="height: calc(90vh - 64px); min-height: 500px;">
          <iframe 
            v-if="dialogVisualizador.anexo?.url?.endsWith('.pdf')"
            :src="dialogVisualizador.anexo?.url" 
            width="100%" 
            height="100%" 
            style="border: none; min-height: 500px;"
          ></iframe>
          <v-img
            v-else-if="dialogVisualizador.anexo"
            :src="dialogVisualizador.anexo?.url"
            max-height="100%"
            contain
          ></v-img>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Recebimento de Materiais (Almoxarifado) -->
    <v-dialog v-model="dialogRecebimento.show" max-width="800px">
      <v-card>
        <v-card-title class="bg-success text-white d-flex justify-space-between align-center">
          <span>Conferência de Recebimento</span>
          <v-chip color="white" variant="flat" size="small">{{ dialogRecebimento.data.numero }}</v-chip>
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="d-flex justify-space-between mb-4">
            <div>
              <div class="text-caption text-grey">Fornecedor</div>
              <div class="text-subtitle-1 font-weight-bold">{{ dialogRecebimento.data.fornecedor }}</div>
            </div>
            <div style="width: 200px">
              <v-text-field
                v-model="dialogRecebimento.data.numeroNF"
                label="Nota Fiscal (NF)"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-file-document-outline"
                placeholder="000.000.000"
              ></v-text-field>
            </div>
            <div style="width: 180px">
              <v-text-field
                v-model="dialogRecebimento.data.dataEntregaReal"
                label="Data"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </div>
          </div>

          <v-table density="compact" class="border rounded mb-4">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="text-left">Item / Código</th>
                <th class="text-center">Qtd Pedida</th>
                <th class="text-center">Já Recebido</th>
                <th class="text-center" style="width: 120px;">Qtd a Entregar</th>
                <th class="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dialogRecebimento.data.itens" :key="item.id">
                <td>
                  <div class="font-weight-bold">{{ item.peca?.codigo || '-' }}</div>
                  <div class="text-caption text-truncate" style="max-width: 200px">{{ item.descricao }}</div>
                </td>
                <td class="text-center">{{ item.quantidade }}</td>
                <td class="text-center">
                  <v-chip size="x-small" :color="item.qtdRecebida > 0 ? 'success' : 'grey'">
                    {{ item.qtdRecebida }}
                  </v-chip>
                </td>
                <td>
                  <v-text-field
                    v-model.number="item.qtdAchegada"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :max="item.quantidade - item.qtdRecebida"
                    min="0"
                    bg-color="green-lighten-5"
                    class="text-center"
                  ></v-text-field>
                </td>
                <td class="text-right text-caption" :class="item.quantidade - item.qtdRecebida - (item.qtdAchegada || 0) > 0 ? 'text-orange-darken-2' : 'text-success'">
                  {{ item.quantidade - item.qtdRecebida - (item.qtdAchegada || 0) }} pend.
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert
            v-if="temPendenciasNoRecebimento"
            type="warning"
            variant="tonal"
            density="compact"
            icon="mdi-alert-circle"
          >
            Atenção: Nem todos os itens serão recebidos totalmente. O pedido continuará como <b>RECEBIDO PARCIAL</b>.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogRecebimento.show = false">Cancelar</v-btn>
          <v-btn 
            color="success" 
            variant="flat" 
            :loading="saving" 
            @click="confirmarRecebimento"
            prepend-icon="mdi-check-all"
          >
            Confirmar Recebimento
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const tab = ref('requisicoes')
const demandas = ref([])
const loadingDemandas = ref(false)
const fornecedores = ref([])
const compras = ref([])
const ops = ref([])
const { authHeaders, hasPermission } = useAuth()
const loading = ref(false)
const saving = ref(false)

const requisicoesEngenharia = computed(() => {
  return compras.value.filter(c => c.status === 'SOLICITADA')
})

const activeOrders = computed(() => {
  return compras.value.filter(o => 
    o.status !== 'SOLICITADA' && 
    o.status !== 'RECEBIDA_TOTAL' && 
    o.status !== 'CANCELADA'
  )
})

const finalizedOrders = computed(() => {
  return compras.value.filter(o => 
    o.status === 'RECEBIDA_TOTAL' || 
    o.status === 'CANCELADA'
  )
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

const isDelayed = (date) => {
  if (!date) return false
  const today = new Date()
  today.setHours(0,0,0,0)
  return new Date(date) < today
}

const dialog = ref({
  show: false,
  data: { opId: null, fornecedor: '', itens: [] }
})

const dialogDemanda = ref({
  show: false,
  data: { 
    id: null, 
    codigo: '', 
    subcategoria: '',
    valorUnitario: 0, 
    fornecedorId: null, 
    statusSuprimento: '' 
  }
})

const filteredFornecedoresDemandas = computed(() => {
  if (!dialogDemanda.value.data.subcategoria) return fornecedores.value
  
  const sub = dialogDemanda.value.data.subcategoria.toLowerCase()
  return fornecedores.value.filter(f => 
    f.categorias && f.categorias.some(c => c.toLowerCase() === sub)
  )
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headersDemandas = [
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Código', key: 'codigo' },
  { title: 'Descrição', key: 'descricao' },
  { title: 'Qtd', key: 'quantidade', align: 'end' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Vlr. Unit.', key: 'valorUnitario', align: 'end' },
  { title: 'Status', key: 'statusSuprimento', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const headersRequisicoes = [
  { title: 'Data', key: 'dataSolicitacao', formatter: formatDate },
  { title: 'OP / Cliente', key: 'op' },
  { title: 'Categoria', key: 'categoria', align: 'center' },
  { title: 'Itens', key: '_count.itens', align: 'center' },
  { title: 'Ações', key: 'acoes', align: 'center', sortable: false }
]

const headers = [
  { title: 'Pedido', key: 'numero' },
  { title: 'OP', key: 'op' },
  { title: 'Fornecedor', key: 'fornecedor' },
  { title: 'Previsão de Entrega', key: 'previsao' },
  { title: 'Status', key: 'status' },
  { title: 'NF', key: 'numeroNF' },
  { title: 'Itens', key: '_count.itens', align: 'center' },
  { title: 'Ações', key: 'acoes_oc', align: 'center', sortable: false }
]

const empresa = ref(null)
const printData = ref(null)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const calculateItemTotal = (item) => {
  const base = (item.valorUnitario || 0) * (item.quantidade || 0)
  const ipi = base * ((item.aliqIPI || 0) / 100)
  return base + ipi
}

// totalPedidoCalculado agora é declarado mais abaixo para suportar fatiamento (split) de pedidos.

const recacheTotals = () => {
  // Apenas para forçar reatividade se necessário
}

const loadEmpresa = async () => {
  try {
    const empresas = await $fetch('/api/configuracoes/empresa')
    if (empresas && empresas.length > 0) empresa.value = empresas[0]
  } catch (error) {
    console.error('Erro ao carregar dados da empresa')
  }
}

const loadDemandas = async () => {
  loadingDemandas.value = true
  try {
    demandas.value = await $fetch('/api/compras/demandas')
  } catch (error) {
    showSnackbar('Erro ao carregar demandas', 'error')
  } finally {
    loadingDemandas.value = false
  }
}

const loadCompras = async () => {
  loading.value = true
  try {
    compras.value = await $fetch('/api/compras')
  } catch (error) {
    showSnackbar('Erro ao carregar compras', 'error')
  } finally {
    loading.value = false
  }
}

const loadFornecedores = async () => {
  try {
    fornecedores.value = await $fetch('/api/fornecedores')
  } catch (error) {}
}

const loadOPs = async () => {
  try {
    ops.value = await $fetch('/api/ops')
  } catch (error) {}
}

const openAddDialog = () => {
  dialog.value.show = true
  dialog.value.data = { opId: null, fornecedor: '', itens: [{ descricao: '', quantidade: 1 }] }
  loadOPs()
}

const addItem = () => {
  dialog.value.data.itens.push({ descricao: '', quantidade: 1 })
}

const removeItem = (index) => {
  dialog.value.data.itens.splice(index, 1)
}

const saveCompra = async () => {
  saving.value = true
  try {
    await $fetch('/api/compras', {
      method: 'POST',
      body: dialog.value.data
    })
    showSnackbar('Requisição enviada!')
    dialog.value.show = false
    await loadCompras()
  } catch (error) {
    showSnackbar('Erro ao criar requisição', 'error')
  } finally {
    saving.value = false
  }
}

const editDemanda = (item) => {
  dialogDemanda.value = {
    show: true,
    data: { 
      id: item.id, 
      codigo: item.codigo, 
      subcategoria: item.subcategoria || '',
      valorUnitario: item.valorUnitario || 0, 
      fornecedorId: item.fornecedorId, 
      statusSuprimento: item.statusSuprimento 
    }
  }
  loadFornecedores()
}

const dialogDetalhes = ref({
  show: false,
  requisicao: null,
  dataPrevisao: '',
  valorFrete: 0,
  valorDesconto: 0,
  observacoes: '',
  fornecedorId: null
})

const dialogVisualizador = ref({
  show: false,
  anexo: null
})

const dialogRecebimento = ref({
  show: false,
  data: { id: null, numero: '', fornecedor: '', numeroNF: '', dataEntregaReal: new Date().toISOString().substr(0, 10), itens: [] }
})

const temPendenciasNoRecebimento = computed(() => {
  return dialogRecebimento.value.data.itens.some(i => {
    const pendente = i.quantidade - i.qtdRecebida - (i.qtdAchegada || 0)
    return pendente > 0
  })
})

const abrirRecebimento = (item) => {
  dialogRecebimento.value = {
    show: true,
    data: { 
      id: item.id, 
      numero: item.numero, 
      fornecedor: item.fornecedor, 
      numeroNF: item.numeroNF || '', 
      dataEntregaReal: new Date().toISOString().substr(0, 10),
      itens: JSON.parse(JSON.stringify(item.itens)).map(i => ({
        ...i,
        qtdAchegada: i.quantidade - (i.qtdRecebida || 0) // Sugere o saldo total
      }))
    }
  }
}

const confirmarRecebimento = async () => {
  if (!dialogRecebimento.value.data.numeroNF) {
    showSnackbar('Por favor, informe o número da NF', 'warning')
    return
  }

  const itensRecebidos = dialogRecebimento.value.data.itens
    .filter(i => i.qtdAchegada > 0)
    .map(i => ({ id: i.id, qtdEntregue: i.qtdAchegada }))

  if (itensRecebidos.length === 0) {
    showSnackbar('Informe a quantidade recebida de pelo menos um item', 'warning')
    return
  }
  
  saving.value = true
  try {
    const statusFinal = temPendenciasNoRecebimento.value ? 'RECEBIDA_PARCIAL' : 'RECEBIDA_TOTAL'
    
    await $fetch('/api/compras', {
      method: 'PUT',
      body: {
        id: dialogRecebimento.value.data.id,
        status: statusFinal,
        numeroNF: dialogRecebimento.value.data.numeroNF,
        dataEntregaReal: dialogRecebimento.value.data.dataEntregaReal,
        itensRecebidos
      },
      headers: authHeaders.value
    })
    showSnackbar(statusFinal === 'RECEBIDA_TOTAL' ? 'Recebimento TOTAL concluído!' : 'Recebimento PARCIAL registrado!')
    dialogRecebimento.value.show = false
    await loadCompras()
  } catch (error) {
    showSnackbar('Erro ao registrar recebimento', 'error')
  } finally {
    saving.value = false
  }
}

const visualizarAnexo = (anexo) => {
  dialogVisualizador.value = {
    show: true,
    anexo
  }
}

const uploading = ref(false)

const uploadAnexo = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await $fetch(`/api/compras/${dialogDetalhes.value.requisicao.id}/anexos`, {
      method: 'POST',
      body: formData
    })

    if (!dialogDetalhes.value.requisicao.anexos) {
      dialogDetalhes.value.requisicao.anexos = []
    }
    dialogDetalhes.value.requisicao.anexos.push(...res.anexos)
    
    showSnackbar('Orçamento anexado com sucesso!')
    await loadCompras() // Recarregar base
  } catch (error) {
    showSnackbar('Erro ao enviar o anexo', 'error')
  } finally {
    uploading.value = false
    event.target.value = '' // reset input
  }
}

const excluirAnexo = async (compraId, anexoId) => {
  if (!confirm('Deseja realmente remover este orçamento?')) return
  
  try {
    await $fetch(`/api/compras/${compraId}/anexos/${anexoId}`, {
      method: 'DELETE'
    })
    
    dialogDetalhes.value.requisicao.anexos = dialogDetalhes.value.requisicao.anexos.filter(a => a.id !== anexoId)
    showSnackbar('Anexo removido.')
} finally {
    saving.value = false
  }
}

const totalPedidoCalculado = computed(() => {
  if (!dialogDetalhes.value.requisicao) return 0
  const itens = dialogDetalhes.value.requisicao.itens.filter(i => i.selected)
  const itensSum = itens.reduce((acc, item) => acc + calculateItemTotal(item), 0)
  return itensSum + (Number(dialogDetalhes.value.valorFrete) || 0) - (Number(dialogDetalhes.value.valorDesconto) || 0)
})

const selecionarTodosItens = ref(true)

const toggleSelectAll = () => {
  if (!dialogDetalhes.value.requisicao) return
  dialogDetalhes.value.requisicao.itens.forEach(i => {
    i.selected = selecionarTodosItens.value
  })
}

const temItensSelecionados = computed(() => {
  return dialogDetalhes.value.requisicao?.itens?.some(i => i.selected) || false
})

const todosItensSelecionados = computed(() => {
  const itens = dialogDetalhes.value.requisicao?.itens || []
  return itens.length > 0 && itens.every(i => i.selected)
})

const verDetalhesRequisicao = (item) => {
  dialogDetalhes.value = {
    show: true,
    requisicao: JSON.parse(JSON.stringify(item)),
    dataPrevisao: item.dataPrevisaoEntrega ? new Date(item.dataPrevisaoEntrega).toISOString().substr(0, 10) : '',
    valorFrete: item.valorFrete || 0,
    valorDesconto: item.valorDesconto || 0,
    observacoes: item.observacoes || '',
    fornecedorId: item.fornecedorId || null
  }
  // Inicializa todos como selecionados
  dialogDetalhes.value.requisicao.itens.forEach(i => i.selected = true)
  selecionarTodosItens.value = true
  loadFornecedores()
}

const emitirOC = async () => {
  if (!dialogDetalhes.value.dataPrevisao) {
    showSnackbar('Por favor, informe a previsão de entrega', 'warning')
    return
  }

  if (!dialogDetalhes.value.fornecedorId) {
    showSnackbar('Por favor, selecione o fornecedor vencedor', 'warning')
    return
  }

  const selectedItens = dialogDetalhes.value.requisicao.itens.filter(i => i.selected)
  
  saving.value = true
  try {
    const isSplit = !todosItensSelecionados.value
    const fornecedorObj = fornecedores.value.find(f => f.id === dialogDetalhes.value.fornecedorId)

    const body = {
      id: dialogDetalhes.value.requisicao.id,
      status: 'PEDIDO_EMITIDO',
      split: isSplit,
      splitItemIds: isSplit ? selectedItens.map(i => i.id) : undefined,
      fornecedor: fornecedorObj?.nome || 'Desconhecido',
      fornecedorId: dialogDetalhes.value.fornecedorId,
      valorTotal: totalPedidoCalculado.value,
      valorFrete: dialogDetalhes.value.valorFrete,
      valorDesconto: dialogDetalhes.value.valorDesconto,
      observacoes: dialogDetalhes.value.observacoes,
      dataPrevisaoEntrega: dialogDetalhes.value.dataPrevisao,
      itens: selectedItens.map(item => ({
        id: item.id,
        valorUnitario: item.valorUnitario,
        aliqIPI: item.aliqIPI,
        aliqICMS: item.aliqICMS,
        valorIPI: (item.valorUnitario * item.quantidade) * (item.aliqIPI / 100),
        valorICMS: (item.valorUnitario * item.quantidade) * (item.aliqICMS / 100),
        custoLiquido: item.valorUnitario * (1 + (item.aliqIPI / 100))
      }))
    }

    const response = await $fetch('/api/compras', {
      method: 'PUT',
      body
    })
    
    if (response) {
      showSnackbar(isSplit ? 'OC Parcial emitida! O restante da REQ continua disponível.' : 'Ordem de Compra emitida com sucesso!')
      dialogDetalhes.value.show = false
      await loadCompras()
      
      if (response.newOCId) {
        // No caso de split, recarrega e talvez devesse imprimir a nova OC?
         // Por simplicidade, apenas recarregamos.
      } else {
        prepararImpressao(response)
      }
    }
  } catch (error) {
    console.error('Erro ao emitir OC:', error.data || error)
    showSnackbar('Erro ao emitir OC: ' + (error.data?.statusMessage || error.message), 'error')
  } finally {
    saving.value = false
  }
}

const prepararImpressao = (oc) => {
  const itensSum = oc.itens.reduce((acc, i) => acc + (i.valorUnitario * i.quantidade), 0)
  const totalIPI = oc.itens.reduce((acc, i) => acc + (i.valorIPI || 0), 0)
  
  printData.value = {
    ...oc,
    itensSum,
    totalIPI
  }
  
  setTimeout(() => {
    window.print()
  }, 500)
}

const viewDrawing = (url) => {
  window.open(url, '_blank')
}

const saveDemanda = async () => {
  saving.value = true
  try {
    await $fetch(`/api/pecas/${dialogDemanda.value.data.id}`, {
      method: 'PATCH',
      body: {
        valorUnitario: dialogDemanda.value.data.valorUnitario,
        fornecedorId: dialogDemanda.value.data.fornecedorId,
        statusSuprimento: dialogDemanda.value.data.statusSuprimento
      }
    })
    showSnackbar('Demanda atualizada!')
    dialogDemanda.value.show = false
    await loadDemandas()
  } catch (error) {
    showSnackbar('Erro ao atualizar demanda', 'error')
  } finally {
    saving.value = false
  }
}

const getStatusColor = (status) => {
  const colors = {
    SOLICITADA: 'grey',
    COTADA: 'blue',
    PEDIDO_EMITIDO: 'orange',
    APROVADA: 'success',
    COMPRADA: 'orange',
    'RECEBIDA_PARCIAL': '#FF9800',
    'RECEBIDA_TOTAL': '#4CAF50',
    'CANCELADA': '#757575'
  }
  return colors[status] || '#9E9E9E'
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

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  loadDemandas()
  loadCompras()
  loadEmpresa()
})
</script>

<style scoped>
@media print {
  .v-application {
    background: white !important;
  }
  .print-only {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 9999;
    background: white !important;
  }
  body * {
    visibility: hidden;
  }
  .print-only, .print-only * {
    visibility: visible;
  }
  .no-print {
    display: none !important;
  }
}

.oc-layout {
  font-family: 'Roboto', sans-serif;
  color: #333;
  line-height: 1.4;
}

.border-bottom {
  border-bottom: 2px solid #eee;
}

.border-top {
  border-top: 1px solid #ccc;
}

.oc-table {
  border-collapse: collapse;
}

.oc-table th {
  font-size: 11px;
  text-transform: uppercase;
}

.oc-table td {
  font-size: 12px;
}

.totals-table td {
  padding: 4px 8px;
}
</style>
