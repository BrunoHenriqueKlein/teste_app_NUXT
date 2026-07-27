<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
        <span>{{ isEdit ? `RNC: ${rnc?.numero}` : 'Nova Não Conformidade (RNC)' }}</span>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>
      
      <v-card-text class="pt-4" style="height: 70vh;">
        <v-form ref="form" v-model="valid">
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="formData.status"
                :items="['ABERTA', 'EM_ANALISE', 'AGUARDANDO_FORNECEDOR', 'CONCLUIDA', 'CANCELADA']"
                label="Status"
                variant="outlined"
                density="comfortable"
                :disabled="!isEdit"
              ></v-select>
            </v-col>
            <v-col cols="12" md="8">
              <v-autocomplete
                v-model="formData.fornecedorId"
                :items="fornecedores"
                item-title="nome"
                item-value="id"
                label="Fornecedor Envolvido"
                variant="outlined"
                density="comfortable"
                clearable
              ></v-autocomplete>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="formData.opId"
                :items="ops"
                item-title="numeroOP"
                item-value="id"
                label="Ordem de Produção (OP)"
                variant="outlined"
                density="comfortable"
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="formData.pecaId"
                :items="pecasDisponiveis"
                item-title="descricaoCompleta"
                item-value="id"
                label="Peça / Item (Opcional)"
                variant="outlined"
                density="comfortable"
                :disabled="!formData.opId"
                hint="Selecione uma OP primeiro"
                persistent-hint
                clearable
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="formData.compraId"
                :items="comprasFiltradas"
                item-title="numero"
                item-value="id"
                label="Pedido de Compra (Opcional)"
                variant="outlined"
                density="comfortable"
                clearable
              ></v-autocomplete>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-1 font-weight-bold mb-2">Detalhes da Falha</div>

          <v-textarea
            v-model="formData.descricaoFalha"
            label="Descrição Detalhada do Problema / Falha *"
            variant="outlined"
            rows="3"
            :rules="[v => !!v || 'Descrição é obrigatória']"
          ></v-textarea>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.quantidadeLote"
                label="Qtd do Lote"
                type="number"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.quantidadeReprovada"
                label="Qtd Reprovada"
                type="number"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.custoMaQualidade"
                label="Custo da Má Qualidade (R$)"
                type="number"
                prefix="R$"
                variant="outlined"
                density="compact"
                hint="Custo extra, retrabalho ou prejuízo"
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>

          <template v-if="isEdit">
            <v-divider class="my-4"></v-divider>
            <div class="text-subtitle-1 font-weight-bold mb-2">Tratativa (Ação e Disposição)</div>

            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.disposicao"
                  :items="['RETRABALHO_INTERNO', 'RETRABALHO_FORNECEDOR', 'DEVOLUCAO', 'SUCATA', 'ACEITACAO_CONDICIONAL']"
                  label="Disposição Final"
                  variant="outlined"
                  density="comfortable"
                  clearable
                ></v-select>
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="formData.acaoCorretiva"
              label="Ação Corretiva (O que foi feito para consertar?)"
              variant="outlined"
              rows="2"
            ></v-textarea>
            
            <v-textarea
              v-model="formData.acaoPreventiva"
              label="Ação Preventiva (O que será feito para evitar repetição?)"
              variant="outlined"
              rows="2"
            ></v-textarea>
          </template>
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="save" :loading="saving" :disabled="!valid">
          Salvar RNC
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  rnc: Object
})
const emit = defineEmits(['update:modelValue', 'saved'])

const isEdit = computed(() => !!props.rnc)
const valid = ref(false)
const saving = ref(false)
const form = ref(null)

const ops = ref([])
const fornecedores = ref([])
const pecasDisponiveis = ref([])
const comprasGlobais = ref([])

const formData = ref({
  status: 'ABERTA',
  fornecedorId: null,
  opId: null,
  pecaId: null,
  compraId: null,
  descricaoFalha: '',
  quantidadeLote: null,
  quantidadeReprovada: null,
  custoMaQualidade: null,
  acaoCorretiva: '',
  acaoPreventiva: '',
  disposicao: null,
  relatorId: 1 // Default temporário
})

watch(() => props.modelValue, async (val) => {
  if (val) {
    if (!fornecedores.value.length) loadDependencies()
    if (isEdit.value) {
      formData.value = { ...props.rnc }
    } else {
      formData.value = {
        status: 'ABERTA',
        fornecedorId: null,
        opId: null,
        pecaId: null,
        compraId: null,
        descricaoFalha: '',
        quantidadeLote: null,
        quantidadeReprovada: null,
        custoMaQualidade: null,
        acaoCorretiva: '',
        acaoPreventiva: '',
        disposicao: null,
        relatorId: 1
      }
    }
  }
})

const loadDependencies = async () => {
  try {
    fornecedores.value = await $fetch('/api/fornecedores')
    ops.value = await $fetch('/api/ops')
    comprasGlobais.value = await $fetch('/api/compras')
  } catch (error) {
    console.error('Erro ao carregar dependências', error)
  }
}

watch(() => formData.value.opId, async (newOpId) => {
  if (newOpId) {
    try {
      const pecasData = await $fetch(`/api/ops/${newOpId}/pecas`)
      pecasDisponiveis.value = pecasData.map(p => ({
        ...p,
        descricaoCompleta: `${p.codigo} - ${p.descricao}`
      }))
    } catch (e) {
      pecasDisponiveis.value = []
    }
  } else {
    pecasDisponiveis.value = []
  }
})

const comprasFiltradas = computed(() => {
  if (!formData.value.fornecedorId) return comprasGlobais.value
  return comprasGlobais.value.filter(c => c.fornecedorId === formData.value.fornecedorId)
})

const save = async () => {
  if (!form.value.validate()) return
  
  saving.value = true
  try {
    if (isEdit.value) {
      await $fetch(`/api/qualidade/rncs/${props.rnc.id}`, {
        method: 'PUT',
        body: formData.value
      })
    } else {
      await $fetch('/api/qualidade/rncs', {
        method: 'POST',
        body: formData.value
      })
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    console.error(error)
    alert('Erro ao salvar RNC')
  } finally {
    saving.value = false
  }
}
</script>
