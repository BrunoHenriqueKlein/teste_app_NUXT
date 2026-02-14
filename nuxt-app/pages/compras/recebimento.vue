<template>
  <div class="pa-4">
    <PageHeader 
      title="Recebimento de Materiais" 
      subtitle="Conferência de itens e baixa de Ordens de Compra"
      icon="mdi-truck-check"
    />

    <v-card variant="outlined" class="mt-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchOC"
              label="Buscar Ordem de Compra (Número SigeCloud)"
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              placeholder="Ex: OC-2024-001"
              hide-details
              @keyup.enter="buscarOC"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="primary" block height="56" @click="buscarOC" :loading="loading">Buscar</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Detalhes da Compra Encontrada -->
    <v-fade-transition>
      <v-card v-if="compra" variant="outlined" class="mt-6">
        <v-card-title class="bg-indigo text-white d-flex justify-space-between align-center pa-4">
          <div>
            <div class="text-h6">{{ compra.numero }}</div>
            <div class="text-subtitle-2">Fornecedor: {{ compra.fornecedor }}</div>
          </div>
          <v-chip color="white" variant="flat">{{ compra.status }}</v-chip>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="dadosRecebimento.numeroNF"
                label="Número da Nota Fiscal (NF-e)"
                variant="outlined"
                prepend-icon="mdi-file-document-outline"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="dadosRecebimento.dataRecebimento"
                label="Data de Entrada"
                type="date"
                variant="outlined"
                prepend-icon="mdi-calendar-check"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <h3 class="text-h6 mb-4">Conferência de Itens</h3>
          <v-table>
            <thead>
              <tr>
                <th class="text-left" style="width: 50px;">Conferido</th>
                <th class="text-left">Cód. Peça</th>
                <th class="text-left">Descrição</th>
                <th class="text-center">Qtd. Pedida</th>
                <th class="text-center">Qtd. Recebida</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in compra.itens" :key="item.id">
                <td class="text-center">
                  <v-checkbox v-model="item.conferido" color="success" hide-details></v-checkbox>
                </td>
                <td class="font-weight-bold text-primary">{{ item.peca?.codigo || '-' }}</td>
                <td>{{ item.descricao }}</td>
                <td class="text-center">{{ item.quantidade }}</td>
                <td class="text-center" style="width: 120px;">
                  <v-text-field
                    v-model.number="item.qtdRecebida"
                    type="number"
                    density="compact"
                    variant="outlined"
                    hide-details
                  ></v-text-field>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert
            v-if="temDivergencia"
            type="warning"
            variant="tonal"
            class="mt-4"
            prepend-icon="mdi-alert"
          >
            Atenção: Existem divergências entre a quantidade pedida e a recebida. Se confirmar, o sistema registrará o recebimento parcial.
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn variant="text" size="large" @click="compra = null">Cancelar</v-btn>
          <v-btn
            color="success"
            variant="flat"
            size="large"
            prepend-icon="mdi-check-all"
            :loading="saving"
            :disabled="!podeFinalizar"
            @click="finalizarRecebimento"
          >
            Finalizar Recebimento
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-fade-transition>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
const searchOC = ref('')
const loading = ref(false)
const saving = ref(false)
const compra = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const dadosRecebimento = ref({
  numeroNF: '',
  dataRecebimento: new Date().toISOString().substr(0, 10)
})

const buscarOC = async () => {
  if (!searchOC.value) return
  
  loading.value = true
  try {
    const result = await $fetch(`/api/compras/buscar/${searchOC.value}`)
    if (result) {
      // Inicializar campos de conferência
      result.itens = result.itens.map(i => ({
        ...i,
        conferido: true,
        qtdRecebida: i.quantidade
      }))
      compra.value = result
    }
  } catch (error) {
    showSnackbar('Ordem de Compra não encontrada ou já recebida.', 'error')
    compra.value = null
  } finally {
    loading.value = false
  }
}

const temDivergencia = computed(() => {
  if (!compra.value) return false
  return compra.value.itens.some(i => i.qtdRecebida !== i.quantidade)
})

const podeFinalizar = computed(() => {
  if (!compra.value) return false
  return dadosRecebimento.value.numeroNF && compra.value.itens.every(i => i.conferido)
})

const finalizarRecebimento = async () => {
  if (!podeFinalizar.value) return
  
  saving.value = true
  try {
    const response = await $fetch('/api/compras/receber', {
      method: 'POST',
      body: {
        compraId: compra.value.id,
        numeroNF: dadosRecebimento.value.numeroNF,
        dataEntregaReal: dadosRecebimento.value.dataRecebimento,
        itens: compra.value.itens
      }
    })
    
    if (response.success) {
      showSnackbar('Recebimento finalizado com sucesso!')
      compra.value = null
      searchOC.value = ''
    }
  } catch (error) {
    showSnackbar('Erro ao processar recebimento.', 'error')
  } finally {
    saving.value = false
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}
</script>
