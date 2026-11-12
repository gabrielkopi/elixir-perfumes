'use strict'
/* ELIXIR · API híbrida. createApp({db, config}) devolve o handler HTTP.
   db: qualquer objeto com query(text, params) no formato do `pg` (Pool real ou pg-mem nos testes).
   Regras de acesso no servidor: toda rota /me usa só o usuário do token; lojas só veem sessões do Connect
   que reivindicaram, com consentimento do cliente, dentro da validade e não revogadas. */
const { err, HttpError, sha256, id, token, hashPassword, checkPassword, readJson, send, cors, limiter, clean } = require('./util')

const EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,}$/i
const HANDLE = /^[a-z0-9._]{3,20}$/
const SCOPES = ['map', 'have', 'avoid', 'ratings', 'budget']

function createApp ({ db, config = {} }) {
  const C = {
    origins: config.origins || ['https://gabrielkopi.github.io', 'http://localhost:5178', 'http://127.0.0.1:5178'],
    sessionDays: config.sessionDays || 30,
    stateLimit: config.stateLimit || 512 * 1024,
    connectMaxMinutes: 120,
    now: config.now || (() => new Date())
  }
  const authLimit = limiter({ max: config.authMax || 10, windowMs: 60_000 })
  const q = async (text, params = []) => (await db.query(text, params)).rows
  const one = async (text, params) => (await q(text, params))[0] || null
  const iso = d => new Date(d).toISOString()

  async function user (req) {
    const h = req.headers.authorization || ''
    const t = h.startsWith('Bearer ') ? h.slice(7).trim() : ''
    if (!t) throw err(401, 'auth_required', 'Entre na sua conta.')
    const s = await one('SELECT s.id, s.user_id, s.expires_at, s.revoked_at, u.email, u.name, u.handle FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1', [sha256(t)])
    if (!s || s.revoked_at || new Date(s.expires_at) <= C.now()) throw err(401, 'session_invalid', 'Sessão expirada. Entre de novo.')
    return { id: s.user_id, sessionId: s.id, email: s.email, name: s.name, handle: s.handle }
  }
  async function newSession (userId) {
    const t = token(); const exp = new Date(C.now().getTime() + C.sessionDays * 864e5)
    await q('INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)', [id(), userId, sha256(t), iso(exp)])
    return { token: t, expiresAt: iso(exp) }
  }
  const audit = (sessionId, storeId, actorId, action) =>
    q('INSERT INTO connect_audit (id, session_id, store_id, actor_id, action) VALUES ($1, $2, $3, $4, $5)', [id(), sessionId, storeId, actorId, action])
  async function connectOf (sid) {
    const s = await one('SELECT * FROM connect_sessions WHERE id = $1', [sid])
    if (!s) return null
    if (['pending', 'claimed', 'active'].includes(s.status) && new Date(s.expires_at) <= C.now()) {
      await q("UPDATE connect_sessions SET status = 'expired', payload = NULL WHERE id = $1", [sid])
      s.status = 'expired'; s.payload = null
    }
    return s
  }
  async function member (storeId, userId) {
    return one('SELECT role FROM store_members WHERE store_id = $1 AND user_id = $2', [storeId, userId])
  }

  /* ---------- rotas ---------- */
  const routes = [
    ['GET', /^\/api\/health$/, async () => ({ ok: true, version: 1 })],

    ['POST', /^\/api\/auth\/register$/, async (req, body, ip) => {
      const email = clean(body.email, 254).toLowerCase(), name = clean(body.name, 32), handle = clean(body.handle || '', 20).toLowerCase()
      if (!authLimit('reg:' + ip)) throw err(429, 'rate_limited', 'Muitas tentativas. Espere um minuto.')
      if (!EMAIL.test(email)) throw err(400, 'email_invalid', 'E-mail inválido.')
      if (String(body.password || '').length < 8) throw err(400, 'password_short', 'A senha precisa de pelo menos 8 caracteres.')
      if (name.length < 2) throw err(400, 'name_invalid', 'Escreva um nome com pelo menos 2 letras.')
      const h = handle || (name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 16) || 'perfil')
      if (!HANDLE.test(h)) throw err(400, 'handle_invalid', 'Use de 3 a 20 letras, números, ponto ou _.')
      if (await one('SELECT 1 AS x FROM users WHERE email = $1', [email])) throw err(409, 'email_taken', 'Este e-mail já tem conta.')
      let final = h, n = 2
      while (await one('SELECT 1 AS x FROM users WHERE handle = $1', [final])) final = (h.slice(0, 17) + n++)
      const uid = id()
      await q('INSERT INTO users (id, email, password_hash, name, handle) VALUES ($1, $2, $3, $4, $5)', [uid, email, hashPassword(body.password), name, final])
      return { status: 201, body: { user: { id: uid, email, name, handle: final }, ...(await newSession(uid)) } }
    }],

    ['POST', /^\/api\/auth\/login$/, async (req, body, ip) => {
      const email = clean(body.email, 254).toLowerCase()
      if (!authLimit('login:' + ip) || !authLimit('login:' + email)) throw err(429, 'rate_limited', 'Muitas tentativas. Espere um minuto.')
      const u = await one('SELECT id, email, name, handle, password_hash FROM users WHERE email = $1', [email])
      if (!u || !checkPassword(body.password, u.password_hash)) throw err(401, 'login_failed', 'E-mail ou senha incorretos.')
      return { user: { id: u.id, email: u.email, name: u.name, handle: u.handle }, ...(await newSession(u.id)) }
    }],

    ['POST', /^\/api\/auth\/logout$/, async req => {
      const u = await user(req)
      await q('UPDATE sessions SET revoked_at = $1 WHERE id = $2', [iso(C.now()), u.sessionId])
      return { ok: true }
    }],

    ['GET', /^\/api\/me$/, async req => {
      const u = await user(req)
      const st = await one('SELECT revision, updated_at FROM app_state WHERE user_id = $1', [u.id])
      return { user: { id: u.id, email: u.email, name: u.name, handle: u.handle }, state: st ? { revision: st.revision, updatedAt: iso(st.updated_at) } : null }
    }],

    /* Estado sincronizado: o cliente manda a revisão em que se baseou; se outro aparelho salvou antes, 409 com a versão do servidor. */
    ['GET', /^\/api\/me\/state$/, async req => {
      const u = await user(req)
      const st = await one('SELECT state, revision, updated_at FROM app_state WHERE user_id = $1', [u.id])
      return st ? { state: st.state, revision: st.revision, updatedAt: iso(st.updated_at) } : { state: null, revision: 0 }
    }],
    ['PUT', /^\/api\/me\/state$/, async (req, body) => {
      const u = await user(req)
      if (!body.state || typeof body.state !== 'object' || Array.isArray(body.state)) throw err(400, 'state_invalid', 'Estado inválido.')
      if (body.state.version !== 3) throw err(400, 'state_version', 'Versão do estado não suportada.')
      const base = Number(body.baseRevision) || 0
      const cur = await one('SELECT revision, state, updated_at FROM app_state WHERE user_id = $1', [u.id])
      if (cur && cur.revision !== base) return { status: 409, body: { error: 'conflict', message: 'Outro aparelho salvou antes.', state: cur.state, revision: cur.revision, updatedAt: iso(cur.updated_at) } }
      const now = iso(C.now())
      if (cur) await q('UPDATE app_state SET state = $1, revision = revision + 1, updated_at = $2 WHERE user_id = $3', [JSON.stringify(body.state), now, u.id])
      else await q('INSERT INTO app_state (user_id, state, revision, updated_at) VALUES ($1, $2, 1, $3)', [u.id, JSON.stringify(body.state), now])
      return { revision: (cur ? cur.revision : 0) + 1, updatedAt: now }
    }],

    /* LGPD: exportar e apagar */
    ['GET', /^\/api\/me\/export$/, async req => {
      const u = await user(req)
      const st = await one('SELECT state, revision, updated_at FROM app_state WHERE user_id = $1', [u.id])
      const cs = await q('SELECT id, scopes, store_id, status, created_at, expires_at, consented_at, revoked_at FROM connect_sessions WHERE user_id = $1', [u.id])
      return { exportedAt: iso(C.now()), user: { id: u.id, email: u.email, name: u.name, handle: u.handle }, state: st ? st.state : null, connectSessions: cs }
    }],
    ['DELETE', /^\/api\/me$/, async req => {
      const u = await user(req)
      const sids = (await q('SELECT id FROM connect_sessions WHERE user_id = $1', [u.id])).map(r => r.id)
      for (const s of sids) await q('UPDATE connect_audit SET actor_id = NULL WHERE session_id = $1 AND actor_id = $2', [s, u.id])
      await q('DELETE FROM users WHERE id = $1', [u.id])
      return { ok: true, deleted: true }
    }],

    /* ---------- ELIXIR Connect ---------- */
    ['POST', /^\/api\/connect\/sessions$/, async (req, body) => {
      const u = await user(req)
      const scopes = SCOPES.filter(s => body.scopes && body.scopes[s] === true)
      if (!scopes.length) throw err(400, 'scopes_empty', 'Escolha o que compartilhar.')
      const minutes = Math.max(5, Math.min(C.connectMaxMinutes, Number(body.minutes) || 30))
      const payload = body.payload && typeof body.payload === 'object' ? Object.fromEntries(Object.entries(body.payload).filter(([k]) => scopes.includes(k))) : {}
      if (JSON.stringify(payload).length > 64 * 1024) throw err(413, 'too_large', 'Resumo grande demais.')
      const code = token(18), sid = id(), exp = new Date(C.now().getTime() + minutes * 60_000)
      await q("INSERT INTO connect_sessions (id, user_id, code_hash, scopes, payload, status, expires_at) VALUES ($1, $2, $3, $4, $5, 'pending', $6)",
        [sid, u.id, sha256(code), JSON.stringify(scopes), JSON.stringify(payload), iso(exp)])
      await audit(sid, null, u.id, 'created')
      return { status: 201, body: { id: sid, code, scopes, expiresAt: iso(exp) } }
    }],
    /* Cliente confirma o compartilhamento com a loja que escaneou. */
    ['POST', /^\/api\/connect\/sessions\/([\w-]+)\/consent$/, async (req, body, ip, m) => {
      const u = await user(req); const s = await connectOf(m[1])
      if (!s || s.user_id !== u.id) throw err(404, 'not_found', 'Sessão não encontrada.')
      if (s.status !== 'claimed') throw err(409, 'not_claimed', s.status === 'pending' ? 'Nenhuma loja leu este código ainda.' : 'Sessão encerrada.')
      await q("UPDATE connect_sessions SET status = 'active', consented_at = $1 WHERE id = $2", [iso(C.now()), s.id])
      await audit(s.id, s.store_id, u.id, 'consented')
      return { ok: true, status: 'active', storeId: s.store_id }
    }],
    ['GET', /^\/api\/connect\/sessions\/([\w-]+)$/, async (req, body, ip, m) => {
      const u = await user(req); const s = await connectOf(m[1])
      if (!s || s.user_id !== u.id) throw err(404, 'not_found', 'Sessão não encontrada.')
      const store = s.store_id ? await one('SELECT id, name FROM stores WHERE id = $1', [s.store_id]) : null
      return { id: s.id, status: s.status, scopes: s.scopes, expiresAt: iso(s.expires_at), store }
    }],
    ['DELETE', /^\/api\/connect\/sessions\/([\w-]+)$/, async (req, body, ip, m) => {
      const u = await user(req); const s = await connectOf(m[1])
      if (!s || s.user_id !== u.id) throw err(404, 'not_found', 'Sessão não encontrada.')
      if (['pending', 'claimed', 'active'].includes(s.status)) {
        await q("UPDATE connect_sessions SET status = 'revoked', payload = NULL, revoked_at = $1 WHERE id = $2", [iso(C.now()), s.id])
        await audit(s.id, s.store_id, u.id, 'revoked')
      }
      return { ok: true, status: s.status === 'expired' ? 'expired' : 'revoked' }
    }],
    /* Loja: o atendente (membro da loja) lê o código do QR e pede acesso. */
    ['POST', /^\/api\/stores\/([\w-]+)\/connect\/claim$/, async (req, body, ip, m) => {
      const u = await user(req); const storeId = m[1]
      if (!(await member(storeId, u.id))) throw err(403, 'not_member', 'Você não atende nesta loja.')
      const s = await one('SELECT id FROM connect_sessions WHERE code_hash = $1', [sha256(clean(body.code, 64))])
      const cs = s && await connectOf(s.id)
      if (!cs || cs.status === 'expired' || cs.status === 'revoked') throw err(410, 'gone', 'Código expirado ou encerrado.')
      if (cs.status !== 'pending' || (cs.store_id && cs.store_id !== storeId)) throw err(409, 'already_claimed', 'Este código já foi usado.')
      await q("UPDATE connect_sessions SET status = 'claimed', store_id = $1 WHERE id = $2", [storeId, cs.id])
      await audit(cs.id, storeId, u.id, 'claimed')
      return { id: cs.id, status: 'claimed', scopes: cs.scopes, expiresAt: iso(cs.expires_at) }
    }],
    /* Loja: resumo autorizado + estoque verificado. Bloqueado sem consentimento, fora da validade, revogado ou de outra loja. */
    ['GET', /^\/api\/stores\/([\w-]+)\/connect\/([\w-]+)$/, async (req, body, ip, m) => {
      const u = await user(req); const storeId = m[1]
      if (!(await member(storeId, u.id))) throw err(403, 'not_member', 'Você não atende nesta loja.')
      const s = await connectOf(m[2])
      if (!s || s.store_id !== storeId) throw err(404, 'not_found', 'Sessão não encontrada nesta loja.')
      if (s.status === 'expired' || s.status === 'revoked') throw err(410, 'gone', 'Acesso encerrado.')
      if (s.status !== 'active') throw err(403, 'no_consent', 'Aguardando a confirmação do cliente.')
      await audit(s.id, storeId, u.id, 'read')
      const stock = (await q('SELECT perfume_id, verified_at FROM store_products WHERE store_id = $1 AND in_stock = TRUE', [storeId])).map(r => ({ id: r.perfume_id, verifiedAt: iso(r.verified_at) }))
      return { id: s.id, scopes: s.scopes, payload: s.payload, expiresAt: iso(s.expires_at), stock, sponsored: false }
    }]
  ]

  return async function handler (req, res) {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'local'
    const allowed = cors(req, res, C.origins)
    if (req.method === 'OPTIONS') return send(res, allowed ? 204 : 403, undefined)
    if (!allowed) return send(res, 403, { error: 'origin_forbidden', message: 'Origem não permitida.' })
    const url = new URL(req.url, 'http://x')
    try {
      for (const [method, re, fn] of routes) {
        const m = url.pathname.match(re)
        if (!m || method !== req.method) continue
        const body = ['POST', 'PUT'].includes(method) ? await readJson(req, method === 'PUT' ? C.stateLimit : 96 * 1024) : {}
        const out = await fn(req, body, ip, m)
        if (out && out.status && out.body) return send(res, out.status, out.body)
        return send(res, 200, out)
      }
      return send(res, 404, { error: 'not_found', message: 'Rota não encontrada.' })
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.code, message: e.message })
      console.error(JSON.stringify({ level: 'error', at: new Date().toISOString(), path: url.pathname, message: e.message }))
      return send(res, 500, { error: 'internal', message: 'Erro interno.' })
    }
  }
}

module.exports = { createApp }
