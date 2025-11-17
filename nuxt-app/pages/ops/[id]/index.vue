<template>
  <v-container fluid>
    <!-- Header Específico do Dashboard -->
    <v-row>
      <v-col cols="12">
        <v-card color="primary">
          <v-card-title class="text-white">
            <v-btn icon dark @click="$router.push('/ops')" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            📊 Dashboard Gantt - OP: {{ opData?.numeroOP }}
          </v-card-title>
          <v-card-text class="text-white">
            Visualização gráfica do progresso
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Conteúdo ESPECÍFICO do Dashboard -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Timeline de Processos (Gráfico Gantt)</span>
            <v-btn 
              color="orange" 
              @click="$router.push(`/ops/${$route.params.id}/processos`)"
              prepend-icon="mdi-cog"
            >
              Gerenciar Processos
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- AQUI VAI SEU GRÁFICO GANTT -->
            <div class="text-center py-8 border-dashed">
              <v-icon size="64" color="primary">mdi-chart-timeline-variant</v-icon>
              <div class="text-h5 text-primary mt-2">GRÁFICO GANTT</div>
              <div class="text-caption text-grey">Visualização timeline dos processos da OP</div>
              
              <!-- Estatísticas Rápidas -->
              <v-row class="mt-6">
                <v-col cols="3" v-for="stat in estatisticas" :key="stat.title">
                  <v-card variant="outlined">
                    <v-card-text class="text-center">
                      <div class="text-h4" :class="`text-${stat.color}`">{{ stat.value }}</div>
                      <div class="text-caption">{{ stat.title }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// Seu código do Dashboard Gantt aqui
console.log('📊 DASHBOARD GANTT - OP:', useRoute().params.id)
</script>

<style scoped>
.border-dashed {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
}
</style>