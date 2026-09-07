<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import RecipeListItem from '../components/RecipeListItem.vue';
import { api } from '../services/api';
import { requestError } from '../router';
import type { Recipe } from '../types/api';

const route = useRoute();
const recipes = ref<Recipe[]>([]);
const q = ref('');
const searched = ref('');
const loading = ref(true);
const deleting = ref<number | null>(null);
const error = ref('');
const feedback = ref(route.query.excluida === 'ok' ? 'Receita excluída.' : '');
async function search() {
  loading.value = true;
  error.value = '';
  try {
    recipes.value = await api.recipes(q.value);
    searched.value = q.value;
  } catch (cause) { error.value = await requestError(cause); }
  finally { loading.value = false; }
}
async function remove(recipe: Recipe) {
  if (!window.confirm(`Excluir “${recipe.nome || 'Receita sem nome'}”? Essa ação não pode ser desfeita.`)) return;
  deleting.value = recipe.id;
  error.value = '';
  feedback.value = '';
  try {
    await api.deleteRecipe(recipe.id);
    recipes.value = recipes.value.filter(({ id }) => id !== recipe.id);
    feedback.value = 'Receita excluída.';
  } catch (cause) { error.value = await requestError(cause); }
  finally { deleting.value = null; }
}
onMounted(search);
</script>

<template>
  <section>
    <div class="page-heading">
      <div><p class="eyebrow">PARA COZINHAR DE NOVO</p><h1>Minhas receitas</h1><p class="muted">As suas favoritas começam aqui.</p></div>
      <RouterLink class="button" to="/receitas/nova">+ Nova receita</RouterLink>
    </div>
    <form class="search-form" role="search" @submit.prevent="search">
      <label for="pesquisa">Encontre uma receita pelo nome</label>
      <div class="search-row">
        <input id="pesquisa" v-model="q" type="search" placeholder="Qual receita vamos preparar?" :disabled="loading || deleting !== null">
        <button class="button secondary" :disabled="loading || deleting !== null">{{ loading ? 'Pesquisando…' : 'Pesquisar' }}</button>
      </div>
    </form>
    <p v-if="feedback" class="message success" role="status">{{ feedback }}</p>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <p v-if="loading" class="empty-state" role="status">Carregando receitas…</p>
    <template v-else-if="!error">
      <p v-if="!recipes.length" class="empty-state">{{ searched ? 'Nenhuma receita encontrada. Experimente outro nome.' : 'Seu caderno ainda está em branco. Que tal guardar a primeira receita?' }}</p>
      <div v-else class="recipe-grid">
        <RecipeListItem v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" :deleting="deleting !== null" @delete="remove" />
      </div>
    </template>
  </section>
</template>
