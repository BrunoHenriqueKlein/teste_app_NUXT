<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h4 text-primary">
            Detalhes da OP: {{ $route.params.id }}
          </v-card-title>
          <v-card-text>
            <v-alert type="success">
              Página de detalhes carregada com sucesso!
            </v-alert>
            <v-btn @click="$router.back()" color="primary" class="mt-4">
              Voltar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
console.log('📄 Página de detalhes carregada para OP:', useRoute().params.id)
</script>