'use strict'
/* Utilidades HTTP: JSON, erros, CORS por lista, limite de requisições, hash e ids. Sem dependências externas. */
const crypto = require('node:crypto')

class HttpError extends Error {
  constructor (status, code, message) { super(message || code); this.status = status; this.code = code }
}
const err = (status, code, message) => new HttpError(status, code, message)

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex')
const id = () => crypto.randomUUID()
const token = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url')

/* Senha: scrypt com sal aleatório. Formato: scrypt$N$sal$hash */
const N = 16384
function hashPassword (pw) {
  const salt = crypto.randomBytes(16).toString('base64url')
  const h = crypto.scryptSync(String(pw), salt, 32, { N }).toString('base64url')
  return `scrypt$${N}$${salt}$${h}`
}
function checkPassword (pw, stored) {
  const [alg, n, salt, h] = String(stored || '').split('$')
  if (alg !== 'scrypt' || !salt || !h) return false
  const got = crypto.scryptSync(String(pw), salt, 32, { N: Number(n) || N })
  const want = Buffer.from(h, 'base64url')
  return got.length === want.length && crypto.timingSafeEqual(got, want)
}

async function readJson (req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = []
    req.on('data', c => { size += c.length; if (size > limit) { reject(err(413, 'too_large', 'Corpo da requisição grande demais.')); req.destroy() } else chunks.push(c) })
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(v && typeof v === 'object' ? v : {}) } catch (e) { reject(err(400, 'bad_json', 'JSON inválido.')) }
    })
    req.on('error', reject)
  })
}

function send (res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers })
  res.end(data)
}

function cors (req, res, allowed) {
  const origin = req.headers.origin
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Max-Age', '600')
  }
  return !origin || allowed.includes(origin)
}

/* Limite simples em memória (por chave): suficiente para um único processo da API. */
function limiter ({ max, windowMs }) {
  const hits = new Map()
  return key => {
    const now = Date.now(); const h = (hits.get(key) || []).filter(t => now - t < windowMs)
    if (h.length >= max) { hits.set(key, h); return false }
    h.push(now); hits.set(key, h)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k)
    return true
  }
}

const clean = (s, max) => String(s ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max)

module.exports = { HttpError, err, sha256, id, token, hashPassword, checkPassword, readJson, send, cors, limiter, clean }
