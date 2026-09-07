<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { api, ApiError } from '../services/api';
import { router } from '../router';

const form = reactive({ nome: '', login: '', senha: '' });
const loading = ref(false);
const error = ref('');
async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await api.register({ ...form, nome: form.nome === '' ? null : form.nome });
    await router.replace('/login?cadastro=ok');
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Não foi possível criar a conta. Tente novamente.';
  } finally { loading.value = false; }
}
</script>

<template>
  <section class="panel auth-panel centered" aria-labelledby="register-title">
    <p class="eyebrow">COMECE SEU CADERNO</p>
    <h1 id="register-title">Criar conta</h1>
    <p class="muted">Suas receitas, reunidas em um só lugar.</p>
    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <form @submit.prevent="submit">
      <fieldset :disabled="loading">
        <label for="nome">Nome <span class="optional">(opcional)</span></label>
        <input id="nome" v-model="form.nome" autocomplete="name" aria-describedby="nome-hint">
        <small id="nome-hint">Até 100 caracteres.</small>
        <label for="login">Login</label>
        <input id="login" v-model="form.login" autocomplete="username" required aria-describedby="login-hint">
        <small id="login-hint">Até 100 caracteres.</small>
        <label for="senha">Senha</label>
        <input id="senha" v-model="form.senha" type="password" autocomplete="new-password" required>
        <button class="button full" type="submit">{{ loading ? 'Criando conta…' : 'Criar conta' }}</button>
      </fieldset>
    </form>
    <p class="auth-switch">Já tem conta? <RouterLink to="/login">Entrar</RouterLink></p>
  </section>
</template>
