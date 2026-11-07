import { expect, test } from '@playwright/test';
// Synthetic test records exist only in this intercepted test response.
const prices = [1.8, 1.6];
const stations = prices.map((price, i) => ({ id: `fixture-${i}`, country: 'ES', name: `Fixture station ${i}`, brand: `Test brand ${i}`, address: 'Synthetic test address', latitude: 42.2406 + i * .01, longitude: -8.7207, prices: [{ fuel: 'gasoline95', price, currency: 'EUR', unit: 'L', updatedAt: new Date().toISOString(), timestampKind: 'price' }], source: 'Synthetic fixture only', priceBand: i ? 1 : 5 }));
test.beforeEach(async ({ page }) => {
  await page.route('**/v1/stations?**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('country') === 'IT') return route.fulfill({ status: 501, json: { error: 'country_not_live_yet' } });
    return route.fulfill({ json: { country: url.searchParams.get('country'), fuel: url.searchParams.get('fuel'), stations, retrievedAt: new Date().toISOString() } });
  });
});
test('map opens, list filters and favourites persist with a tested net calculation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Lista (2)', exact: true })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await page.getByRole('button', { name: 'Lista (2)', exact: true }).click();
  const reference = page.getByRole('button', { name: /Fixture station 0/ });
  await reference.click();
  await page.getByRole('button', { name: 'Salvar favorito', exact: true }).click();
  await page.getByRole('button', { name: 'Usar como referência de preço', exact: true }).click();
  await page.getByRole('button', { name: /Fixture station 1/ }).click();
  await page.getByLabel('Distância rodoviária adicional (km)', { exact: true }).fill('10');
  await expect(page.getByText(/Economia líquida estimada:.*6,920/)).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByLabel('Preço máximo por litro', { exact: true }).fill('1.7');
  await expect(page.getByRole('button', { name: 'Lista (1)', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Lista (2)', exact: true }).click();
  await page.getByRole('button', { name: /Fixture station 0/ }).click();
  await expect(page.getByRole('button', { name: 'Remover favorito', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('unsupported country displays coverage error and clears previous stations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Lista (2)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /IT · em preparação/ }).click();
  await expect(page.getByText('Este país ainda não tem integração habilitada.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lista (0)', exact: true })).toBeVisible();
});
