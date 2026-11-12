'use strict'
/* API local para testes de ponta a ponta: Postgres em memória (pg-mem). Uso: node test/dev-server.js <porta> <origem1,origem2> */
const http = require('node:http')
const { newDb } = require('pg-mem')
const { createApp } = require('../src/app')
const migrate = require('../src/migrate')
const port = Number(process.argv[2]) || 8787
const origins = String(process.argv[3] || 'http://127.0.0.1:5178').split(',')
const { Pool } = newDb().adapters.createPg()
const db = new Pool()
migrate.up(db).then(() => {
  http.createServer(createApp({ db, config: { origins, authMax: 200 } })).listen(port, '127.0.0.1', () => console.log('ELIXIR API (memória) em http://127.0.0.1:' + port))
})
