<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h4 text-primary">
            Processos da OP: {{ $route.params.id }}
          </v-card-title>
          <v-card-text>
            <v-alert type="info">
              Módulo de Processos - Em desenvolvimento
            </v-alert>
            <v-btn @click="$router.back()" color="primary" class="mt-4">
              Voltar para OPs
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>