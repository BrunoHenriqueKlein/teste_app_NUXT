<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-2 rounded-lg">
          <v-card-title class="text-h5 pa-6 d-flex align-center">
            <v-icon large color="primary" class="mr-3">mdi-account-circle</v-icon>
            Meu Perfil
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleUpdateProfile">
              <!-- Informações Básicas -->
              <div class="text-subtitle-1 font-weight-bold mb-4">Informações Básicas</div>
              
              <v-text-field
                v-model="profileForm.name"
                label="Nome Completo"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                class="mb-4"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="user.email"
                label="E-mail"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                class="mb-6"
                disabled
                hint="O e-mail não pode ser alterado"
                persistent-hint
              ></v-text-field>

              <div class="d-flex gap-4 mb-6">
                <v-chip color="primary" variant="flat">
                  <v-icon left>mdi-shield-account</v-icon>
                  {{ user.role }}
                </v-chip>
                <v-chip color="secondary" variant="flat">
                  <v-icon left>mdi-office-building</v-icon>
                  {{ user.department }}
                </v-chip>
              </div>

              <v-divider class="mb-6"></v-divider>

              <!-- Alterar Senha -->
              <div class="d-flex justify-space-between align-center mb-4">
                <div class="text-subtitle-1 font-weight-bold">Alterar Senha</div>
                <v-switch
                  v-model="changePassword"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
              </div>

              <v-expand-transition>
                <div v-if="changePassword">
                  <v-text-field
                    v-model="profileForm.currentPassword"
                    label="Senha Atual"
                    type="password"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock"
                    class="mb-4"
                    required
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="profileForm.newPassword"
                    label="Nova Senha"
                    type="password"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock-reset"
                    class="mb-4"
                    required
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="profileForm.confirmPassword"
                    label="Confirmar Nova Senha"
                    type="password"
                    variant="outlined"
                    prepend-inner-icon="mdi-check-all"
                    class="mb-4"
                    required
                    :rules="[v => v === profileForm.newPassword || 'As senhas não coincidem']"
                  ></v-text-field>
                </div>
              </v-expand-transition>

              <v-alert
                v-if="statusMessage"
                :type="statusType"
                variant="tonal"
                class="mb-6"
                closable
                @click:close="statusMessage = ''"
              >
                {{ statusMessage }}
              </v-alert>

              <div class="d-flex justify-end gap-2">
                <v-btn
                  variant="text"
                  @click="$router.back()"
                >
                  Voltar
                </v-btn>
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                  size="large"
                >
                  Salvar Alterações
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const { user, updateProfile } = useAuth()
const loading = ref(false)
const changePassword = ref(false)
const statusMessage = ref('')
const statusType = ref('success')

const profileForm = ref({
  userId: user.value?.id,
  name: user.value?.name,
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleUpdateProfile = async () => {
  if (changePassword.value && profileForm.value.newPassword !== profileForm.value.confirmPassword) {
    statusMessage.value = 'As senhas não coincidem'
    statusType.value = 'error'
    return
  }

  loading.value = true
  statusMessage.value = ''

  const success = await updateProfile({
    userId: user.value.id,
    name: profileForm.value.name,
    currentPassword: changePassword.value ? profileForm.value.currentPassword : null,
    newPassword: changePassword.value ? profileForm.value.newPassword : null
  })

  if (success) {
    statusMessage.value = 'Perfil atualizado com sucesso!'
    statusType.value = 'success'
    changePassword.value = false
    profileForm.value.currentPassword = ''
    profileForm.value.newPassword = ''
    profileForm.value.confirmPassword = ''
  } else {
    const { error } = useAuth()
    statusMessage.value = error.value || 'Erro ao atualizar perfil'
    statusType.value = 'error'
  }
  
  loading.value = false
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
