import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import worker from '../api/src/index';
import { addRelativePriceBands } from '../api/src/lib/pricing';

beforeEach(t => { t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ListaEESSPrecio: [] }))); });

test('API requires coordinates rather than accepting missing parameters as zero', async () => {
  const response = await worker.fetch(new Request('https://test/v1/stations?country=ES'));
  assert.equal(response.status, 400);
});

test('API rejects invalid coordinate ranges and nonnumeric radius without contacting source', async () => {
  for (const params of ['lat=91&lng=2', 'lat=42&lng=181', 'lat=&lng=', 'lat=42&lng=2&radiusKm=no']) {
    const response = await worker.fetch(new Request(`https://test/v1/stations?country=ES&${params}`));
    assert.equal(response.status, 400);
  }
});

test('API rejects POST instead of exposing a GET source fetch', async () => {
  const response = await worker.fetch(new Request('https://test/health', { method: 'POST' }));
  assert.equal(response.status, 405);
});

test('prototype property is not a supported country', async () => {
  const response = await worker.fetch(new Request('https://test/v1/stations?country=constructor&lat=1&lng=2'));
  assert.equal(response.status, 400);
});

test('equal prices receive a neutral relative band', () => {
  const stations = [1, 2].map(id => ({ id: String(id), prices: [{ fuel: 'diesel', price: 1.8, currency: 'EUR' }] }));
  assert.deepEqual(addRelativePriceBands(stations as never, 'diesel').map(s => s.priceBand), [3, 3]);
});
