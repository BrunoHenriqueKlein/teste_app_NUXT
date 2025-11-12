<template>
  <v-app>
    <!-- App Bar Superior -->
    <v-app-bar color="primary" elevation="2" prominent>
      <v-app-bar-nav-icon 
        @click="drawer = !drawer" 
        class="d-md-none"
      ></v-app-bar-nav-icon>
      
      <v-app-bar-title class="d-flex align-center">
        <v-avatar color="white" size="40" class="mr-3">
          <v-icon icon="mdi-factory" color="primary" size="24"></v-icon>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-bold text-white">Sistema de Produção</div>
          <div class="text-caption text-white text-medium-emphasis" v-if="opSelecionada">
            OP Ativa: {{ opSelecionada.numeroOP }} - {{ opSelecionada.descricaoMaquina }}
          </div>
          <div class="text-caption text-white text-medium-emphasis" v-else>
            Nenhuma OP selecionada
          </div>
        </div>
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Notificações -->
      <v-badge color="error" dot overlap>
        <v-btn 
          icon 
          variant="text" 
          class="text-white"
          @click="showNotifications = true"
        >
          <v-icon>mdi-bell-outline</v-icon>
        </v-btn>
      </v-badge>

      <!-- User Menu -->
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn 
            v-bind="props" 
            variant="text" 
            class="text-white text-capitalize ml-2"
          >
            <v-avatar size="36" color="white" class="mr-2">
              <span class="text-primary text-caption font-weight-bold">{{ userInitials }}</span>
            </v-avatar>
            <div class="text-left d-none d-sm-block">
              <div class="text-body-2 font-weight-medium">{{ user?.name }}</div>
              <div class="text-caption">{{ user?.role }}</div>
            </div>
            <v-icon end class="text-white">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        
        <v-list density="compact" width="200">
          <v-list-item 
            prepend-icon="mdi-account" 
            title="Meu Perfil"
            @click="viewProfile"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-cog" 
            title="Configurações"
            @click="viewSettings"
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item 
            @click="handleLogout" 
            prepend-icon="mdi-logout" 
            title="Sair"
            color="error"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer 
      v-model="drawer" 
      permanent
      color="surface"
      elevation="1"
    >
      <v-list density="comfortable" nav class="py-4">
        <v-list-item
          v-for="module in navigation"
          :key="module.title"
          :value="module.route"
          :prepend-icon="module.icon"
          :title="module.title"
          :active="isActiveModule(module.route)"
          @click="navigateTo(module.route)"
          variant="flat"
          class="mb-1 mx-3 rounded-lg"
          :color="isActiveModule(module.route) ? 'primary' : undefined"
          :class="{ 'text-white': isActiveModule(module.route) }"
        >
        </v-list-item>
      </v-list>

      <!-- Footer do Drawer -->
      <template v-slot:append>
        <div class="pa-4 text-center">
          <v-divider class="mb-3"></v-divider>
          <v-chip size="small" color="primary" variant="flat">
            v1.0.0
          </v-chip>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Conteúdo Principal -->
    <v-main class="bg-grey-lighten-3">
      <v-container fluid class="pa-4 pa-md-6 fill-height">
        <v-fade-transition mode="out-in">
          <slot />
        </v-fade-transition>
      </v-container>
    </v-main>

    <!-- Notifications Dialog -->
    <v-dialog v-model="showNotifications" max-width="400">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h6">Notificações</span>
          <v-btn icon @click="showNotifications = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-2">
            <template v-slot:prepend>
              <v-icon color="info">mdi-information</v-icon>
            </template>
            Sistema em desenvolvimento
          </v-alert>
          <div class="text-center text-medium-emphasis py-4">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-bell-off</v-icon>
            <div>Nenhuma notificação no momento</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
// Estado reativo
const user = ref({
  name: 'Administrador',
  role: 'ADMIN',
  department: 'ADMINISTRATIVO'
})
const opSelecionada = ref(null)
const drawer = ref(true)
const showNotifications = ref(false)

// Navegação
const navigation = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', route: '/' },
  { title: 'Ordens de Produção', icon: 'mdi-clipboard-list', route: '/ops' },
  { title: 'Processos', icon: 'mdi-cog', route: '/processos' },
  { title: 'Peças', icon: 'mdi-cube', route: '/pecas' },
  { title: 'Estoque', icon: 'mdi-warehouse', route: '/estoque' },
  { title: 'Compras', icon: 'mdi-cart', route: '/compras' },
  { title: 'Relatórios', icon: 'mdi-chart-bar', route: '/relatorios' },
  { title: 'Administração', icon: 'mdi-cog', route: '/admin' },
]

// Computed para iniciais do usuário
const userInitials = computed(() => {
  if (!user.value?.name) return 'U'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

// Verificar se o módulo está ativo
const isActiveModule = (path) => {
  return useRoute().path === path
}

// Ações do usuário
const viewProfile = () => {
  // Implementar visualização do perfil
  console.log('Ver perfil')
}

const viewSettings = () => {
  // Implementar configurações
  console.log('Configurações')
}

const handleLogout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  navigateTo('/login')
}
</script>

<style scoped>
/* Estilos personalizados para o layout */
.v-app-bar {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
}

.v-navigation-drawer {
  border-right: 1px solid rgba(0,0,0,0.12);
}

/* Ajustes para mobile */
@media (max-width: 960px) {
  .v-container {
    padding: 16px !important;
  }
}

/* Transições suaves */
.v-main {
  transition: all 0.3s ease;
  min-height: calc(100vh - 64px);
}

.fill-height {
  min-height: calc(100vh - 64px);
}
</style>