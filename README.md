# Receitas Culinárias

Aplicação desenvolvida para o desafio, com cadastro e login de usuários,
pesquisa, criação, edição, exclusão e impressão das próprias receitas.

## Tecnologias

Node.js 24, TypeScript, Vue 3, Vite, Vue Router, MySQL 8.4 e Docker.
mysql2, Zod, bcrypt, jose, OpenAPI/Swagger, Vitest e Playwright.

## Como executar

Com Docker e Docker Compose disponíveis, execute na raiz:

```bash
docker compose up --build
```

- Frontend: http://localhost:5174
- API: http://localhost:3000 (health check em `/health`)
- Swagger: http://localhost:3000/api/docs

O MySQL executa [banco/script.sql](banco/script.sql) na primeira inicialização
do volume; os dados são mantidos nas próximas execuções.

Abra o frontend, cadastre uma conta e faça login. Para testar no Swagger,
use essa mesma conta em `POST /api/auth/login`; o navegador envia o cookie
nas chamadas seguintes, sem precisar copiar o token.

O Compose usa credenciais locais de exemplo. As configurações estão em
`compose.yaml` e nos arquivos `.env.example` do backend e frontend.
Use `localhost` nas duas URLs para manter o envio do cookie.

## Testes

Requisitos: Node 24, npm e Docker com Compose.

Unitários dos services e E2E da API com HTTP e MySQL:

```bash
cd backend
npm ci
npm run build
npm run typecheck
npm test
npm run test:e2e
cd ..
```

Testes de navegador com Playwright:

```bash
cd frontend
npm ci
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
cd ..
```

No Linux, se faltarem bibliotecas do Chromium, use
`npx playwright install --with-deps chromium` (pode exigir privilégios de sistema).
Os E2E criam bancos descartáveis em portas temporárias e os removem ao terminar,
sem usar o banco de desenvolvimento.

## Estrutura

O backend usa `node:http` e um router que resolve método, caminho e parâmetros.
As requisições seguem controller → service → repository. Os repositories executam
SQL parametrizado com `mysql2/promise`.

No frontend, as páginas ficam em `views` e as chamadas HTTP em `services/api.ts`.
Cadastro e edição compartilham `RecipeForm.vue`, que envia todos os campos
editáveis porque o PUT converte campos nullable omitidos em `NULL`.

## Autenticação

As senhas são armazenadas com bcrypt. O login gera um JWT de oito horas em
cookie HttpOnly, enviado pelo navegador nas chamadas com `credentials: 'include'`.
O logoff limpa o cookie. Todas as operações de receitas são filtradas pelo
usuário autenticado.

## Banco

O schema `teste_receitas_rg_sistemas` mantém o modelo fornecido pelo desafio:

- `usuarios`: dados de cadastro e acesso.
- `categorias`: as 13 categorias iniciais, disponíveis somente para consulta.
- `receitas`: receitas vinculadas ao usuário e, opcionalmente, a uma categoria.

Não foram alteradas tabelas ou criadas migrations. O SQL, o DER e o PDF originais
estão em `banco/`.

## Impressão

A visualização da receita utiliza `window.print()` e estilos específicos para impressão.
