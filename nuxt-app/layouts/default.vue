<template>
  <v-app>
    <v-app-bar color="primary" elevation="2" prominent>
      <v-container fluid class="d-flex align-center pa-0 px-4">
        <div class="d-flex align-center">
          <!-- Logo corrigida -->
          <v-img
            :width="120"
            :height="40"
            :src="logosimples"
            alt="Logo SOMEH"
            class="mr-3"
            contain
          />
          <v-divider vertical inset class="mx-3 bg-white" />
          <span class="text-h6 font-weight-bold text-white">Sistema de Controle de Produção</span>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center">
          <v-chip variant="flat" color="white" class="mr-2 custom-card">
            <v-icon icon="mdi-account" class="mr-2" size="small" />
            <span class="text-primary">Usuário Logado</span>
          </v-chip>
          
          <v-btn
            icon
            variant="text"
            color="white"
            @click="handleLogout"
            title="Sair"
            class="custom-card"
          >
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </div>
      </v-container>
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
          class="mb-1 mx-3 rounded-lg custom-card"
        ></v-list-item>
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
import { useRouter } from 'vue-router'

const router = useRouter()

// CORREÇÃO: Importação correta da logo (sem ref)
import logosimples from '@/assets/imagens/logo-someh-fundo-escuro-simples.png'

// Se ainda não funcionar, tente estas alternativas:
// ALTERNATIVA 1: 
// const logosimples = '/imagens/logo-someh-fundo-escuro-simples.png'

// ALTERNATIVA 2:
// const logosimples = new URL('@/assets/imagens/logo-someh-fundo-escuro-simples.png', import.meta.url).href

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

const navigateTo = (route) => {
  router.push(route)
}

const handleLogout = () => {
  console.log('Logout realizado')
  router.push('/login')
}

// DEBUG: Verifique se a imagem está carregando
console.log('Caminho da logo:', logosimples)
</script>

<style scoped>
.v-app-bar {
  background: linear-gradient(135deg, #1867C0, #5CBBF6) !important;
}

.v-list-item:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
  transform: translateY(-2px);
}
</style>