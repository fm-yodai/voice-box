<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <header class="bg-white shadow-sm">
    <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
      <RouterLink to="/" class="text-xl font-bold text-gray-900"> Voice Box </RouterLink>
      <div class="flex gap-4">
        <RouterLink to="/" class="text-gray-600 hover:text-gray-900"> Home </RouterLink>
        <RouterLink to="/about" class="text-gray-600 hover:text-gray-900"> About </RouterLink>
      </div>
    </nav>
  </header>
</template>
