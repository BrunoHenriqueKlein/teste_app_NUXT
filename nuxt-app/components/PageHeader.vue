<template>
  <v-row class="mb-4">
    <v-col cols="12">
      <v-card color="primary" variant="flat" class="rounded-lg pa-2">
        <v-card-text class="d-flex justify-space-between align-center py-2 text-white">
          <div class="d-flex align-center">
            <v-avatar v-if="icon" color="white" variant="tonal" size="48" class="mr-4">
              <v-icon color="white" size="28">{{ icon }}</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h5 font-weight-bold mb-0">{{ title }}</h1>
              <div class="text-caption opacity-80" v-if="subtitle">
                {{ subtitle }}
              </div>
            </div>
          </div>
          <div class="d-flex gap-2">
            <slot name="actions"></slot>
            <div class="text-right d-none d-sm-block ml-4" v-if="showStatus">
              <v-chip color="white" size="small" variant="outlined" prepend-icon="mdi-check-circle">Sistema Online</v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  showStatus: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.opacity-80 {
  opacity: 0.8;
}
.gap-2 {
  gap: 8px;
}
</style>
