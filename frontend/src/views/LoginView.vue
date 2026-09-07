<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { api, ApiError } from '../services/api';
import { router } from '../router';

const route = useRoute();
const form = reactive({ login: '', senha: '' });
const loading = ref(false);
const error = ref('');
async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await api.login(form);
    await router.replace('/receitas');
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Não foi possível entrar. Tente novamente.';
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="auth-layout">
    <section class="auth-intro">
      <p class="eyebrow">SEU CADERNO NA COZINHA</p>
      <h1>Um lugar para<br>os seus sabores.</h1>
      <p>Guarde aquela receita que deu certo.<br>Encontre, prepare e compartilhe à mesa.</p>
      <div class="intro-note">Do primeiro ingrediente<br>ao último pedacinho.</div>
    </section>
    <section class="panel auth-panel" aria-labelledby="login-title">
      <h2 id="login-title">Bem-vindo de volta</h2>
      <p class="muted">Entre para abrir seu caderno de receitas.</p>
      <p v-if="route.query.cadastro === 'ok'" class="message success" role="status">Conta criada. Agora faça login.</p>
      <p v-if="error" class="message error" role="alert">{{ error }}</p>
      <form @submit.prevent="submit">
        <fieldset :disabled="loading">
          <label for="login">Login</label>
          <input id="login" v-model="form.login" autocomplete="username" required>
          <label for="senha">Senha</label>
          <input id="senha" v-model="form.senha" type="password" autocomplete="current-password" required>
          <button class="button full" type="submit">{{ loading ? 'Entrando…' : 'Entrar' }}</button>
        </fieldset>
      </form>
      <p class="auth-switch">Ainda não tem conta? <RouterLink to="/cadastro">Criar conta</RouterLink></p>
    </section>
  </div>
</template>
