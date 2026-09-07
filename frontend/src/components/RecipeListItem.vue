<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { Recipe } from '../types/api';

defineProps<{ recipe: Recipe; deleting: boolean }>();
defineEmits<{ delete: [recipe: Recipe] }>();
</script>

<template>
  <article class="recipe-card">
    <p class="eyebrow">DO MEU CADERNO</p>
    <h2><RouterLink :to="`/receitas/${recipe.id}`">{{ recipe.nome || 'Receita sem nome' }}</RouterLink></h2>
    <div class="recipe-meta">
      <span>{{ recipe.tempo_preparo_minutos === null ? 'Tempo não informado' : `${recipe.tempo_preparo_minutos} min` }}</span>
      <span>{{ recipe.porcoes === null ? 'Porções não informadas' : `${recipe.porcoes} porções` }}</span>
    </div>
    <div class="card-actions">
      <RouterLink :to="`/receitas/${recipe.id}`">Ver receita <span aria-hidden="true">→</span></RouterLink>
      <RouterLink :to="`/receitas/${recipe.id}/editar`">Editar</RouterLink>
      <button class="text-button danger" :disabled="deleting" @click="$emit('delete', recipe)">{{ deleting ? 'Excluindo…' : 'Excluir' }}</button>
    </div>
  </article>
</template>
