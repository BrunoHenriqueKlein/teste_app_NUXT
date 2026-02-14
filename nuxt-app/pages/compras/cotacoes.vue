<template>
  <div class="pa-4">
    <PageHeader 
      title="Cotações e Orçamentos" 
      subtitle="Definição de fornecedores, custos e impostos para itens COMPRADOS"
      icon="mdi-calculator"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-cart-plus"
          :disabled="!selectedItems.length"
          @click="openOrderDialog"
        >
          Gerar Ordem de Compra ({{ selectedItems.length }})
        </v-btn>
      </template>
    </PageHeader>

    <v-card variant="outlined" class="mt-4">
      <v-data-table
        v-model="selectedItems"
        :headers="headers"
        :items="demandas"
        :loading="loading"
        show-select
        hover
      >
        <template v-slot:item.op="{ item }">
          <span class="text-primary font-weight-bold">#{{ item.op?.numeroOP }}</span>
        </template>

        <template v-slot:item.valorUnitario="{ item }">
          <v-text-field
            v-model.number="item.valorUnitario"
            prefix="R$"
            density="compact"
            variant="underlined"
            hide-details
            type="number"
            class="mt-1"
            style="width: 100px"
          ></v-text-field>
        </template>

        <template v-slot:item.impostos="{ item }">
          <div class="d-flex gap-2">
            <v-text-field
              v-model.number="item.valorIPI"
              label="IPI %"
              density="compact"
              variant="underlined"
              hide-details
              type="number"
              style="width: 60px"
            ></v-text-field>
            <v-text-field
              v-model.number="item.valorICMS"
              label="ICMS %"
              density="compact"
              variant="underlined"
              hide-details
              type="number"
              style="width: 60px"
            ></v-text-field>
          </div>
        </template>

        <template v-slot:item.custoLiquido="{ item }">
          <div class="font-weight-bold">
            R$ {{ calculateLiquid(item).toFixed(2) }}
          </div>
          <div class="text-caption text-grey">
            (total: R$ {{ (calculateLiquid(item) * item.quantidade).toFixed(2) }})
          </div>
        </template>

        <template v-slot:item.fornecedorId="{ item }">
          <v-select
            v-model="item.fornecedorId"
            :items="fornecedores"
            item-title="nome"
            item-value="id"
            density="compact"
            variant="underlined"
            hide-details
            class="mt-1"
            style="min-width: 150px"
          ></v-select>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo para Finalizar Ordem de Compra -->
    <v-dialog v-model="orderDialog.show" max-width="700px">
      <v-card>
        <v-card-title>Confirmar Ordem de Compra</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="orderDialog.data.dataCompra"
                label="Data da Compra"
                type="date"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="orderDialog.data.dataPrevisaoEntrega"
                label="Previsão de Entrega"
                type="date"
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-table density="compact">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qtd</th>
                <th class="text-right">Líquido Unit.</th>
                <th class="text-right">Subtotal OC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedItemsData" :key="item.id">
                <td>{{ item.codigo }}</td>
                <td class="text-right">{{ item.quantidade }}</td>
                <td class="text-right">R$ {{ calculateLiquid(item).toFixed(2) }}</td>
                <td class="text-right">R$ {{ (item.valorUnitario * item.quantidade).toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right font-weight-bold">TOTAL BRUTO (NF):</td>
                <td class="text-right font-weight-bold text-h6">R$ {{ totalBrutoOC.toFixed(2) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right text-success font-weight-bold">Créditos de Impostos (IPI+ICMS):</td>
                <td class="text-right text-success font-weight-bold">R$ {{ totalCreditosOC.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="orderDialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="generateOC">Emitir Pedido de Compra</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const demandas = ref([])
const selectedItems = ref([])
const fornecedores = ref([])
const loading = ref(false)
const saving = ref(false)

const orderDialog = ref({
  show: false,
  data: {
    dataCompra: new Date().toISOString().substr(0, 10),
    dataPrevisaoEntrega: ''
  }
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'OP', key: 'op', width: '80px' },
  { title: 'Código/Descrição', key: 'codigo' },
  { title: 'Qtd', key: 'quantidade', align: 'end', width: '60px' },
  { title: 'Fornecedor', key: 'fornecedorId' },
  { title: 'Preço Bruto Unit.', key: 'valorUnitario' },
  { title: 'Impostos', key: 'impostos', sortable: false },
  { title: 'Custo Líquido', key: 'custoLiquido', align: 'end' }
]

const loadData = async () => {
  loading.value = true
  try {
    const [data, forns] = await Promise.all([
      $fetch('/api/compras/demandas?status=NAO_SOLICITADO'),
      $fetch('/api/fornecedores')
    ])
    
    // Inicializar campos de impostos se não existirem
    demandas.value = data.map(d => ({
      ...d,
      valorUnitario: d.valorUnitario || 0,
      valorIPI: d.valorIPI || 0,
      valorICMS: d.valorICMS || 0
    }))
    
    fornecedores.value = forns
  } catch (error) {
    showSnackbar('Erro ao carregar dados', 'error')
  } finally {
    loading.value = false
  }
}

const calculateLiquid = (item) => {
  const ipi = (item.valorIPI || 0) / 100
  const icms = (item.valorICMS || 0) / 100
  // Custo líquido = Valor Bruto - (Impostos creditáveis)
  // Nota: A lógica de cálculo pode variar conforme a regra fiscal, aqui simplificamos deduzindo ambos.
  return item.valorUnitario * (1 - ipi - icms)
}

const selectedItemsData = computed(() => {
  return demandas.value.filter(d => selectedItems.value.includes(d.id))
})

const totalBrutoOC = computed(() => {
  return selectedItemsData.value.reduce((acc, item) => acc + (item.valorUnitario * item.quantidade), 0)
})

const totalCreditosOC = computed(() => {
  return selectedItemsData.value.reduce((acc, item) => {
    const ipiVal = item.valorUnitario * (item.valorIPI / 100) * item.quantidade
    const icmsVal = item.valorUnitario * (item.valorICMS / 100) * item.quantidade
    return acc + ipiVal + icmsVal
  }, 0)
})

const openOrderDialog = () => {
  // Verificar se todos os itens selecionados têm fornecedor
  const semFornecedor = selectedItemsData.value.some(i => !i.fornecedorId)
  if (semFornecedor) {
    showSnackbar('Selecione um fornecedor para todos os itens', 'warning')
    return
  }
  orderDialog.value.show = true
}

const generateOC = async () => {
  saving.value = true
  try {
    // Agrupar itens por fornecedor (Opcional, aqui vamos gerar uma OC por fornecedor se forem múltiplos ou uma única OC)
    // Para simplificar, vamos assumir que o usuário selecionou itens de um mesmo fornecedor ou gerar uma OC consolidada informando um dos fornecedores.
    // O ideal seria quebrar em múltiplas OCs.
    
    const fornecedorPrincipal = fornecedores.value.find(f => f.id === selectedItemsData.value[0].fornecedorId)?.nome
    
    await $fetch('/api/compras', {
      method: 'POST',
      body: {
        opId: selectedItemsData.value[0].opId,
        fornecedor: fornecedorPrincipal,
        status: 'PEDIDO_EMITIDO',
        dataCompra: orderDialog.value.data.dataCompra,
        dataPrevisaoEntrega: orderDialog.value.data.dataPrevisaoEntrega,
        valorTotal: totalBrutoOC.value,
        itens: selectedItemsData.value.map(i => ({
          pecaId: i.id,
          descricao: i.descricao,
          quantidade: i.quantidade,
          valorUnitario: i.valorUnitario,
          valorIPI: i.valorUnitario * (i.valorIPI / 100) * i.quantidade,
          valorICMS: i.valorUnitario * (i.valorICMS / 100) * i.quantidade,
          custoLiquido: calculateLiquid(i)
        }))
      }
    })

    showSnackbar('Pedido de Compra emitido com sucesso!')
    orderDialog.value.show = false
    selectedItems.value = []
    loadData()
  } catch (error) {
    showSnackbar('Erro ao emitir pedido', 'error')
  } finally {
    saving.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(loadData)
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
