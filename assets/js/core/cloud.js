'use strict'
/* Conta na nuvem (API híbrida no servidor da Prakyer). Offline primeiro: o app funciona sem rede e sem servidor;
   com servidor configurado, a conta sincroniza o estado entre aparelhos. Nenhuma chave secreta no navegador:
   só o endereço da API e o token da sessão do próprio usuário. */
const Cloud = {
  /* Endereço da API: definido na publicação (meta name="elixir-api") ou, para testes, em localStorage. Vazio = desligado. */
  base () {
    let v = ''
    try { v = localStorage.getItem('elixir-api') || '' } catch (e) {}
    if (!v) { const m = typeof document !== 'undefined' && document.querySelector && document.querySelector('meta[name="elixir-api"]'); v = m ? m.content : '' }
    return /^https?:\/\/[^\s]+$/.test(v) ? v.replace(/\/$/, '') : ''
  },
  enabled () { return !!this.base() },
  key (acc) { return 'elixir-cloud-' + acc },
  session (acc = Accounts.active()) { try { const s = JSON.parse(localStorage.getItem(this.key(acc)) || 'null'); return s && s.token ? s : null } catch (e) { return null } },
  save (acc, s) { try { s ? localStorage.setItem(this.key(acc), JSON.stringify(s)) : localStorage.removeItem(this.key(acc)) } catch (e) {} },
  active () { return this.enabled() && !!this.session() },

  async api (method, path, body, token) {
    let r
    try {
      r = await fetch(this.base() + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined, credentials: 'omit', referrerPolicy: 'no-referrer' })
    } catch (e) { const x = new Error('Sem conexão com o servidor.'); x.code = 'offline'; throw x }
    const data = await r.json().catch(() => ({}))
    if (!r.ok && r.status !== 409) { const x = new Error(data.message || 'Não foi possível concluir.'); x.code = data.error || 'http_' + r.status; x.status = r.status; throw x }
    return { status: r.status, data }
  },

  /* Entrar ou criar conta: vira um perfil "nuvem" na tela de perfis e traz o estado salvo no servidor. */
  async auth (mode, { email, password, name }) {
    const { data } = await this.api('POST', mode === 'register' ? '/api/auth/register' : '/api/auth/login', { email, password, name })
    const accId = 'nuvem-' + String(data.user.id).replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase()
    const r = Accounts.read()
    if (!r.list.some(a => a.id === accId)) { r.list.push({ id: accId, name: data.user.name, handle: data.user.handle, vibe: '', preset: false, cloud: true, email: data.user.email, createdAt: Date.now(), lastAt: Date.now() }); Accounts.write(r) }
    this.save(accId, { token: data.token, userId: data.user.id, email: data.user.email, revision: 0 })
    Accounts.use(accId)
    const pulled = await this.pull()
    if (!pulled) { Store.update(s => { s.profile.name = data.user.name; s.profile.handle = String(data.user.handle).slice(0, 20) }, { silent: true }); await this.push() }
    return data.user
  },
  async logout () {
    const acc = Accounts.active(), s = this.session(acc); if (!s) return
    try { await this.api('POST', '/api/auth/logout', null, s.token) } catch (e) {}
    this.save(acc, null)
  },
  /* Traz o estado do servidor quando ele é mais novo que o deste aparelho. */
  async pull () {
    const acc = Accounts.active(), s = this.session(acc); if (!s) return false
    const { data } = await this.api('GET', '/api/me/state', null, s.token)
    if (!data.state || data.revision <= (s.revision || 0)) return false
    this.adopt(acc, data.state, data.revision)
    return true
  },
  adopt (acc, st, revision) {
    this.save(acc, { ...this.session(acc), revision })
    try { Store.ls().setItem(Accounts.keyFor(acc), JSON.stringify(st)) } catch (e) {}
    this.muted = true; Store.load(); this.muted = false
    if (typeof App !== 'undefined' && App.painted) App.render()
  },
  /* Envia o estado (com atraso curto para juntar várias mudanças). Conflito: fica a versão salva antes no outro aparelho. */
  schedule () { if (this.muted || !this.active()) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.push().catch(() => {}), 1800) },
  async push () {
    const acc = Accounts.active(), s = this.session(acc); if (!s) return
    const r = await this.api('PUT', '/api/me/state', { state, baseRevision: s.revision || 0 }, s.token)
    if (r.status === 409) { this.adopt(acc, r.data.state, r.data.revision); if (typeof toast === 'function') toast('Atualizamos com o que você salvou em outro aparelho.'); return }
    this.save(acc, { ...s, revision: r.data.revision }); this.last = Date.now()
  },
  async exportData () { const s = this.session(); if (!s) return null; return (await this.api('GET', '/api/me/export', null, s.token)).data },
  async deleteAccount () {
    const acc = Accounts.active(), s = this.session(acc); if (!s) return false
    await this.api('DELETE', '/api/me', null, s.token)
    this.save(acc, null); Accounts.remove(acc); return true
  }
}
