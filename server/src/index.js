'use strict'
/* Sobe a API. Configuração só por variáveis de ambiente (ver .env.example); nenhum segredo no código. */
const http = require('node:http')
const { Pool } = require('pg')
const { createApp } = require('./app')
const migrate = require('./migrate')

const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 })
const origins = (process.env.CORS_ORIGINS || 'https://gabrielkopi.github.io').split(',').map(s => s.trim()).filter(Boolean)
const port = Number(process.env.PORT) || 8787

migrate.up(db).then(ran => {
  if (ran.length) console.log(JSON.stringify({ level: 'info', msg: 'migrations', ran }))
  const server = http.createServer(createApp({ db, config: { origins } }))
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(JSON.stringify({ level: 'info', msg: 'listening', port, origins })))
  const stop = () => server.close(() => db.end().then(() => process.exit(0)))
  process.on('SIGTERM', stop); process.on('SIGINT', stop)
}).catch(e => { console.error(JSON.stringify({ level: 'fatal', message: e.message })); process.exit(1) })
