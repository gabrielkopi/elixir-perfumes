/* Testes obrigatórios de lógica (especificação ELIXIR, §6) sobre o motor real (OMap, Advisor, Engine) e o catálogo real.
   Sem DOM. Cada cenário usa perfumes do catálogo escolhidos pelas próprias características, nunca por nome fixo. */
const fs = require('fs'), path = require('path'), vm = require('vm')
const JS = f => fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', f), 'utf8')
const ctx = vm.createContext({ console, setTimeout, clearTimeout, Intl, URL, URLSearchParams,
  document: { documentElement: { dataset: { brand: 'elixir' } }, addEventListener () {} }, location: { search: '', hash: '' },
  localStorage: { getItem: () => null, setItem () {}, removeItem () {} } })
const FILES = ['data/brand.js', 'data/data.js', 'data/catalog-100.js', 'data/notes.js', 'data/catalog-br.js', 'data/image-credits.js', 'data/catalog-photos.js',
  'data/ingredients.js', 'data/brand-tiers.js', 'engine/engine.js', 'engine/taste-engine.js', 'engine/advisor.js', 'engine/olfactory-map.js']
vm.runInContext(FILES.map(JS).join('\n;\n') + '\n;var state={posts:[],ratings:{},following:[]};\n' + JS('data/community.js') +
  '\n;globalThis.__={OMap,Advisor,Engine,People,PEOPLE,PERFUMES,byId,MAP_AXES,OBSERVATIONS};', ctx)
const { OMap, Advisor, People, PEOPLE, PERFUMES } = ctx.__

let checks = 0, fails = 0
const check = (c, m) => { checks++; if (!c) { fails++; console.log('  FAIL ' + m) } else console.log('  ok   ' + m) }
const AX = Object.fromEntries(ctx.__.MAP_AXES.map((a, i) => [a.id, i]))
const ax = (p, id) => OMap.axesOf(p)[AX[id]]
const notes = p => (p.noteWeights || []).map(w => w.name.toLowerCase())
const has = (p, n) => notes(p).some(x => x.includes(n))
const st = (ratings = {}, extra = {}) => Object.assign({ ratings, ratedAt: {}, shelf: {}, shelfAt: {}, feedback: {}, bubble: { seen: {} }, map: { corrections: {}, priors: {} }, pinned: [] }, extra)
const byScore = (list, f) => [...list].sort((a, b) => f(b) - f(a) || (a.id < b.id ? -1 : 1))

/* ---------- 1. Vetiver seco amado, vetiver doce rejeitado ---------- */
console.log('1. Vetiver em contexto (seco × doce)')
const vet = PERFUMES.filter(p => p.vector && has(p, 'vetiver'))
const dryVet = byScore(vet, p => ax(p, 'seco') - ax(p, 'doce'))
const sweetVet = byScore(vet, p => ax(p, 'doce') - ax(p, 'seco'))
const A = dryVet[0], B = sweetVet[0]
check(A && B && A.id !== B.id && ax(A, 'doce') < ax(B, 'doce'), `casos reais: seco "${A && A.name}" × doce "${B && B.name}"`)
const m1 = OMap.build(st({ [A.id]: 10, [B.id]: 2 }))
const C = dryVet.find(p => p.id !== A.id && p.id !== B.id), D = sweetVet.find(p => p.id !== A.id && p.id !== B.id && p.id !== C.id)
const cC = OMap.chance(C, m1), cD = OMap.chance(D, m1)
check(cC > cD, `outro vetiver seco (${C.name}: ${cC}%) fica acima de outro vetiver doce (${D.name}: ${cD}%)`)
const doce = m1.axes.find(a => a.id === 'doce'), seco = m1.axes.find(a => a.id === 'seco')
check(doce.value < .5 && seco.value > .5, `o mapa aprende doce (${doce.value.toFixed(2)}) para baixo e seco (${seco.value.toFixed(2)}) para cima`)
const rejNotes = (m1.combos.rejected || []).map(r => (r.a + ' ' + r.b).toLowerCase())
check(!rejNotes.some(t => t === 'vetiver' || /^vetiver /.test(t) && /vetiver$/.test(t)), 'vetiver sozinho não vira nota rejeitada')
const exD = OMap.explain(D, m1)
check(!/vetiver/i.test(exD.caution || ''), 'o aviso do vetiver doce não culpa o vetiver' + (exD.caution ? ` ("${exD.caution}")` : ''))

/* ---------- 2. Compatibilidade varia por categoria ---------- */
console.log('2. Compatibilidade por categoria (cítricos × gourmands)')
const cit = byScore(PERFUMES.filter(p => p.vector), p => ax(p, 'citrico') - ax(p, 'gourmand')).slice(0, 5)
const gou = byScore(PERFUMES.filter(p => p.vector), p => ax(p, 'gourmand') - ax(p, 'citrico')).slice(0, 5)
const you = {}, them = {}
cit.forEach(p => { you[p.id] = 9; them[p.id] = 9 })
gou.forEach(p => { you[p.id] = 10; them[p.id] = 2 })
PEOPLE.push({ id: 'teste-pedro', name: 'Pedro Teste', ratings: them, shareMap: true }); People._all = null
const mapYou = OMap.build(st(you))
const comp = OMap.compat(mapYou, you, 'teste-pedro')
const sc = id => (comp.byAxis.find(x => x.axis === id) || {}).score
check(comp.enough && sc('citrico') >= 70, `alto alinhamento em cítricos (${sc('citrico')})`)
check(sc('gourmand') <= 40, `baixo alinhamento em gourmands (${sc('gourmand')})`)
check(!('score' in comp) && Array.isArray(comp.byAxis), 'não há um % global único; o resultado é por família')

/* ---------- 3. Nota baixa com fixação alta não vira gostar ---------- */
console.log('3. Avaliação negativa com fixação alta')
const X = PERFUMES.find(p => p.vector && ax(p, 'amadeirado') > .6)
const base = OMap.build(st({ [X.id]: 2 }))
const withPerf = OMap.build(st({ [X.id]: 2 }, { reviews: { [X.id]: { rating: 2, longevity: 5, projection: 5, perceived: ['Madeira'] } } }))
const amB = base.axes.find(a => a.id === 'amadeirado'), amR = withPerf.axes.find(a => a.id === 'amadeirado')
check(amB.value < .5, `nota 2 empurra amadeirado para baixo (${amB.value.toFixed(2)})`)
check(Math.abs(amB.value - amR.value) < 1e-9, 'fixação e projeção altas não mudam a preferência')

/* ---------- 4. Usuário novo: exploratório e confiança baixa ---------- */
console.log('4. Usuário novo')
const empty = OMap.build(st())
check(empty.level === 'Dados insuficientes', `mapa vazio declara "${empty.level}"`)
const ex0 = OMap.explain(PERFUMES[10], empty)
check(ex0.level === 'Dados insuficientes' && ex0.n === 0, 'explicação traz nível honesto e contagem real (0)')
const r0 = Advisor.rank({ occasions: [], climate: '', presence: '', families: {}, avoidNotes: [], tier: '' }, {}, {}, { n: 5 })
check(r0.items.length >= 3 && r0.lowSignal === true, `há recomendações (${r0.items.length}) marcadas como iniciais (lowSignal)`)

/* ---------- 5. Patrocínio não pontua ---------- */
console.log('5. Patrocínio não altera o ranking orgânico')
const mapS = OMap.build(st({ [A.id]: 8, [C.id]: 8 }))
const target = PERFUMES.find(p => p.vector && p.id !== A.id && p.id !== C.id)
const before = OMap.chance(target, mapS)
target.sponsored = true; target.sponsor = { brand: target.brand, bid: 999 }
const after = OMap.chance(target, mapS)
const rankA = Advisor.rank({ occasions: [], climate: '', presence: '', families: {}, avoidNotes: [], tier: '' }, { [A.id]: 8 }, {}, { n: 20 }).items.map(x => x.p.id).join()
delete target.sponsored; delete target.sponsor
const rankB = Advisor.rank({ occasions: [], climate: '', presence: '', families: {}, avoidNotes: [], tier: '' }, { [A.id]: 8 }, {}, { n: 20 }).items.map(x => x.p.id).join()
check(before === after, `chance igual com e sem patrocínio (${before}% = ${after}%)`)
check(rankA === rankB, 'ranking do Guia idêntico com e sem patrocínio')

/* ---------- 6. Sem dados confiáveis, nada inventado ---------- */
console.log('6. Sem dados, nada inventado')
const noObs = PERFUMES.find(p => p.vector && !ctx.__.OBSERVATIONS.some(o => o.id === p.id))
const perf = ctx.__.Engine.performance(noObs.id)
check(perf.count === 0, `sem relatos de desempenho para ${noObs.name} (contagem ${perf.count})`)
const pc = OMap.perceptions(noObs)
check(!pc || (pc.n === 0 && pc.felt.length === 0 && pc.divergent.length === 0), 'percepção coletiva vazia quando não há relatos (sem % nem contagem inventados)')
const ghost = { id: 'sem-dados', name: 'Sem dados', brand: 'Teste', notes: { top: [], heart: [], base: [] }, noteWeights: [] }
check(OMap.perceptions(ghost) === null, 'perfume sem notas publicadas não ganha percepções')

/* ---------- 7. Dados privados de terceiros ---------- */
console.log('7. Dados privados de terceiros')
const priv = People.get('tiago')
check(priv && priv.shareMap === false && Object.keys(priv.ratings).length === 0, 'perfil privado não expõe avaliações')
const pc7 = OMap.compat(mapYou, you, 'tiago')
check(pc7 && pc7.common === 0 && pc7.person.shareMap === false, 'compatibilidade não lê avaliações privadas')
const fp = OMap.forPerson('tiago')
check(fp && fp.evidence.ratings === 0, 'mapa da pessoa privada usa só o que é público')
const g = Advisor.gift(r0, priv, {})
check(g && g.lowSignal === true && [...g.safe, ...g.bold].every(x => x.level === 'Dados insuficientes'), 'presente para pessoa privada não usa o histórico dela')
const legacyT = PEOPLE.find(p => p.id === 'tiago')
check(!legacyT || Object.keys(legacyT.ratings || {}).length === 0, 'filtragem colaborativa não recebe as avaliações privadas')

/* ---------- 8. Parecidos em outra faixa (mais acessível / mais exclusivo; nacional / importado) ---------- */
console.log('8. Mais barato ou mais caro, com notas parecidas')
const top = PERFUMES.find(p => p.vector && Advisor.tier(p) === 4)
const cheaper = Advisor.priceAlternatives(top, { dir: 'cheaper', n: 6 })
check(cheaper.length > 0 && cheaper.every(x => x.tier < 4), `mais acessíveis que ${top.name} estão todos abaixo da faixa (${cheaper.length})`)
check(cheaper.every(x => x.sim >= 60 && (x.sim >= 80 || x.shared.length >= 3)), 'cada um é parecido de verdade (perfil ou 3+ notas em comum)')
const nat = Advisor.priceAlternatives(top, { dir: 'cheaper', origin: 'national', n: 6 })
check(nat.length > 0 && nat.every(x => x.national), `filtro Nacional só traz marcas nacionais (${nat.length})`)
const imp = Advisor.priceAlternatives(top, { dir: 'any', origin: 'imported', n: 6 })
check(imp.every(x => !x.national), 'filtro Importado só traz importados')
const low = PERFUMES.find(p => p.vector && Advisor.tier(p) === 1 && p.id !== top.id)
low.inspiredBy = top.id
const withDecl = Advisor.priceAlternatives(top, { dir: 'cheaper', n: 6 })
check(withDecl[0] && withDecl[0].p.id === low.id && withDecl[0].declared, 'inspiração declarada pela marca aparece primeiro')
delete low.inspiredBy
check(!Advisor.priceAlternatives(top, { dir: 'cheaper', n: 20 }).some(x => x.declared), 'sem declaração, nada é apresentado como "inspirado em"')

/* ---------- versão do modelo ---------- */
check(typeof OMap.version === 'string' && OMap.version.length > 0, `versão do modelo registrada (${OMap.version})`)

console.log(`verify-intel: ${checks} verificações, ${fails} falha(s)`)
process.exit(fails ? 1 : 0)
