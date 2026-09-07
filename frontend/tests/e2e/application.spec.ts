import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const web = () => process.env.WEB_TEST_URL!;
const backend = () => process.env.API_TEST_URL!;

async function registerAndLogin(page: Page, login = `web-${randomUUID()}`) {
  await page.goto(`${web()}/cadastro`);
  await page.getByLabel('Nome', { exact: false }).fill('Pessoa do teste');
  await page.getByLabel('Login', { exact: true }).fill(login);
  await page.getByLabel('Senha', { exact: true }).fill('senha do navegador');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(`${web()}/login?cadastro=ok`);
  await expect(page.getByRole('status')).toContainText('Conta criada');
  await page.getByLabel('Login', { exact: true }).fill(login);
  await page.getByLabel('Senha', { exact: true }).fill('senha do navegador');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(`${web()}/receitas`);
  await expect(page.getByText('Seu caderno ainda está em branco.', { exact: false })).toBeVisible();
}

test('jornada completa: cadastro, login, CRUD, impressão e logout', async ({ page }) => {
  await page.goto(web());
  await expect(page).toHaveURL(`${web()}/login`);
  await registerAndLogin(page);

  await page.getByRole('link', { name: '+ Nova receita' }).click();
  await expect(page.getByLabel('Categoria')).toContainText('Alimentação Saudável');
  await expect(page.getByLabel('Categoria').locator('option')).toHaveCount(14);
  await page.getByLabel('Nome da receita').fill('Bolo de laranja');
  await page.getByLabel('Categoria').selectOption('1');
  await page.getByLabel('Tempo de preparo').fill('30');
  await page.getByLabel('Porções').fill('8');
  await page.getByLabel('Ingredientes').fill('2 laranjas\n2 xícaras de farinha');
  await page.getByLabel('Modo de preparo').fill('Misture os ingredientes.\nAsse por 30 minutos.');
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await expect(page.getByRole('heading', { name: 'Bolo de laranja' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bolo de laranja' })).toBeVisible();

  await page.getByRole('link', { name: '← Minhas receitas' }).click();
  await expect(page.getByRole('heading', { name: 'Bolo de laranja' })).toBeVisible();
  await page.getByLabel('Encontre uma receita pelo nome').fill('laranja');
  await page.getByRole('button', { name: 'Pesquisar', exact: true }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Ver receita' }).click();
  await page.getByRole('link', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Ingredientes')).toHaveValue('2 laranjas\n2 xícaras de farinha');
  await expect(page.getByLabel('Porções')).toHaveValue('8');
  await page.getByLabel('Nome da receita').fill('Bolo de laranja da casa');
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await expect(page.getByRole('heading', { name: 'Bolo de laranja da casa' })).toBeVisible();
  await expect(page.getByText('2 laranjas\n2 xícaras de farinha', { exact: true })).toBeVisible();
  await expect(page.getByText('8 porções', { exact: true })).toBeVisible();
  await page.evaluate(() => window.addEventListener('beforeprint', () => { document.documentElement.dataset.printStarted = 'true'; }, { once: true }));
  await page.getByRole('button', { name: 'Imprimir receita' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-print-started', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('navigation')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Imprimir receita' })).toBeHidden();
  await expect(page.locator('footer')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Modo de preparo' })).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.getByText('Receita excluída.', { exact: true })).toBeVisible();
  await expect(page.getByText('Seu caderno ainda está em branco.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(`${web()}/login`);
  await page.goto(`${web()}/receitas/nova`);
  await expect(page).toHaveURL(`${web()}/login`);
});

test('usuário B não vê nem abre a receita do usuário A', async ({ page, browser }) => {
  await registerAndLogin(page);
  await page.getByRole('link', { name: '+ Nova receita' }).click();
  await page.getByLabel('Nome da receita').fill('Receita privada de A');
  await page.getByLabel('Modo de preparo').fill('Misture.');
  await page.getByRole('button', { name: 'Salvar receita' }).click();
  await expect(page.getByRole('heading', { name: 'Receita privada de A' })).toBeVisible();
  const recipeUrl = page.url();

  const contextB = await browser.newContext();
  try {
    const second = await contextB.newPage();
    await registerAndLogin(second);
    await expect(second.locator('.recipe-card')).toHaveCount(0);
    await second.getByLabel('Encontre uma receita pelo nome').fill('Receita privada de A');
    await second.getByRole('button', { name: 'Pesquisar', exact: true }).click();
    await expect(second.getByText('Nenhuma receita encontrada.', { exact: false })).toBeVisible();
    await second.goto(recipeUrl);
    await expect(second.getByRole('alert')).toContainText('Receita não encontrada.');
  } finally { await contextB.close(); }
});

test('Swagger carrega localmente e permite login e consulta com cookie do navegador', async ({ page }) => {
  const login = `swagger-${randomUUID()}`;
  await page.goto(`${web()}/cadastro`);
  await page.getByLabel('Login', { exact: true }).fill(login);
  await page.getByLabel('Senha', { exact: true }).fill('senha swagger');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(`${web()}/login?cadastro=ok`);
  await page.goto(`${backend()}/api/docs`);
  await expect(page.getByRole('heading', { name: 'Receitas culinárias' })).toBeVisible();
  const operation = page.locator('.opblock').filter({ has: page.locator('[data-path="/api/auth/login"]') });
  await operation.locator('.opblock-summary').click();
  await operation.getByRole('button', { name: 'Try it out' }).click();
  await operation.locator('textarea').fill(JSON.stringify({ login, senha: 'senha swagger' }));
  const response = page.waitForResponse((r) => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST');
  await operation.getByRole('button', { name: 'Execute', exact: true }).click();
  expect((await response).status()).toBe(200);
  const categories = page.locator('.opblock').filter({ has: page.locator('[data-path="/api/categorias"]') });
  await categories.locator('.opblock-summary').click();
  await categories.getByRole('button', { name: 'Try it out' }).click();
  const listed = page.waitForResponse((r) => r.url().endsWith('/api/categorias'));
  await categories.getByRole('button', { name: 'Execute', exact: true }).click();
  expect((await listed).status()).toBe(200);
  await expect(categories.locator('.responses-wrapper')).toContainText('Alimentação Saudável');
  await expect(page.locator('.errors-wrapper')).toHaveCount(0);
});
