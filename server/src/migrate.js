'use strict'
/* Migrações: aplica as .up.sql pendentes em ordem; `down` desfaz a última. */
const fs = require('node:fs'), path = require('node:path')
const DIR = path.join(__dirname, '..', 'migrations')

async function applied (db) {
  try { return new Set((await db.query('SELECT version FROM schema_migrations')).rows.map(r => r.version)) } catch (e) { return new Set() }
}
async function up (db) {
  const done = await applied(db), ran = []
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.up.sql')).sort()) {
    const v = f.replace('.up.sql', '')
    if (done.has(v)) continue
    await db.query(fs.readFileSync(path.join(DIR, f), 'utf8'))
    await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [v])
    ran.push(v)
  }
  return ran
}
async function down (db) {
  const done = [...(await applied(db))].sort()
  const v = done.pop(); if (!v) return null
  await db.query(fs.readFileSync(path.join(DIR, v + '.down.sql'), 'utf8'))
  try { await db.query('DELETE FROM schema_migrations WHERE version = $1', [v]) } catch (e) { /* a tabela pode ter sido apagada pela própria migração */ }
  return v
}
module.exports = { up, down }

if (require.main === module) {
  const { Pool } = require('pg')
  const db = new Pool({ connectionString: process.env.DATABASE_URL })
  const cmd = process.argv[2] || 'up'
  ;(cmd === 'down' ? down(db) : up(db)).then(r => { console.log(cmd, r); return db.end() }).catch(e => { console.error(e.message); process.exit(1) })
}
