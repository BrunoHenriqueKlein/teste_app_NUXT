<template>
  <v-app>
    <v-app-bar color="primary" elevation="1" height="50">
      <v-container fluid class="d-flex align-center pa-0 px-4">
        <div class="d-flex align-center">
          <!-- Logo -->
          <v-img
            :width="100"
            :height="30"
            :src="logosimples"
            alt="Logo SOMEH"
            class="mr-3"
            contain
          />
          <v-divider vertical inset class="mx-2 bg-white" />
          <span class="text-subtitle-1 font-weight-bold text-white">Sistema SOMEH</span>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center">
          <!-- Menu do Usuário -->
          <v-menu location="bottom end" :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="text" class="text-white" rounded="lg">
                <v-avatar size="36" color="white" class="mr-2">
                  <v-icon color="primary" size="24">mdi-account-circle</v-icon>
                </v-avatar>
                <div class="text-left d-none d-md-flex flex-column">
                  <span class="font-weight-bold">{{ userName }}</span>
                  <span class="text-caption">{{ userRole }} - {{ userDepartment }}</span>
                </div>
                <v-icon right class="ml-1">mdi-chevron-down</v-icon>
              </v-btn>
            </template>

            <v-card width="300" class="custom-card">
              <v-card-text class="pa-4">
                <div class="d-flex align-center mb-3">
                  <v-avatar size="60" color="primary" class="mr-3">
                    <v-icon color="white" size="32">mdi-account-circle</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h6 font-weight-bold">{{ userName }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ user.email }}
                    </div>
                    <v-chip size="small" color="primary" variant="flat" class="mt-1">
                      {{ userRole }}
                    </v-chip>
                  </div>
                </div>

                <v-divider class="my-3"></v-divider>

                <v-list density="compact">
                  <v-list-item @click="navigateTo('/perfil')">
                    <template v-slot:prepend>
                      <v-icon>mdi-account-cog</v-icon>
                    </template>
                    <v-list-item-title>Meu Perfil</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click="navigateTo('/configuracoes')">
                    <template v-slot:prepend>
                      <v-icon>mdi-cog</v-icon>
                    </template>
                    <v-list-item-title>Configurações</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click="toggleTheme">
                    <template v-slot:prepend>
                      <v-icon>mdi-theme-light-dark</v-icon>
                    </template>
                    <v-list-item-title>Alternar Tema</v-list-item-title>
                  </v-list-item>

                  <v-divider class="my-2"></v-divider>

                  <v-list-item @click="handleLogout" class="text-error">
                    <template v-slot:prepend>
                      <v-icon color="error">mdi-logout</v-icon>
                    </template>
                    <v-list-item-title class="text-error">Sair do Sistema</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-menu>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer permanent color="surface" elevation="1" width="240">
      <v-list density="compact" nav class="py-2">
        <!-- Filtro de Módulos por Permissão -->
        <v-list-item
          v-for="module in filteredNavigation"
          :key="module.title"
          :prepend-icon="module.icon"
          :title="module.title"
          :value="module.route"
          @click="navigateTo(module.route)"
          :active="$route.path === module.route"
          variant="text"
          class="mb-0 mx-2 rounded-lg"
          :class="{ 'v-list-item--active': $route.path === module.route }"
        >
          <template v-slot:append v-if="module.badge">
            <v-badge :content="module.badge" color="error" inline></v-badge>
          </template>
        </v-list-item>
      </v-list>
      
      <!-- Status do Sistema -->
      <div class="pa-4 mt-auto">
        <v-card variant="flat" color="grey-lighten-3" class="custom-card">
          <v-card-text class="text-center">
            <div class="text-caption text-medium-emphasis mb-1">Status do Sistema</div>
            <v-chip size="small" color="success" variant="flat">
              <v-icon start size="small">mdi-check-circle</v-icon>
              Online
            </v-chip>
            <div class="text-caption text-medium-emphasis mt-2">
              {{ currentTime }}
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-3">
      <v-container fluid class="pt-1 px-3 pa-md-4 fill-height align-start">
        <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-1 text-caption">
          <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
        
        <slot />
      </v-container>
    </v-main>

    <!-- Snackbar para notificações -->
    <v-snackbar v-model="showLogoutConfirm" timeout="4000" color="warning">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-logout</v-icon>
        <span>Clique novamente para confirmar o logout</span>
      </div>
      <template v-slot:actions>
        <v-btn variant="text" @click="confirmLogout">Confirmar</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
const { user, userName, userRole, userDepartment, logout, hasPermission, isAdmin } = useAuth()
const router = useRouter()
const route = useRoute()

// Estado
const showLogoutConfirm = ref(false)
const logoutTimer = ref(null)
const currentTime = ref('')

// Importar logo
import logosimples from '@/assets/imagens/logo-someh-fundo-escuro-simples.png'

// Navegação base
const navigation = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', route: '/', moduleName: 'Dashboard' },
  { title: 'Tarefas', icon: 'mdi-clipboard-check-multiple', route: '/tarefas', moduleName: 'Tarefas' },
  { title: 'Ordens de Produção', icon: 'mdi-clipboard-list', route: '/ops', moduleName: 'Ordens de Produção' },
  { title: 'Processos', icon: 'mdi-cog', route: '/processos', moduleName: 'Processos' },
  { title: 'Peças (BOM)', icon: 'mdi-cogs', route: '/pecas', moduleName: 'Peças' },
  { title: 'PCP', icon: 'mdi-factory', route: '/pcp', moduleName: 'PCP' },
  { title: 'Estoque', icon: 'mdi-warehouse', route: '/estoque', moduleName: 'Estoque' },
  { title: 'Compras', icon: 'mdi-cart', route: '/compras', moduleName: 'Compras' },
  { title: 'Relatórios', icon: 'mdi-chart-bar', route: '/relatorios', moduleName: 'Relatórios' },
]

// Adicionar Administração apenas para Admins
const adminNavigation = [
  { title: 'Usuários', icon: 'mdi-account-group', route: '/admin/users', isAdminOnly: true },
  { title: 'Configurações', icon: 'mdi-cog', route: '/admin/config', isAdminOnly: true },
]

// Carregar dados
onMounted(() => {
  updateTime()
  const timer = setInterval(updateTime, 60000)
  onUnmounted(() => clearInterval(timer))
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) + ' • ' + now.toLocaleDateString('pt-BR')
}

// Computed Properties
const filteredNavigation = computed(() => {
  // Filtrar módulos normais por permissão canView
  const filtered = navigation.filter(item => hasPermission(item.moduleName, 'canView'))
  
  // Adicionar itens de admin se for ADMIN
  if (isAdmin.value) {
    filtered.push(...adminNavigation)
  }
  
  return filtered
})

const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(x => x)
  const crumbs = []
  
  crumbs.push({ title: 'Home', disabled: pathArray.length === 0, to: '/' })
  
  let cumulativePath = ''
  pathArray.forEach((segment, index) => {
    cumulativePath += '/' + segment
    const nameMap = {
      'ops': 'Ordens de Produção',
      'processos': 'Processos',
      'pecas': 'Peças',
      'estoque': 'Estoque',
      'compras': 'Compras',
      'relatorios': 'Relatórios',
      'admin': 'Administração',
      'users': 'Usuários',
      'perfil': 'Meu Perfil'
    }
    crumbs.push({
      title: nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      disabled: index === pathArray.length - 1,
      to: cumulativePath
    })
  })
  return crumbs
})

// Funções
const handleLogout = () => {
  if (!showLogoutConfirm.value) {
    showLogoutConfirm.value = true
    if (logoutTimer.value) clearTimeout(logoutTimer.value)
    logoutTimer.value = setTimeout(() => { showLogoutConfirm.value = false }, 4000)
    return
  }
  confirmLogout()
}

const confirmLogout = () => {
  if (logoutTimer.value) clearTimeout(logoutTimer.value)
  logout()
}

const navigateToPage = (path) => {
  router.push(path)
}
</script>

<style scoped>
.v-app-bar {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
}

.v-list-item:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.v-list-item--active {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
  color: white !important;
}

.v-list-item--active .v-icon {
  color: white !important;
}

/* Estilo para o menu do usuário */
.v-btn--variant-text:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Ajustes responsivos */
@media (max-width: 960px) {
  .v-app-bar-title span {
    font-size: 1rem !important;
  }
  
  .d-none.d-md-flex {
    display: none !important;
  }
  
  .v-divider.mx-3 {
    display: none;
  }
}

/* Animações */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.v-menu__content {
  animation: fadeIn 0.2s ease-out;
}
</style>