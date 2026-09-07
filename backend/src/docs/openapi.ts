import { authCookieName } from '../auth/cookie.ts';

const id = { type: 'integer', minimum: 1, maximum: 4_294_967_295 };
const uint = { type: 'integer', minimum: 0, maximum: 4_294_967_295, nullable: true };
const text = { type: 'string', description: 'Até 65535 bytes UTF-8. Texto vazio é aceito.' };
const recipeFields = {
  id_categorias: { ...id, nullable: true, description: 'Categoria existente, ou null.' },
  nome: { type: 'string', maxLength: 45, nullable: true },
  tempo_preparo_minutos: uint,
  porcoes: uint,
  modo_preparo: text,
  ingredientes: { ...text, nullable: true },
};
const credentials = {
  login: { type: 'string', minLength: 1, maxLength: 100 },
  senha: { type: 'string', minLength: 1, format: 'password', description: 'Até 72 bytes UTF-8, usada como enviada.' },
};
const errorContent = { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } };
const invalid = { description: 'JSON, parâmetros ou dados inválidos; categoria inexistente.', content: errorContent };
const unauthorized = { description: 'Autenticação ausente, inválida ou expirada.', content: errorContent };
const notFound = { description: 'Receita não encontrada para o usuário autenticado.', content: errorContent };
const unexpected = { description: 'Erro interno do servidor.', content: errorContent };
const forbidden = { description: 'Origem de escrita não permitida.', content: errorContent };
const bodyErrors = {
  400: invalid, 403: forbidden,
  413: { description: 'Corpo maior que 1 MiB.', content: errorContent },
  415: { description: 'Utilize Content-Type: application/json.', content: errorContent },
  500: unexpected,
};
const recipeBody = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecipeInput' } } } };
const recipeResponse = { description: 'Receita do usuário autenticado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Recipe' } } } };
const userResponse = { description: 'ID, nome e login do usuário.', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Receitas culinárias', version: '1.0.0',
    description: 'API de usuários, categorias e receitas. Cadastre-se e faça login nesta página; o navegador envia o cookie nas próximas chamadas. Login válido por 8 horas. Datas em UTC, com precisão de segundos.',
  },
  servers: [{ url: '/' }],
  security: [{ cookieAuth: [] }],
  tags: [{ name: 'Sistema' }, { name: 'Autenticação' }, { name: 'Categorias' }, { name: 'Receitas' }],
  paths: {
    '/health': {
      get: { tags: ['Sistema'], summary: 'Health check', security: [], responses: {
        200: { description: 'Aplicação disponível.', content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['ok'] } } } } } },
      } },
    },
    '/api/usuarios': {
      post: { tags: ['Autenticação'], summary: 'Cadastrar usuário', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserInput' } } } },
        responses: { 201: userResponse, ...bodyErrors, 409: { description: 'Login já cadastrado.', content: errorContent } },
      },
    },
    '/api/auth/login': {
      post: { tags: ['Autenticação'], summary: 'Entrar e definir cookie HttpOnly', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: {
          200: { ...userResponse, headers: { 'Set-Cookie': { description: 'Cookie receitas_token com JWT; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800; Secure quando configurado.', schema: { type: 'string' } } } },
          ...bodyErrors, 401: { description: 'Login ou senha inválidos.', content: errorContent },
        },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Autenticação'], summary: 'Limpar o cookie, mesmo sem sessão', security: [], responses: {
        204: { description: 'Cookie removido, sem corpo. O token permanece válido até expirar.', headers: { 'Set-Cookie': { schema: { type: 'string' }, description: 'Cookie com Max-Age=0 e Expires no passado.' } } },
        403: forbidden, 500: unexpected,
      } },
    },
    '/api/categorias': {
      get: { tags: ['Categorias'], summary: 'Listar categorias existentes por ID crescente', responses: {
        200: { description: 'Categorias cadastradas.', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } },
        401: unauthorized, 500: unexpected,
      } },
    },
    '/api/receitas': {
      get: { tags: ['Receitas'], summary: 'Listar ou pesquisar as próprias receitas',
        description: 'Lista por ID crescente, sem paginação. Retorna [] quando vazia.',
        parameters: [{ name: 'q', in: 'query', required: false, schema: { type: 'string' }, description: 'Trecho literal do nome. Ausente ou vazio retorna todas as receitas do usuário, inclusive sem nome. Maiúsculas e acentos seguem a comparação do banco.' }],
        responses: { 200: { description: 'Receitas do usuário.', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Recipe' } } } } }, 401: unauthorized, 500: unexpected },
      },
      post: { tags: ['Receitas'], summary: 'Criar receita do usuário autenticado',
        description: 'Proprietário autenticado; criado_em e alterado_em recebem o mesmo instante. Campos nullable omitidos viram null.',
        requestBody: recipeBody, responses: { 201: recipeResponse, ...bodyErrors, 401: unauthorized },
      },
    },
    '/api/receitas/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: id, description: 'ID decimal positivo, sem zeros à esquerda.' }],
      get: { tags: ['Receitas'], summary: 'Consultar receita do proprietário', responses: { 200: recipeResponse, 400: invalid, 401: unauthorized, 404: notFound, 500: unexpected } },
      put: { tags: ['Receitas'], summary: 'Substituir os campos editáveis da receita',
        description: 'Envie todos os campos editáveis: nullable omitido vira null. Não envie id, id_usuarios ou datas. criado_em é preservado; alterado_em é atualizado. PUT idêntico retorna 200.',
        requestBody: recipeBody, responses: { 200: recipeResponse, ...bodyErrors, 401: unauthorized, 404: notFound },
      },
      delete: { tags: ['Receitas'], summary: 'Excluir receita do proprietário', responses: { 204: { description: 'Receita excluída, sem corpo.' }, 400: invalid, 401: unauthorized, 403: forbidden, 404: notFound, 500: unexpected } },
    },
  },
  components: {
    securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: authCookieName, description: 'JWT em cookie HttpOnly, recebido no login e enviado automaticamente pelo navegador.' } },
    schemas: {
      Error: { type: 'object', required: ['message'], properties: {
        message: { type: 'string', example: 'Receita não encontrada.' },
        errors: { type: 'array', description: 'Campos com erro de validação.', items: { type: 'object', required: ['field', 'message'], properties: { field: { type: 'string' }, message: { type: 'string' } } } },
      } },
      LoginInput: { type: 'object', additionalProperties: false, required: ['login', 'senha'], properties: credentials },
      CreateUserInput: { type: 'object', additionalProperties: false, required: ['login', 'senha'], properties: { ...credentials, nome: { type: 'string', maxLength: 100, nullable: true } } },
      User: { type: 'object', required: ['id', 'nome', 'login'], properties: { id, nome: { type: 'string', maxLength: 100, nullable: true }, login: credentials.login } },
      Category: { type: 'object', required: ['id', 'nome'], properties: { id, nome: { type: 'string', maxLength: 100, nullable: true } } },
      RecipeInput: { type: 'object', additionalProperties: false, required: ['modo_preparo'], properties: recipeFields },
      Recipe: { type: 'object', required: ['id', 'id_usuarios', ...Object.keys(recipeFields), 'criado_em', 'alterado_em'], properties: {
        id, id_usuarios: id, ...recipeFields,
        criado_em: { type: 'string', format: 'date-time' }, alterado_em: { type: 'string', format: 'date-time' },
      } },
    },
  },
};
