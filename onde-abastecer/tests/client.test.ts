import assert from 'node:assert/strict';
import { test } from 'node:test';
const mod = await import('../mobile/src/api/client');
const query = { country: 'ES', fuel: 'diesel', latitude: 42, longitude: -8, radiusKm: 30 };
const station = { id: 'test', country: 'ES', name: 'Fixture', address: 'Test', latitude: 42, longitude: -8, source: 'Synthetic fixture', prices: [{ fuel: 'diesel', price: 1.7, currency: 'EUR', unit: 'L', updatedAt: '2026-11-07T10:00:00Z' }] };
const payload = { country: 'ES', fuel: 'diesel', stations: [station], retrievedAt: '2026-11-07T11:00:00Z' };
function memory() { const entries = new Map<string, string>(); return { async getItem(k: string) { return entries.get(k) ?? null; }, async setItem(k: string, v: string) { entries.set(k, v); } }; }

test('unconfigured client reports configuration error without generating stations', async () => {
  assert.equal(typeof mod.createStationClient, 'function');
  const client = mod.createStationClient({ baseUrl: '' });
  await assert.rejects(client(query), { code: 'api_not_configured' });
});
test('malformed and cross-country responses are rejected', async () => {
  assert.equal(typeof mod.createStationClient, 'function');
  for (const bad of [{ ...payload, stations: [{ ...station, latitude: 999 }] }, { ...payload, country: 'FR' }, { stations: [] }]) {
    const client = mod.createStationClient({ baseUrl: 'https://api.test', fetcher: async () => new Response(JSON.stringify(bad)) });
    await assert.rejects(client(query), { code: 'invalid_response' });
  }
});
test('offline fallback matches exact query and is explicitly labelled with original fetch time', async () => {
  assert.equal(typeof mod.createStationClient, 'function');
  const storage = memory(); let online = true;
  const client = mod.createStationClient({ baseUrl: 'https://api.test', storage, fetcher: async () => { if (!online) throw Error('offline'); return new Response(JSON.stringify(payload)); } });
  assert.equal((await client(query)).cache, 'network'); online = false;
  const cached = await client(query);
  assert.equal(cached.cache, 'offline');
  assert.equal(cached.retrievedAt, payload.retrievedAt);
  await assert.rejects(client({ ...query, fuel: 'lpg' }), { code: 'network_error' });
});
test('unsupported country never reuses an offline success', async () => {
  assert.equal(typeof mod.createStationClient, 'function');
  const storage = memory(); let status = 200;
  const client = mod.createStationClient({ baseUrl: 'https://api.test', storage, fetcher: async () => new Response(JSON.stringify(status === 200 ? payload : { error: 'country_not_live_yet' }), { status }) });
  await client(query); status = 501;
  await assert.rejects(client(query), { code: 'country_not_live_yet' });
});

test('invalid JSON cannot revive cached prices as a successful search', async () => {
  const storage = memory(); let valid = true;
  const client = mod.createStationClient({ baseUrl: 'https://api.test', storage, fetcher: async () => new Response(valid ? JSON.stringify(payload) : '<html>bad gateway</html>') });
  await client(query); valid = false;
  await assert.rejects(client(query), { code: 'invalid_response' });
});
