<template>
  <div class="w-100 pa-4">
    <PageHeader 
      title="Relatórios e Dashboards" 
      subtitle="Selecione um relatório para visualizar os indicadores do sistema"
      icon="mdi-chart-bar"
    />

    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-card 
          variant="outlined" 
          class="h-100 hover-card" 
          @click="navigateTo('/workload')"
        >
          <v-card-item class="pa-6">
            <v-icon size="48" color="primary" class="mb-4">mdi-chart-timeline-variant</v-icon>
            <v-card-title class="text-h6 font-weight-bold">Carga de Trabalho (Workload)</v-card-title>
            <v-card-subtitle class="mt-2 text-body-2">
              Visualize a ocupação da equipe, calendário de tarefas e identifique atrasos.
            </v-card-subtitle>
          </v-card-item>
          <v-divider />
          <v-card-actions class="px-6 py-4">
            <span class="text-primary font-weight-bold">Acessar Relatório</span>
            <v-spacer />
            <v-icon color="primary">mdi-arrow-right</v-icon>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Espaço para futuros relatórios -->
      <v-col cols="12" sm="6" md="4">
        <v-card variant="outlined" class="h-100 opacity-60 border-dashed">
          <v-card-item class="pa-6 text-center">
            <v-icon size="48" color="grey" class="mb-4">mdi-plus-circle-outline</v-icon>
            <v-card-title class="text-grey">Novos Relatórios</v-card-title>
            <v-card-subtitle class="mt-2">
              Os próximos módulos de análise serão adicionados aqui.
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped>
.hover-card {
  transition: all 0.3s ease;
  cursor: pointer;
}
.hover-card:hover {
  transform: translateY(-5px);
  border-color: var(--v-primary-base) !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.border-dashed {
  border-style: dashed !important;
}
</style>
