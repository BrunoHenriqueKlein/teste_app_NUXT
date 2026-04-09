<template>
  <div class="w-100">
    <PageHeader 
      title="Meu Perfil" 
      subtitle="Gerencie suas informações pessoais e segurança"
      icon="mdi-account-circle"
    />
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-2 rounded-lg mt-4">
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

              <!-- Configurações de E-mail -->
              <div class="text-subtitle-1 font-weight-bold mb-4">Configurações de E-mail (Envio de Orçamentos)</div>
              
              <v-row>
                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="profileForm.mailHost"
                    label="Servidor SMTP"
                    placeholder="ex: smtp.gmail.com"
                    variant="outlined"
                    prepend-inner-icon="mdi-server"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="profileForm.mailPort"
                    label="Porta"
                    type="number"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-text-field
                v-model="profileForm.mailUser"
                label="Usuário SMTP (E-mail)"
                variant="outlined"
                prepend-inner-icon="mdi-account-key"
              ></v-text-field>

              <v-text-field
                v-model="profileForm.mailPass"
                label="Senha SMTP"
                type="password"
                variant="outlined"
                prepend-inner-icon="mdi-key"
              ></v-text-field>

              <v-text-field
                v-model="profileForm.mailFrom"
                label="Nome do Remetente"
                placeholder="ex: João - Compras SOMEH"
                variant="outlined"
                prepend-inner-icon="mdi-rename-box"
              ></v-text-field>

              <v-switch
                v-model="profileForm.mailSecure"
                label="Usar SSL/TLS Seguro (Porta 465)"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>

              <div class="text-subtitle-2 mb-4 text-grey">Configurações Adicionais (Opcional)</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="profileForm.imapHost"
                    label="Servidor IMAP"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="profileForm.popHost"
                    label="Servidor POP"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-6"></v-divider>

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
                  color="info"
                  variant="outlined"
                  size="large"
                  class="mr-2"
                  @click="testEmailConnection"
                  :loading="testingConnection"
                >
                  Testar Conexão
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
  </div>
</template>

<script setup>
const { user, updateProfile } = useAuth()
const loading = ref(false)
const changePassword = ref(false)
const statusMessage = ref('')
const statusType = ref('success')
const testingConnection = ref(false)

const profileForm = ref({
  userId: user.value?.id,
  name: user.value?.name,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  mailHost: user.value?.mailHost || '',
  mailPort: user.value?.mailPort || 587,
  mailUser: user.value?.mailUser || '',
  mailPass: user.value?.mailPass || '',
  mailSecure: user.value?.mailSecure || false,
  mailFrom: user.value?.mailFrom || '',
  imapHost: user.value?.imapHost || '',
  popHost: user.value?.popHost || ''
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
    newPassword: changePassword.value ? profileForm.value.newPassword : null,
    mailHost: profileForm.value.mailHost,
    mailPort: profileForm.value.mailPort,
    mailUser: profileForm.value.mailUser,
    mailPass: profileForm.value.mailPass,
    mailSecure: profileForm.value.mailSecure,
    mailFrom: profileForm.value.mailFrom,
    imapHost: profileForm.value.imapHost,
    popHost: profileForm.value.popHost
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

const testEmailConnection = async () => {
  testingConnection.value = true
  statusMessage.value = ''
  
  try {
    const response = await $fetch('/api/user/test-email', {
      method: 'POST',
      body: {
        mailHost: profileForm.value.mailHost,
        mailPort: profileForm.value.mailPort,
        mailUser: profileForm.value.mailUser,
        mailPass: profileForm.value.mailPass,
        mailSecure: profileForm.value.mailSecure,
        mailFrom: profileForm.value.mailFrom
      }
    })
    
    statusMessage.value = response.message
    statusType.value = 'success'
  } catch (error) {
    statusMessage.value = error.data?.statusMessage || error.message || 'Falha ao testar conexão'
    statusType.value = 'error'
  } finally {
    testingConnection.value = false
  }
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
