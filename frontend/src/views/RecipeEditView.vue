<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import RecipeForm from '../components/RecipeForm.vue';
import { api } from '../services/api';
import { requestError, router } from '../router';
import type { Category, CreateRecipeInput, Recipe } from '../types/api';

const route = useRoute();
const id = typeof route.params.id === 'string' ? route.params.id : undefined;
const recipe = ref<Recipe>();
const categories = ref<Category[]>([]);
const loading = ref(true);
const ready = ref(false);
const saving = ref(false);
const error = ref('');
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [list, existing] = await Promise.all([api.categories(), id ? api.recipe(id) : undefined]);
    categories.value = list;
    recipe.value = existing;
    ready.value = true;
  } catch (cause) { error.value = await requestError(cause); }
  finally { loading.value = false; }
}
async function save(input: CreateRecipeInput) {
  saving.value = true;
  error.value = '';
  try {
    const saved = id ? await api.updateRecipe(id, input) : await api.createRecipe(input);
    await router.push(`/receitas/${saved.id}?salva=ok`);
  } catch (cause) { error.value = await requestError(cause); }
  finally { saving.value = false; }
}
onMounted(load);
</script>

<template>
  <section class="narrow">
    <RouterLink class="back-link" to="/receitas">← Minhas receitas</RouterLink>
    <p class="eyebrow">DO SEU JEITO</p>
    <h1>{{ id ? 'Editar receita' : 'Nova receita' }}</h1>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <p v-if="loading" class="empty-state" role="status">Carregando formulário…</p>
    <RecipeForm v-else-if="ready" :recipe="recipe" :categories="categories" :saving="saving" @save="save" />
    <button v-else class="button secondary" @click="load">Tentar novamente</button>
  </section>
</template>
