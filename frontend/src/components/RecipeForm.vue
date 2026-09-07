<script setup lang="ts">
import { reactive } from 'vue';
import { RouterLink } from 'vue-router';
import type { Category, CreateRecipeInput, Recipe } from '../types/api';

const props = defineProps<{ recipe?: Recipe; categories: Category[]; saving: boolean }>();
const emit = defineEmits<{ save: [input: CreateRecipeInput] }>();
const form = reactive({
  nome: props.recipe?.nome ?? null,
  id_categorias: props.recipe?.id_categorias ?? null,
  tempo_preparo_minutos: (props.recipe?.tempo_preparo_minutos ?? '') as number | '',
  porcoes: (props.recipe?.porcoes ?? '') as number | '',
  ingredientes: props.recipe?.ingredientes ?? null,
  modo_preparo: props.recipe?.modo_preparo ?? '',
});
function submit() {
  emit('save', {
    nome: form.nome,
    id_categorias: form.id_categorias,
    tempo_preparo_minutos: form.tempo_preparo_minutos === '' ? null : form.tempo_preparo_minutos,
    porcoes: form.porcoes === '' ? null : form.porcoes,
    ingredientes: form.ingredientes,
    modo_preparo: form.modo_preparo,
  });
}
</script>

<template>
  <form class="panel recipe-form" @submit.prevent="submit">
    <p class="muted">Preencha o que quiser guardar. Campos opcionais podem ficar sem valor.</p>
    <fieldset :disabled="saving">
      <div class="form-grid">
        <div>
          <label for="nome">Nome da receita <span class="optional">(opcional)</span></label>
          <input id="nome" v-model="form.nome" aria-describedby="nome-hint" placeholder="Ex.: bolo de laranja">
          <small id="nome-hint">Até 45 caracteres.</small>
        </div>
        <div>
          <label for="categoria">Categoria <span class="optional">(opcional)</span></label>
          <select id="categoria" v-model="form.id_categorias">
            <option :value="null">Sem categoria</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.nome ?? `Categoria ${category.id}` }}</option>
          </select>
        </div>
        <div>
          <label for="tempo">Tempo de preparo (minutos) <span class="optional">(opcional)</span></label>
          <input id="tempo" v-model.number="form.tempo_preparo_minutos" type="number" min="0" max="4294967295" step="1" inputmode="numeric">
        </div>
        <div>
          <label for="porcoes">Porções <span class="optional">(opcional)</span></label>
          <input id="porcoes" v-model.number="form.porcoes" type="number" min="0" max="4294967295" step="1" inputmode="numeric">
        </div>
      </div>
      <label for="ingredientes">Ingredientes <span class="optional">(opcional)</span></label>
      <textarea id="ingredientes" v-model="form.ingredientes" rows="6" placeholder="Uma linha para cada ingrediente"></textarea>
      <label for="modo">Modo de preparo</label>
      <textarea id="modo" v-model="form.modo_preparo" rows="8" placeholder="Conte como preparar a receita"></textarea>
      <div class="form-actions">
        <button class="button" type="submit">{{ saving ? 'Salvando…' : 'Salvar receita' }}</button>
        <RouterLink v-if="!saving" :to="recipe ? `/receitas/${recipe.id}` : '/receitas'">Cancelar</RouterLink>
      </div>
    </fieldset>
  </form>
</template>
