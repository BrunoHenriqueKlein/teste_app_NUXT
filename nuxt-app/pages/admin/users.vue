<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card color="primary" variant="flat" class="pa-4">
          <v-card-text class="d-flex justify-space-between align-center text-white">
            <div>
              <h1 class="text-h4 font-weight-bold">Gestão de Usuários</h1>
              <p class="text-subtitle-1">Controle de acessos, permissões e perfis da equipe</p>
            </div>
            <v-icon size="64" color="white" class="opacity-50">mdi-account-group</v-icon>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="elevation-1">
      <v-toolbar flat color="white">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar usuário..."
          single-line
          hide-details
          variant="outlined"
          density="compact"
          class="mx-4"
          style="max-width: 400px"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          @click="fetchUsers"
          :loading="loading"
        >
          Atualizar
        </v-btn>
      </v-toolbar>

      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        :loading="loading"
        class="elevation-0"
      >
        <template v-slot:item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            {{ item.isActive ? 'Ativo' : 'Inativo' }}
          </v-chip>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip size="small" variant="outlined" color="primary">
            {{ item.role }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            size="small"
            variant="text"
            color="primary"
            @click="editUser(item)"
            title="Editar Perfil"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            color="secondary"
            @click="managePermissions(item)"
            title="Gerenciar Permissões"
          >
            <v-icon>mdi-shield-lock</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog de Edição de Usuário -->
    <v-dialog v-model="showEditDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          Editar Usuário: {{ selectedUser?.name }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <v-form ref="editForm">
            <v-text-field
              v-model="editFormModel.name"
              label="Nome Completo"
              variant="outlined"
              prepend-inner-icon="mdi-account"
              class="mb-4"
              required
            ></v-text-field>

            <v-text-field
              v-model="editFormModel.email"
              label="E-mail"
              variant="outlined"
              prepend-inner-icon="mdi-email"
              class="mb-4"
              required
            ></v-text-field>

            <v-select
              v-model="editFormModel.role"
              label="Cargo / Função"
              :items="roles"
              variant="outlined"
              class="mb-4"
            ></v-select>
            
            <v-select
              v-model="editFormModel.department"
              label="Departamento"
              :items="departments"
              variant="outlined"
              class="mb-4"
            ></v-select>

            <v-divider class="my-4"></v-divider>
            
            <div class="text-subtitle-2 mb-2">Redefinir Senha (opcional)</div>
            <v-text-field
              v-model="editFormModel.password"
              label="Nova Senha"
              type="password"
              variant="outlined"
              prepend-inner-icon="mdi-lock-reset"
              placeholder="Deixe em branco para manter a atual"
              class="mb-4"
              hint="Por segurança, as senhas atuais não podem ser visualizadas."
              persistent-hint
            ></v-text-field>

            <v-switch
              v-model="editFormModel.isActive"
              label="Usuário Ativo"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEditDialog = false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveUserUpdates" :loading="saving">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Permissões -->
    <v-dialog v-model="showPermissionsDialog" max-width="800">
      <v-card>
        <v-card-title class="text-h5 pa-4 d-flex justify-space-between align-center">
          Permissões: {{ selectedUser?.name }}
          <v-chip color="primary" variant="tonal" size="small">{{ selectedUser?.role }}</v-chip>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <v-table density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Módulo</th>
                <th class="text-center">Visualizar</th>
                <th class="text-center">Editar</th>
                <th class="text-center">Excluir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="module in allModules" :key="module.id">
                <td>
                  <div class="d-flex align-center">
                    <v-icon size="small" class="mr-2">{{ module.icon }}</v-icon>
                    {{ module.nome }}
                  </div>
                </td>
                <td class="text-center">
                  <v-checkbox-btn
                    v-model="permissonModel[module.id].canView"
                    color="primary"
                    density="compact"
                    inline
                  ></v-checkbox-btn>
                </td>
                <td class="text-center">
                  <v-checkbox-btn
                    v-model="permissonModel[module.id].canEdit"
                    color="info"
                    density="compact"
                    inline
                  ></v-checkbox-btn>
                </td>
                <td class="text-center">
                  <v-checkbox-btn
                    v-model="permissonModel[module.id].canDelete"
                    color="error"
                    density="compact"
                    inline
                  ></v-checkbox-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showPermissionsDialog = false">Cancelar</v-btn>
          <v-btn color="secondary" @click="savePermissions" :loading="saving">Gravar Permissões</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
const { isAdmin } = useAuth()
const router = useRouter()

// Middleware de segurança local (opcional se o global já protege)
onMounted(() => {
  if (!isAdmin.value) {
    router.push('/')
  }
})

const loading = ref(false)
const saving = ref(false)
const search = ref('')
const users = ref([])
const allModules = ref([])

const showEditDialog = ref(false)
const showPermissionsDialog = ref(false)
const selectedUser = ref(null)

const editFormModel = ref({
  id: null,
  role: '',
  department: '',
  isActive: true
})

const permissonModel = ref({})

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const headers = [
  { title: 'Nome', key: 'name', align: 'start', sortable: true },
  { title: 'E-mail', key: 'email', align: 'start', sortable: true },
  { title: 'Departamento', key: 'department', align: 'start' },
  { title: 'Cargo', key: 'role', align: 'start' },
  { title: 'Status', key: 'isActive', align: 'center' },
  { title: 'Ações', key: 'actions', align: 'center', sortable: false },
]

const departments = ['ADMINISTRATIVO', 'VENDAS', 'ENGENHARIA', 'COMPRAS', 'PCP', 'QUALIDADE', 'ESTOQUE', 'MONTAGEM', 'EXPEDICAO']
const roles = ['ADMIN', 'GERENTE', 'ENGENHEIRO', 'COMPRADOR', 'PCP', 'QUALIDADE', 'ESTOQUE', 'VENDAS', 'USER']

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/admin/users/list')
    users.value = data
  } catch (err) {
    showError('Erro ao carregar usuários')
  } finally {
    loading.value = false
  }
}

const fetchModules = async () => {
  try {
    const data = await $fetch('/api/user/modules')
    allModules.value = data
  } catch (err) {
    showError('Erro ao carregar módulos')
  }
}

const editUser = (user) => {
  selectedUser.value = user
  editFormModel.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    isActive: user.isActive,
    password: '' // Inicializar vazio para reset opcional
  }
  showEditDialog.value = true
}

const saveUserUpdates = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/users/update', {
      method: 'POST',
      body: editFormModel.value
    })
    showSuccess('Usuário atualizado com sucesso')
    showEditDialog.value = false
    await fetchUsers()
  } catch (err) {
    showError('Erro ao salvar alterações')
  } finally {
    saving.value = false
  }
}

const managePermissions = (user) => {
  selectedUser.value = user
  
  // Inicializar o model de permissões
  const model = {}
  allModules.value.forEach(m => {
    // Procurar se o usuário já tem permissão para este módulo
    const userModule = user.userModules.find(um => um.moduleId === m.id)
    model[m.id] = {
      moduleId: m.id,
      canView: userModule ? userModule.canView : false,
      canEdit: userModule ? userModule.canEdit : false,
      canDelete: userModule ? userModule.canDelete : false
    }
  })
  
  permissonModel.value = model
  showPermissionsDialog.value = true
}

const savePermissions = async () => {
  saving.value = true
  try {
    const permissionsArray = Object.values(permissonModel.value)
    await $fetch('/api/admin/users/permissions', {
      method: 'POST',
      body: {
        userId: selectedUser.value.id,
        permissions: permissionsArray
      }
    })
    showSuccess('Permissões gravadas com sucesso')
    showPermissionsDialog.value = false
    await fetchUsers()
  } catch (err) {
    showError('Erro ao gravar permissões')
  } finally {
    saving.value = false
  }
}

const showSuccess = (msg) => {
  snackbar.value = { show: true, text: msg, color: 'success' }
}

const showError = (msg) => {
  snackbar.value = { show: true, text: msg, color: 'error' }
}

onMounted(() => {
  fetchUsers()
  fetchModules()
})
</script>
