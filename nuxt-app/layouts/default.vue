<template>
  <v-app>
    <v-app-bar color="primary" elevation="2" prominent>
      <v-app-bar-title class="d-flex align-center">
        <v-avatar color="white" size="40" class="mr-3">
          <v-icon icon="mdi-factory" color="primary" size="24" />
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-bold text-white">Sistema de Produção</div>
          <div class="text-caption text-white text-medium-emphasis">
            Sistema de controle de produção
          </div>
        </div>
      </v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer permanent color="surface" elevation="1">
      <v-list density="comfortable" nav class="py-4">
        <v-list-item
          v-for="module in navigation"
          :key="module.title"
          :prepend-icon="module.icon"
          :title="module.title"
          :value="module.route"
          @click="navigateTo(module.route)"
          variant="flat"
          class="mb-1 mx-3 rounded-lg"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-3">
      <v-container fluid class="pa-4 pa-md-6 fill-height">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
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
</script>

<style scoped>
.v-app-bar {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
}
</style>