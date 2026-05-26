import { test, expect } from '@playwright/test';

test('Simular usuário comprando no cardápio', async ({ page }) => {
  // 1. O robô entra no seu cardápio local
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 2. A IA procura botões de adicionar ao carrinho e clica no primeiro que achar
  const botaoAdicionar = page.locator('button:has-text("Adicionar"), button:has-text("🛒"), [class*="btn-add"]').first();
  await expect(botaoAdicionar).toBeVisible();
  await botaoAdicionar.click();
  console.log('🤖 Usuário IA: Adicionou um produto ao carrinho.');

  // 3. O robô vai até o carrinho ou botão de finalizar
  const botaoCarrinho = page.locator('button:has-text("Carrinho"), button:has-text("Ver pedido")');
  if (await botaoCarrinho.isVisible()) {
    await botaoCarrinho.click();
  }

  // 4. O robô finaliza a compra
  const botaoFinalizar = page.locator('button:has-text("Finalizar"), button:has-text("Confirmar"), button:has-text("Enviar")');
  await expect(botaoFinalizar).toBeVisible();
  await botaoFinalizar.click();
  console.log('🤖 Usuário IA: Finalizou a compra com sucesso!');

  // Espera 3 segundos para garantir que o Supabase recebeu o INSERT
  await page.waitForTimeout(3000);
});
