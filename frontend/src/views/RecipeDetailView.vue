<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { api } from '../services/api';
import { requestError, router } from '../router';
import type { Category, Recipe } from '../types/api';

const route = useRoute();
const recipe = ref<Recipe>();
const categories = ref<Category[]>([]);
const loading = ref(true);
const deleting = ref(false);
const error = ref('');
const category = computed(() => categories.value.find(({ id }) => id === recipe.value?.id_categorias));
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [found, list] = await Promise.all([api.recipe(String(route.params.id)), api.categories()]);
    recipe.value = found;
    categories.value = list;
  } catch (cause) { error.value = await requestError(cause); }
  finally { loading.value = false; }
}
async function remove() {
  if (!recipe.value || !window.confirm(`Excluir “${recipe.value.nome || 'Receita sem nome'}”? Essa ação não pode ser desfeita.`)) return;
  deleting.value = true;
  error.value = '';
  try {
    await api.deleteRecipe(recipe.value.id);
    await router.replace('/receitas?excluida=ok');
  } catch (cause) { error.value = await requestError(cause); }
  finally { deleting.value = false; }
}
function printRecipe() { window.print(); }
onMounted(load);
</script>

<template>
  <section class="narrow">
    <RouterLink class="back-link no-print" to="/receitas">← Minhas receitas</RouterLink>
    <p v-if="error" class="message error no-print" role="alert">{{ error }}</p>
    <p v-if="loading" class="empty-state no-print" role="status">Carregando receita…</p>
    <template v-else-if="recipe">
      <p v-if="route.query.salva === 'ok'" class="message success no-print" role="status">Receita salva.</p>
      <div class="detail-actions no-print">
        <button class="button" :disabled="deleting" @click="printRecipe">Imprimir receita</button>
        <RouterLink class="button secondary" :to="`/receitas/${recipe.id}/editar`">Editar</RouterLink>
        <button class="text-button danger" :disabled="deleting" @click="remove">{{ deleting ? 'Excluindo…' : 'Excluir' }}</button>
      </div>
      <article class="panel recipe-sheet">
        <p class="eyebrow">CADERNO DE RECEITAS</p>
        <h1>{{ recipe.nome || 'Receita sem nome' }}</h1>
        <p v-if="category" class="category-label">{{ category.nome ?? `Categoria ${category.id}` }}</p>
        <dl class="detail-meta">
          <div><dt>Tempo de preparo</dt><dd>{{ recipe.tempo_preparo_minutos === null ? 'Não informado' : `${recipe.tempo_preparo_minutos} minutos` }}</dd></div>
          <div><dt>Rendimento</dt><dd>{{ recipe.porcoes === null ? 'Não informado' : `${recipe.porcoes} porções` }}</dd></div>
        </dl>
        <section><h2>Ingredientes</h2><p class="recipe-text">{{ recipe.ingredientes || 'Não informados.' }}</p></section>
        <section><h2>Modo de preparo</h2><p class="recipe-text">{{ recipe.modo_preparo || 'Não informado.' }}</p></section>
      </article>
    </template>
    <button v-else class="button secondary no-print" @click="load">Tentar novamente</button>
  </section>
</template>
