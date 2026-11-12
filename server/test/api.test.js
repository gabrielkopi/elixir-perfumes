'use strict'
/* Testes da API com Postgres em memória (pg-mem) e HTTP de verdade. Cobrem regras de negócio e os testes de segurança da especificação. */
const test = require('node:test'), assert = require('node:assert/strict'), http = require('node:http')
const { newDb } = require('pg-mem')
const { createApp } = require('../src/app')
const migrate = require('../src/migrate')

let clock = new Date('2026-11-12T12:00:00Z')
async function boot () {
  const mem = newDb()
  const { Pool } = mem.adapters.createPg()
  const db = new Pool()
  await migrate.up(db)
  const server = http.createServer(createApp({ db, config: { origins: ['https://gabrielkopi.github.io'], now: () => clock, authMax: 50 } }))
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}`
  const call = async (method, path, { token, body, origin = 'https://gabrielkopi.github.io' } = {}) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const text = await r.text()
    return { status: r.status, body: text ? JSON.parse(text) : null }
  }
  return { db, server, call }
}
const state = extra => ({ version: 3, onboarded: true, profile: { name: 'Teste' }, ratings: { vetiver: 8 }, ...extra })

test('ELIXIR API', async t => {
  const { db, server, call } = await boot()
  t.after(() => server.close())

  await t.test('saúde e CORS', async () => {
    assert.equal((await call('GET', '/api/health')).body.ok, true)
    assert.equal((await call('GET', '/api/health', { origin: 'https://site-estranho.com' })).status, 403)
  })

  let ana, bia
  await t.test('cadastro, login, sessão e logout', async () => {
    const r = await call('POST', '/api/auth/register', { body: { email: 'Ana@Exemplo.com', password: 'senha-forte-1', name: 'Ana Souza' } })
    assert.equal(r.status, 201); assert.equal(r.body.user.email, 'ana@exemplo.com'); assert.match(r.body.user.handle, /^[a-z0-9._]{3,20}$/)
    ana = r.body.token
    assert.equal((await call('POST', '/api/auth/register', { body: { email: 'ana@exemplo.com', password: 'outra-senha', name: 'Ana' } })).status, 409)
    assert.equal((await call('POST', '/api/auth/register', { body: { email: 'x@y.co', password: 'curta', name: 'X' } })).body.error, 'password_short')
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'ana@exemplo.com', password: 'errada-123' } })).status, 401)
    const l = await call('POST', '/api/auth/login', { body: { email: 'ana@exemplo.com', password: 'senha-forte-1' } })
    assert.equal(l.status, 200)
    assert.equal((await call('GET', '/api/me', { token: l.body.token })).body.user.name, 'Ana Souza')
    assert.equal((await call('POST', '/api/auth/logout', { token: l.body.token })).status, 200)
    assert.equal((await call('GET', '/api/me', { token: l.body.token })).status, 401, 'token revogado não vale mais')
    assert.equal((await call('GET', '/api/me')).status, 401, 'sem token, sem acesso')
    bia = (await call('POST', '/api/auth/register', { body: { email: 'bia@exemplo.com', password: 'senha-forte-2', name: 'Bia' } })).body.token
  })

  await t.test('sincronização entre aparelhos com conflito', async () => {
    const a1 = await call('PUT', '/api/me/state', { token: ana, body: { state: state(), baseRevision: 0 } })
    assert.equal(a1.body.revision, 1)
    const a2 = await call('PUT', '/api/me/state', { token: ana, body: { state: state({ ratings: { vetiver: 10 } }), baseRevision: 1 } })
    assert.equal(a2.body.revision, 2)
    const stale = await call('PUT', '/api/me/state', { token: ana, body: { state: state({ ratings: {} }), baseRevision: 1 } })
    assert.equal(stale.status, 409); assert.equal(stale.body.revision, 2); assert.equal(stale.body.state.ratings.vetiver, 10)
    assert.equal((await call('GET', '/api/me/state', { token: ana })).body.state.ratings.vetiver, 10)
    assert.equal((await call('PUT', '/api/me/state', { token: ana, body: { state: { version: 2 }, baseRevision: 2 } })).status, 400)
  })

  await t.test('segurança: usuário X não lê nem edita os dados de Y', async () => {
    const b = await call('GET', '/api/me/state', { token: bia })
    assert.equal(b.body.state, null, 'Bia não vê o estado da Ana')
    await call('PUT', '/api/me/state', { token: bia, body: { state: state({ profile: { name: 'Bia' } }), baseRevision: 0 } })
    assert.equal((await call('GET', '/api/me/state', { token: ana })).body.state.profile.name, 'Teste', 'escrever com o token da Bia não toca a Ana')
  })

  // Lojas de teste: A (atendente Caio) e B (atendente Duda)
  const caio = (await call('POST', '/api/auth/register', { body: { email: 'caio@lojaa.com', password: 'senha-forte-3', name: 'Caio' } })).body
  const duda = (await call('POST', '/api/auth/register', { body: { email: 'duda@lojab.com', password: 'senha-forte-4', name: 'Duda' } })).body
  await db.query("INSERT INTO stores (id, name) VALUES ('loja-a', 'Loja A'), ('loja-b', 'Loja B')")
  await db.query('INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, $3), ($4, $5, $6)', ['loja-a', caio.user.id, 'staff', 'loja-b', duda.user.id, 'staff'])
  await db.query("INSERT INTO store_products (store_id, perfume_id, in_stock) VALUES ('loja-a', 'vetiver', TRUE), ('loja-a', 'polo', FALSE), ('loja-b', 'arbo', TRUE)")

  await t.test('Connect: fluxo completo com consentimento e escopo', async () => {
    const s = await call('POST', '/api/connect/sessions', { token: ana, body: { scopes: { map: true, ratings: false }, minutes: 30, payload: { map: { primary: 'Amadeirado' }, ratings: { vetiver: 10 } } } })
    assert.equal(s.status, 201)
    const c = await call('POST', '/api/stores/loja-a/connect/claim', { token: caio.token, body: { code: s.body.code } })
    assert.equal(c.status, 200)
    assert.equal((await call('GET', `/api/stores/loja-a/connect/${s.body.id}`, { token: caio.token })).body.error, 'no_consent', 'sem consentimento, nada')
    assert.equal((await call('POST', `/api/connect/sessions/${s.body.id}/consent`, { token: bia })).status, 404, 'só o dono consente')
    assert.equal((await call('POST', `/api/connect/sessions/${s.body.id}/consent`, { token: ana })).body.status, 'active')
    const r = await call('GET', `/api/stores/loja-a/connect/${s.body.id}`, { token: caio.token })
    assert.equal(r.status, 200)
    assert.deepEqual(Object.keys(r.body.payload), ['map'], 'avaliações fora do escopo não são enviadas')
    assert.deepEqual(r.body.stock.map(x => x.id), ['vetiver'], 'só estoque confirmado')
    assert.equal(r.body.sponsored, false)
    // segurança: loja B não acessa a sessão da loja A
    assert.equal((await call('GET', `/api/stores/loja-b/connect/${s.body.id}`, { token: duda.token })).status, 404)
    assert.equal((await call('GET', `/api/stores/loja-a/connect/${s.body.id}`, { token: duda.token })).status, 403, 'atendente da B fingindo ser da A')
    assert.equal((await call('POST', '/api/stores/loja-b/connect/claim', { token: duda.token, body: { code: s.body.code } })).status, 409, 'código já usado')
    // revogar bloqueia na hora e apaga o resumo
    await call('DELETE', `/api/connect/sessions/${s.body.id}`, { token: ana })
    assert.equal((await call('GET', `/api/stores/loja-a/connect/${s.body.id}`, { token: caio.token })).status, 410)
    const row = (await db.query('SELECT payload, status FROM connect_sessions WHERE id = $1', [s.body.id])).rows[0]
    assert.equal(row.status, 'revoked'); assert.equal(row.payload, null)
    const audit = (await db.query('SELECT action FROM connect_audit WHERE session_id = $1', [s.body.id])).rows.map(x => x.action)
    assert.deepEqual(audit, ['created', 'claimed', 'consented', 'read', 'revoked'])
  })

  await t.test('Connect: QR expirado não retorna perfil', async () => {
    const s = await call('POST', '/api/connect/sessions', { token: ana, body: { scopes: { map: true }, minutes: 10, payload: { map: { primary: 'Verde' } } } })
    clock = new Date(clock.getTime() + 11 * 60_000)
    assert.equal((await call('POST', '/api/stores/loja-a/connect/claim', { token: caio.token, body: { code: s.body.code } })).status, 410)
    const row = (await db.query('SELECT payload, status FROM connect_sessions WHERE id = $1', [s.body.id])).rows[0]
    assert.equal(row.status, 'expired'); assert.equal(row.payload, null, 'expirou, o resumo some')
    assert.equal((await call('POST', '/api/stores/loja-a/connect/claim', { token: bia, body: { code: 'qualquer' } })).status, 403, 'quem não é da loja não lê códigos')
  })

  await t.test('LGPD: exportar e apagar a conta', async () => {
    const ex = await call('GET', '/api/me/export', { token: ana })
    assert.equal(ex.body.user.email, 'ana@exemplo.com'); assert.ok(ex.body.state); assert.ok(ex.body.connectSessions.length >= 2)
    assert.equal((await call('DELETE', '/api/me', { token: ana })).body.deleted, true)
    assert.equal((await call('GET', '/api/me', { token: ana })).status, 401)
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'ana@exemplo.com', password: 'senha-forte-1' } })).status, 401)
    assert.equal((await db.query("SELECT count(*)::int AS n FROM app_state WHERE user_id NOT IN (SELECT id FROM users)")).rows[0].n, 0, 'sem dados órfãos')
  })

  await t.test('limite de tentativas de login', async () => {
    const { server: s2, call: c2 } = await (async () => {
      const mem = newDb(); const { Pool } = mem.adapters.createPg(); const d = new Pool(); await migrate.up(d)
      const sv = http.createServer(createApp({ db: d, config: { origins: ['https://gabrielkopi.github.io'], authMax: 3 } }))
      await new Promise(r => sv.listen(0, '127.0.0.1', r)); const b = `http://127.0.0.1:${sv.address().port}`
      return { server: sv, call: async (p, body) => (await fetch(b + p, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://gabrielkopi.github.io' }, body: JSON.stringify(body) })).status }
    })()
    const codes = []
    for (let i = 0; i < 5; i++) codes.push(await c2('/api/auth/login', { email: 'ninguem@x.com', password: 'xxxxxxxx' }))
    s2.close()
    assert.deepEqual(codes.slice(0, 3), [401, 401, 401]); assert.equal(codes[4], 429)
  })

  await t.test('migração é reversível', async () => {
    const mem = newDb(); const { Pool } = mem.adapters.createPg(); const d = new Pool()
    assert.deepEqual(await migrate.up(d), ['001_init'])
    assert.equal(await migrate.down(d), '001_init')
    await assert.rejects(d.query('SELECT 1 FROM users'), 'o down apaga as tabelas')
    await assert.rejects(d.query('SELECT 1 FROM connect_sessions'))
    // Reaplicar no mesmo banco: o pg-mem guarda nomes de índices de tabelas apagadas (limitação dele, não do Postgres).
    // A reaplicação é conferida no Postgres real pelo roteiro de deploy (deploy/README.md, "Verificar a migração").
  })
})
