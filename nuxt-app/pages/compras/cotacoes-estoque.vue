<template>
  <div class="pa-4">
    <PageHeader 
      title="Cotações de Estoque" 
      subtitle="Definição de fornecedores para itens de Almoxarifado"
      icon="mdi-warehouse"
    >
      <template #actions>
        <v-btn
          color="secondary"
          variant="flat"
          prepend-icon="mdi-cart-arrow-down"
          class="mr-2"
          :disabled="!selectedItems.length"
          :loading="saving"
          @click="generateDirectPurchase"
          title="Pula o envio de e-mail e envia para a aba de Requisições."
        >
          Compra Direta / Online ({{ selectedItems.length }})
        </v-btn>

        <v-btn
          color="info"
          variant="flat"
          prepend-icon="mdi-email-fast"
          :disabled="!selectedItems.length"
          @click="openQuoteDialog"
          title="Envia e-mail de cotação para fornecedores."
        >
          Solicitar Cotações ({{ selectedItems.length }})
        </v-btn>
      </template>
    </PageHeader>

    <!-- Tabela de Cotações -->

    <v-card variant="outlined" class="mt-4">
      <v-data-table
        v-model="selectedItems"
        :headers="headers"
        :items="demandas"
        :loading="loading"
        show-select
        hover
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.statusCor"
            size="small"
            variant="flat"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.numeroCompra="{ item }">
          <span class="text-orange font-weight-bold">{{ item.numeroCompra }}</span>
        </template>

        <template v-slot:item.codigo="{ item }">
          <div class="font-weight-bold">{{ item.codigo }}</div>
        </template>
        <template v-slot:item.descricao="{ item }">
          <div class="text-caption">{{ item.descricao }}</div>
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
    

    <!-- Diálogo 1: Seleção de Fornecedores para Cotação -->
    <v-dialog v-model="dialogQuoteSuppliers.show" max-width="500px">
      <v-card>
        <v-card-title class="pa-4 bg-secondary text-white">Solicitar Cotações</v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4">Selecione os fornecedores para enviar o e-mail de cotação das <strong>{{ selectedItems.length }} peças</strong> selecionadas.</p>
          <v-select
            v-model="dialogQuoteSuppliers.fornecedorIds"
            :items="fornecedores"
            item-title="nome"
            item-value="id"
            label="Escolha os Fornecedores"
            variant="outlined"
            placeholder="Selecione um ou mais"
            multiple
            chips
          ></v-select>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogQuoteSuppliers.show = false">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" :loading="loadingPreview" :disabled="!dialogQuoteSuppliers.fornecedorIds.length" @click="loadQuotePreview">
            Gerar Rascunho
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo 2: Revisão e Edição de E-mail de Cotação -->
    <v-dialog v-model="dialogQuoteEmail.show" max-width="800px" persistent>
      <v-card>
        <v-card-title class="pa-4 bg-success text-white">Revisar e Enviar E-mail(s)</v-card-title>
        <v-card-text class="pa-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Serão enviados e-mails individuais para os fornecedores selecionados.
          </v-alert>

          <v-text-field
            v-model="dialogQuoteEmail.subject"
            label="Assunto do E-mail"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-text-field>

          <v-textarea
            v-model="dialogQuoteEmail.html"
            label="Corpo do E-mail (HTML)"
            variant="outlined"
            rows="12"
            auto-grow
            hint="Você pode editar o texto acima. Os anexos (desenhos) serão incluídos automaticamente se existirem."
            persistent-hint
          ></v-textarea>
          

        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="dialogQuoteEmail.show = false">Voltar</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="success" variant="flat" :loading="sendingEmail" @click="sendFinalQuoteEmails">
            Enviar Agora
          </v-btn>
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

const search = ref('')

const loading = ref(false)
const saving = ref(false)


const dialogQuoteSuppliers = ref({
  show: false,
  fornecedorIds: []
})

const dialogQuoteEmail = ref({
  show: false,
  subject: '',
  html: '',
  attachmentsCount: 0
})

const loadingPreview = ref(false)
const sendingEmail = ref(false)

const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Requisição', key: 'numeroCompra', width: '120px' },
  { title: 'Código', key: 'codigo', width: '120px' },
  { title: 'Descrição', key: 'descricao', minWidth: '150px' },
  { title: 'Material', key: 'material', width: '120px' },
  { title: 'Quantidade', key: 'quantidade', align: 'end', width: '100px' },
  { title: 'Categoria', key: 'categoria', width: '120px' },
  { title: 'Subcategoria', key: 'subcategoria', width: '120px' }
]

const loadData = async () => {
  loading.value = true
  try {
    const [data, forns] = await Promise.all([
      $fetch(`/api/compras/demandas-estoque`),
      $fetch('/api/fornecedores')
    ])
    
    demandas.value = data
    
    fornecedores.value = forns
  } catch (error) {
    showSnackbar('Erro ao carregar dados', 'error')
  } finally {
    loading.value = false
  }
}

const openQuoteDialog = () => {
  dialogQuoteSuppliers.value = {
    show: true,
    fornecedorIds: []
  }
}

const loadQuotePreview = async () => {
  loadingPreview.value = true
  try {
    const data = await $fetch('/api/compras/request-quotes-estoque', {
      method: 'POST',
      body: {
        compraItemIds: selectedItems.value,
        fornecedorIds: dialogQuoteSuppliers.value.fornecedorIds,
        preview: true
      }
    })
    
    dialogQuoteEmail.value = {
      show: true,
      subject: data.subject,
      html: data.html,
      attachmentsCount: data.attachmentsCount
    }
    dialogQuoteSuppliers.value.show = false
  } catch (error) {
    showSnackbar('Erro ao gerar rascunho: ' + (error.data?.statusMessage || error.message), 'error')
  } finally {
    loadingPreview.value = false
  }
}

const sendFinalQuoteEmails = async () => {
  sendingEmail.value = true
  try {
    const res = await $fetch('/api/compras/request-quotes-estoque', {
      method: 'POST',
      body: {
        compraItemIds: selectedItems.value,
        fornecedorIds: dialogQuoteSuppliers.value.fornecedorIds,
        subject: dialogQuoteEmail.value.subject,
        html: dialogQuoteEmail.value.html,
        preview: false
      }
    })
    
    if (res.success) {
      showSnackbar(res.message || 'E-mails enviados! Itens movidos para Requisições.', 'success')
      dialogQuoteEmail.value.show = false
      selectedItems.value = []
      setTimeout(() => {
        navigateTo({ path: '/compras' })
      }, 1000)
    } else {
      showSnackbar(res.message || 'Alguns erros ocorreram ao enviar.', 'warning')
    }
  } catch (error) {
    showSnackbar('Erro ao enviar: ' + (error.data?.statusMessage || error.message), 'error')
  } finally {
    sendingEmail.value = false
  }
}


const generateDirectPurchase = async () => {
  saving.value = true
  try {
    const res = await $fetch('/api/compras/request-quotes-estoque', {
      method: 'POST',
      body: {
        compraItemIds: selectedItems.value,
        directPurchase: true
      }
    })
    
    if (res.success) {
      showSnackbar('Itens enviados para Requisições com sucesso!', 'success')
      selectedItems.value = []
      setTimeout(() => {
        navigateTo({ path: '/compras' })
      }, 1000)
    } else {
      showSnackbar(res.message || 'Erro ao processar.', 'warning')
    }
  } catch (error) {
    showSnackbar('Erro: ' + (error.data?.statusMessage || error.message), 'error')
  } finally {
    saving.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
