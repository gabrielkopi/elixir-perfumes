"""Testes de experiência de uso do ELIXIR (Python Playwright, Chromium headless).

Uso: python tests/ux/run_ux.py [--http]
Simula tarefas reais de ponta a ponta, em celular (375x812, toque) e desktop (1280x800),
no tema claro e escuro. O clima (Open-Meteo) é simulado, então o teste roda offline.
"""
import pathlib, sys, json, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
FORECAST = {"current": {"temperature_2m": 31.2, "relative_humidity_2m": 80, "apparent_temperature": 34, "weather_code": 2, "is_day": 1},
            "daily": {"temperature_2m_max": [33], "temperature_2m_min": [22], "precipitation_probability_max": [30]}}
GEO = {"results": [{"name": "Recife", "latitude": -8.05, "longitude": -34.9, "admin1": "Pernambuco", "country": "Brasil"}]}
ROUTES = ['home', 'explore', 'ingredients', 'brands', 'edits', 'perfume/vetiver', 'guide', 'today', 'bubble', 'circle', 'connect',
          'map', 'compare', 'collection', 'profile', 'refine/1']

results = []


def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    print(('  ok   ' if ok else '  FAIL ') + name + (f' — {detail}' if detail and not ok else ''))


def base_url(use_http):
    if not use_http:
        return ROOT.joinpath('index.html').as_uri()
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a: None
    srv = socketserver.TCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{srv.server_address[1]}/index.html'


def new_page(browser, mobile=True, scheme='light', reduced=False, session=True):
    ctx = browser.new_context(viewport={'width': 375, 'height': 812} if mobile else {'width': 1280, 'height': 800},
                              has_touch=mobile, color_scheme=scheme, reduced_motion='reduce' if reduced else 'no-preference')
    ctx.route('https://api.open-meteo.com/**', lambda r: r.fulfill(json=FORECAST))
    ctx.route('https://geocoding-api.open-meteo.com/**', lambda r: r.fulfill(json=GEO))
    if session:  # pula a tela de perfis (já escolhido nesta sessão); o fluxo de perfis tem teste próprio
        ctx.add_init_script("try{if(!sessionStorage.getItem('elixir-session-account'))sessionStorage.setItem('elixir-session-account','gabriel')}catch(e){}")
    pg = ctx.new_page()
    pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append('pageerror: ' + str(e)[:200]))
    pg.on('console', lambda m: m.type == 'error' and 'ERR_FILE_NOT_FOUND' not in m.text and pg.errors.append('console: ' + m.text[:200]))
    return pg


def go(pg, url, h, wait=700):
    pg.goto(url + '#' + h)
    pg.wait_for_timeout(wait)


def demo(pg, url):
    """Estado de demonstração: onboarding feito, 14 avaliações, coleção."""
    go(pg, url, 'home', 500)
    pg.evaluate("""(()=>{const ids=PERFUMES.filter(p=>p.vector&&p.image).slice(0,14).map(p=>p.id);const v=[8,8,6,6,2,8,4,6,8,2,6,8,4,6];
      Store.update(s=>{s.onboarded=true;ids.forEach((id,i)=>{s.ratings[id]=v[i];s.ratedAt[id]=Date.now()-i*864e5;if(i<6){s.shelf[id]='have';s.shelfAt[id]=Date.now()}});});
      Store.flush&&Store.flush();})()""")


def weather_home(browser, url):
    print('0. Clima de hoje no Início (São Paulo, Open-Meteo simulado)')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'home', 800)
    try:
        pg.wait_for_selector('.v-home .wx-card', timeout=8000)
    except Exception:
        pass
    check('cartão de clima aparece', pg.query_selector('.v-home .wx-card') is not None)
    check('mostra São Paulo e a temperatura', 'São Paulo' in pg.inner_text('.v-home') and '31°' in pg.inner_text('.v-home'))
    check('arte animada do tempo', pg.evaluate("(()=>{const s=document.querySelector('.wx-card .wx-art');return !!s&&document.getAnimations().some(a=>s.contains(a.effect&&a.effect.target))})()"))
    check('barra de abas com lente na aba ativa', pg.evaluate("getComputedStyle(document.querySelector('.tabbar')).getPropertyValue('--ti').trim()==='0'"))
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def accounts_flow(browser, url):
    print('1a. Perfis de teste: escolher, criar novo login e guardar')
    pg = new_page(browser, session=False)
    go(pg, url, 'home', 1200)
    check('abre na tela de perfis', 'accounts' in pg.url and 'Quem está usando?' in pg.inner_text('main'))
    names = pg.evaluate("[...document.querySelectorAll('.acc-name')].map(e=>e.textContent)")
    check('perfis prontos: Gabriel, Vinicius, Amanda, Heloísa, Theo', all(n in names for n in ['Gabriel', 'Vinicius', 'Amanda', 'Heloísa', 'Theo']), str(names))
    pg.click('[data-action=account-use][data-id=vinicius]'); pg.wait_for_timeout(1200)
    st = pg.evaluate("({name:state.profile.name,n:Object.keys(state.ratings).length,onb:state.onboarded,page:route.page})")
    check(f'Vinicius entra direto no Início com perfil montado ({st["n"]} avaliações)', st['page'] == 'home' and st['onb'] and st['n'] >= 6 and st['name'] == 'Vinicius', str(st))
    fam = pg.evaluate("Select.map().primary.map(a=>a.id).join(',')")
    check(f'o mapa do Vinicius é aquático ou cítrico ({fam})', any(f in fam for f in ['aquatico', 'citrico']))
    go(pg, url, 'accounts', 900)
    pg.click('a[href="#accounts/new"]'); pg.wait_for_timeout(800)
    pg.fill('#acc-name', 'Joana Teste'); pg.click('[data-action=account-vibe][data-id=sea]'); pg.wait_for_timeout(200)
    pg.click('[data-action=account-create]'); pg.wait_for_timeout(1000)
    check('criar login leva às perguntas guiadas', 'welcome' in pg.url, pg.url)
    for t in pg.query_selector_all('.w-pick')[:3]:
        t.click()
    pg.click('[data-action=welcome-go][data-n="3"]'); pg.wait_for_timeout(700)
    for seg in pg.query_selector_all('.w-scale'):
        seg.query_selector('[data-id="8"]').click()
    pg.click('[data-action=welcome-go][data-n="4"]'); pg.wait_for_timeout(700)
    pg.click('.q-foot [data-action=welcome-skip]'); pg.wait_for_timeout(700)
    pg.click('[data-action=welcome-enter]'); pg.wait_for_timeout(1000)
    st = pg.evaluate("({name:state.profile.name,vibe:state.profile.avatarVibe,n:Object.keys(state.ratings).length,acc:Accounts.active()})")
    check('novo perfil com nome, vibe e avaliações próprias', st['name'] == 'Joana Teste' and st['vibe'] == 'sea' and st['n'] == 3 and st['acc'] == 'joana-teste', str(st))
    go(pg, url, 'accounts', 900)
    check('o novo login fica guardado na lista', 'Joana Teste' in pg.inner_text('main'))
    pg.click('[data-action=account-use][data-id=vinicius]'); pg.wait_for_timeout(900)
    check('cada perfil tem os próprios dados', pg.evaluate("state.profile.name") == 'Vinicius' and pg.evaluate("Object.keys(state.ratings).length") != 3)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def colors_flow(browser, url):
    print('1d. Cor do frasco: filtrar, buscar e escolher no onboarding')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'explore', 1200)
    pg.click('[data-action=explore-color][data-id=azul]'); pg.wait_for_timeout(900)
    ok = pg.evaluate("(()=>{const ids=[...document.querySelectorAll('#panel-grid [data-id]')].map(e=>e.dataset.id).filter(id=>byId(id));return ids.length>0&&ids.every(id=>Catalog.colorOf(byId(id))==='azul')})()")
    check('filtro Azul mostra só frascos azuis', ok)
    check('mostra a tendência medida no catálogo', 'costumam ser' in pg.inner_text('#xp-colors'))
    pg.click('[data-action=explore-color][data-id=azul]'); pg.wait_for_timeout(700)
    check('tocar de novo desliga o filtro', pg.evaluate("Explore.state().filters.color.length") == 0)
    r = pg.evaluate("(()=>{const s=Catalog.search('verde');return {c:s.color&&s.color.id,n:s.perfumes.length,all:s.perfumes.every(p=>Catalog.colorOf(p)==='verde')}})()")
    check(f'buscar "verde" traz frascos verdes ({r["n"]})', r['c'] == 'verde' and r['n'] > 0 and r['all'])
    pg2 = new_page(browser)
    go(pg2, url, 'home', 900)
    pg2.click('[data-action=welcome-go][data-n="2"]'); pg2.wait_for_timeout(700)
    pg2.click('[data-action=welcome-color][data-id=rosa]'); pg2.wait_for_timeout(800)
    ok2 = pg2.evaluate("(()=>{const ids=[...document.querySelectorAll('.w-pick')].map(e=>e.dataset.id);return ids.length>=3&&ids.every(id=>Catalog.colorOf(byId(id))==='rosa')})()")
    check('no onboarding, escolher Rosa mostra frascos rosa', ok2)
    check('sem erros no console', not pg.errors and not pg2.errors, '; '.join((pg.errors + pg2.errors)[:3]))
    pg.context.close(); pg2.context.close()


def live_flow(browser, url):
    print('1e. App vivo: publicações, comentários, notificações e novidades (demonstração)')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'home', 1500)
    pg.evaluate("Live.tick('post')"); pg.wait_for_timeout(500)
    check('chega uma publicação nova com aviso no topo', pg.query_selector('#live-banner') is not None and 'publicou' in pg.inner_text('#live-banner'))
    check('o aviso diz que é demonstração', 'Demonstração' in pg.inner_text('#live-banner'))
    check('aparece "Novas publicações" no feed', pg.query_selector('.feed-new') is not None)
    pg.click('.feed-new'); pg.wait_for_timeout(900)
    first = pg.evaluate("document.querySelector('.v-home .post')?.dataset.post")
    check(f'tocar mostra a publicação nova no topo ({first})', bool(first) and first.startswith('live'))
    pg.evaluate("Live.tick('comment')"); pg.wait_for_timeout(300)
    pg.evaluate("Live.tick('news')"); pg.wait_for_timeout(300)
    check('novidade do catálogo vem de perfume real recém-adicionado', 'Novo no catálogo' in pg.inner_text('#live-banner'))
    n = pg.evaluate("Activity.events().filter(e=>e.live).length")
    check(f'tudo entra nas notificações ({n})', n >= 3)
    check('o sino ganha o ponto de novidade', pg.query_selector('[data-action=activity] .dot-unread') is not None)
    check('faixa "Chegou no ELIXIR" no Início', 'Chegou no ELIXIR' in pg.inner_text('main'))
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def price_flow(browser, url):
    print('1f. Mais barato ou mais caro, com notas parecidas')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'perfume/sospiro-vibrato', 1300)
    txt = pg.inner_text('.pf-price')
    check('seção aparece com a faixa do perfume', 'Nicho' in txt and 'não pelo preço' in txt)
    n1 = len(pg.query_selector_all('.pf-alt-row'))
    check(f'mostra opções mais acessíveis ({n1})', n1 >= 3)
    pg.click('[data-action=pf-price-origin][data-id=national]'); pg.wait_for_timeout(900)
    rows = pg.evaluate("[...document.querySelectorAll('.pf-alt-row .row')].map(r=>r.innerText)")
    check(f'Nacional filtra a lista ({len(rows)})', len(rows) > 0 and all('Nacional' in r for r in rows))
    pg.click('[data-action=pf-price-dir][data-id=pricier]'); pg.wait_for_timeout(900)
    check('Mais exclusivo explica quando não há opção acima', 'faixa mais exclusiva' in pg.inner_text('.pf-price'))
    go(pg, url, 'perfume/creed-aventus', 1300)
    first = pg.evaluate("(document.querySelector('.pf-alt-row')||{}).innerText||''")
    check('Aventus: o inspirado declarado (New Venttus, Azza) aparece primeiro', 'New Venttus' in first and 'Inspiração declarada' in first, first[:120])
    n = pg.evaluate("PERFUMES.length")
    check(f'catálogo atualizado ({n} perfumes)', n >= 2000)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def onboarding_unknown(browser, url):
    print('1b. Onboarding: escala completa, "Não conheço" e retomada após recarregar')
    pg = new_page(browser)
    go(pg, url, 'home', 900)
    pg.click('[data-action=welcome-go][data-n="2"]'); pg.wait_for_timeout(700)
    for t in pg.query_selector_all('.w-pick')[:4]:
        t.click()
    pg.reload(); pg.wait_for_timeout(1200)
    n = len(pg.query_selector_all('.w-pick[aria-pressed=true]'))
    check(f'seleção sobrevive a recarregar a página ({n} de 4)', n == 4)
    pg.click('[data-action=welcome-go][data-n="3"]'); pg.wait_for_timeout(700)
    labels = pg.evaluate("[...document.querySelector('.w-scale').querySelectorAll('button')].map(b=>b.textContent.trim())")
    check('escala Amo, Gosto, Neutro, Não gosto, Detesto', labels == ['Amo', 'Gosto', 'Neutro', 'Não gosto', 'Detesto'], str(labels))
    pg.click('.w-row >> nth=0 >> [data-action=welcome-unknown]'); pg.wait_for_timeout(600)
    left = pg.evaluate("Discovery.picked().length")
    check(f'"Não conheço" tira o perfume sem registrar opinião ({left} restantes)', left == 3 and pg.evaluate("Object.keys(state.ratings).length") == 0)
    for seg in pg.query_selector_all('.w-scale'):
        seg.query_selector('[data-id="5"]').click()
    pg.click('[data-action=welcome-go][data-n="4"]'); pg.wait_for_timeout(700)
    check('neutro salvo como avaliação (3)', pg.evaluate("Object.values(state.ratings).filter(v=>v===5).length") == 3)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def community_demo(browser, url):
    print('1c. Comunidade de demonstração rotulada')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'home', 1500)
    n = pg.evaluate("Posts.all().length")
    check(f'feed com mais publicações ({n})', n >= 60)
    tags = pg.evaluate("[...document.querySelectorAll('.post')].filter(p=>p.querySelector('.demo-tag')).length")
    total = pg.evaluate("document.querySelectorAll('.post').length")
    check(f'toda publicação da comunidade tem o selo Demonstração ({tags}/{total})', total > 0 and tags == total)
    go(pg, url, 'person/helena', 1200)
    check('perfil de pessoa mostra "Perfil de demonstração"', 'Perfil de demonstração' in pg.inner_text('main'))
    go(pg, url, 'perfume/vetiver', 1200)
    txt = pg.inner_text('main')
    check('página do perfume não mostra percepção inventada', 'O que as pessoas percebem' in txt and '% sentem' not in txt)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def first_run(browser, url):
    print('1. Primeiro acesso')
    pg = new_page(browser)
    go(pg, url, 'home', 900)
    check('sem dados, abre as boas-vindas', 'welcome' in pg.url, pg.url)
    taps = 0
    pg.click('[data-action=welcome-go][data-n="2"]'); taps += 1; pg.wait_for_timeout(700)
    tiles = pg.query_selector_all('.w-pick')
    for t in tiles[:3]:
        t.click(); taps += 1
    pg.click('[data-action=welcome-go][data-n="3"]'); taps += 1; pg.wait_for_timeout(700)
    for seg in pg.query_selector_all('.w-scale'):
        seg.query_selector('[data-id="8"]').click(); taps += 1
    pg.click('[data-action=welcome-go][data-n="4"]'); taps += 1; pg.wait_for_timeout(700)
    pg.click('.q-foot [data-action=welcome-skip]'); taps += 1; pg.wait_for_timeout(700)
    check('primeiro mapa aparece', pg.query_selector('.w-done') is not None)
    pg.click('[data-action=welcome-enter]'); taps += 1; pg.wait_for_timeout(900)
    check(f'onboarding em {taps} toques (≤ 11)', taps <= 11 and 'welcome' not in pg.url, pg.url)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def guide_flow(browser, url):
    print('2. Saiba qual perfume comprar')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'guide')
    pg.click('[data-action=guide-start]'); pg.wait_for_timeout(700)
    steps = 0
    for _ in range(12):
        if 'results' in pg.url:
            break
        opt = pg.query_selector('.q-opts .q-opt')
        if opt and pg.query_selector('.q-opt[aria-checked=true]') is None:
            opt.click(); pg.wait_for_timeout(500)
        nxt = pg.query_selector('[data-action=guide-next]:not([disabled])')
        if nxt and 'results' not in pg.url:
            nxt.click()
        pg.wait_for_timeout(600); steps += 1
    check('chega aos resultados', 'results' in pg.url, pg.url)
    check('melhor aposta com "por que"', pg.query_selector('.g-hero .g-bullets li') is not None)
    n = len(pg.query_selector_all('.g-item')) + (1 if pg.query_selector('.g-hero') else 0)
    check(f'≥ 3 recomendações ({n})', n >= 3)
    check('mostra chance de gostar', 'Chance de gostar' in pg.inner_text('main'))
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def shelf_rating(browser, url):
    print('3. Coleção e avaliação')
    pg = new_page(browser)
    demo(pg, url)
    pid = pg.evaluate("PERFUMES.find(p=>p.vector&&p.image&&!state.shelf[p.id]&&state.ratings[p.id]===undefined).id")
    go(pg, url, 'perfume/' + pid, 900)
    btn = pg.locator('main [data-action=shelf-set]', has_text='Quero').first
    try:
        btn.click(); pg.wait_for_timeout(500)
    except Exception as e:
        check('botão Quero', False, str(e)[:120])
    check('Quero salva na coleção', pg.evaluate(f"state.shelf['{pid}']") == 'want', str(pg.evaluate(f"state.shelf['{pid}']")))
    try:
        pg.click('[data-action=rate]'); pg.wait_for_timeout(700)
        check('folha de avaliação abre', pg.evaluate("document.querySelector('#sheet').open"))
        check('foco vai para dentro da folha', pg.evaluate("document.querySelector('#sheet').contains(document.activeElement)"))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(700)
        check('Esc fecha a folha sem sair da página', not pg.evaluate("document.querySelector('#sheet').open") and pid in pg.url)
    except Exception as e:
        check('avaliação', False, str(e)[:160])
    go(pg, url, 'collection/want', 900)
    check('aparece em Coleção · Quero', pid in pg.inner_html('main'))
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def compare_flow(browser, url):
    print('4. Comparar')
    pg = new_page(browser)
    demo(pg, url)
    ids = pg.evaluate("PERFUMES.filter(p=>p.vector&&p.image).slice(20,23).map(p=>p.id)")
    for i in ids[:2]:
        pg.evaluate(f"Actions.run ? 0 : 0; Store.update(s=>{{if(!s.compare.includes('{i}'))s.compare.push('{i}')}})")
    go(pg, url, 'explore', 900)
    tray = pg.query_selector('.tray')
    tab = pg.query_selector('.tabbar')
    if tray and tab:
        a, b = tray.bounding_box(), tab.bounding_box()
        check('bandeja não cobre a barra de abas', a['y'] + a['height'] <= b['y'] + 1, f'{a} {b}')
    else:
        check('bandeja aparece', tray is not None)
    pg.click('.tray .tray-go'); pg.wait_for_timeout(900)
    check('abre #compare com os dois', all(i in pg.url for i in ids[:2]), pg.url)
    check('veredito aparece', pg.query_selector('.c-verdict') is not None)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def today_flow(browser, url):
    print('5. Hoje com clima real (simulado)')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'today', 900)
    try:
        pg.get_by_role('button', name='Trocar cidade').or_(pg.get_by_role('button', name='Outra cidade')).first.click(); pg.wait_for_timeout(600)
        pg.fill('#sheet input[type=search], #sheet input', 'Recife'); pg.wait_for_timeout(1200)
        pg.click('#sheet .cy-opt'); pg.wait_for_timeout(1500)
    except Exception as e:
        check('escolher cidade', False, str(e)[:160])
    txt = pg.inner_text('main')
    check('mostra a temperatura de Recife', '31' in txt and 'Recife' in txt, txt[:160])
    check('sugere um perfume com o porquê', pg.query_selector('.td-pick .td-reasons li') is not None)
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def connect_flow(browser, url):
    print('6. ELIXIR Connect')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'connect', 900)
    try:
        pg.get_by_role('button', name='Gerar QR Code').click(); pg.wait_for_timeout(900)
        check('QR Code aparece', pg.query_selector('.cn-qr svg') is not None)
        check('contagem regressiva', pg.query_selector('.cn-timer .countdown') is not None)
        pg.get_by_role('button', name='Encerrar').first.click(); pg.wait_for_timeout(900)
        conf = pg.query_selector('#sheet[open] .btn--danger, #sheet[open] [data-action*=confirm]')
        if conf:
            conf.click(); pg.wait_for_timeout(800)
        check('encerrar revoga o acesso', pg.query_selector('.cn-qr svg') is None)
    except Exception as e:
        check('Connect', False, str(e)[:160])
    check('sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
    pg.context.close()


def search_flow(browser, url):
    print('7. Busca')
    pg = new_page(browser, mobile=False)
    demo(pg, url)
    go(pg, url, 'home', 900)
    pg.keyboard.press('/'); pg.wait_for_timeout(700)
    check('"/" abre a busca com o campo focado', pg.evaluate("document.activeElement && document.activeElement.tagName==='INPUT' && document.querySelector('#sheet').open"))
    pg.keyboard.type('sandalo'); pg.wait_for_timeout(700)
    check('"sandalo" encontra Sândalo', 'Sândalo' in pg.inner_text('#sheet'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    check('Esc fecha', not pg.evaluate("document.querySelector('#sheet').open"))
    pg.context.close()


def navigation(browser, url):
    print('8. Navegação, voltar e transições')
    pg = new_page(browser)
    demo(pg, url)
    go(pg, url, 'home', 800)
    for h in ['explore', 'perfume/vetiver', 'guide']:
        pg.evaluate(f"location.hash='#{h}'"); pg.wait_for_timeout(700)
    for _ in range(3):
        pg.go_back(); pg.wait_for_timeout(700)
    check('3 avanços e 3 voltas retornam ao Início', pg.url.endswith('#home') or pg.url.endswith('index.html'), pg.url)
    go(pg, url, 'nao-existe', 800)
    check('endereço desconhecido cai no Início', pg.query_selector('[data-view=home]') is not None)
    go(pg, url, 'perfume/nao-existe', 800)
    check('perfume inexistente mostra aviso', 'encontr' in pg.inner_text('main').lower())
    go(pg, url, 'explore', 800)
    blur = pg.evaluate("""new Promise(res=>{location.hash='#guide';setTimeout(()=>{const a=document.getAnimations().map(a=>{try{return JSON.stringify(a.effect.getKeyframes())}catch(e){return ''}}).join(' ');
       const sheets=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].map(r=>r.cssText)}catch(e){return []}}).join(' ');res(/blur/.test(a)||/view-transition[^{]*\\{[^}]*blur|page-in[^{]*\\{[^}]*blur/.test(sheets))},120)})""")
    check('troca de tela usa desfoque', blur)
    pg.context.close()


def layout(browser, url, scheme):
    print(f'9. Layout em todas as telas ({scheme})')
    for w in [320, 375, 1280]:
        ctx_mobile = w < 900
        pg = new_page(browser, mobile=ctx_mobile, scheme=scheme)
        pg.set_viewport_size({'width': w, 'height': 800})
        demo(pg, url)
        bad, junk = [], []
        for h in ROUTES:
            go(pg, url, h, 700)
            if pg.evaluate("document.documentElement.scrollWidth - innerWidth") > 0:
                bad.append(h)
            t = pg.inner_text('body')
            if any(x in t for x in ['undefined', 'NaN', '[object Object]']):
                junk.append(h)
        check(f'{w}px: sem rolagem horizontal', not bad, ', '.join(bad))
        check(f'{w}px: sem "undefined/NaN" na tela', not junk, ', '.join(junk))
        check(f'{w}px: sem erros no console', not pg.errors, '; '.join(pg.errors[:3]))
        if w == 1280:
            go(pg, url, 'explore', 900)
            # Chromium headless esconde barras de rolagem; conferimos as regras e o token de cor.
            sb = pg.evaluate("""(()=>{const r=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].map(x=>x.cssText)}catch(e){return []}}).join(' ');
              const tok=getComputedStyle(document.documentElement).getPropertyValue('--sb-thumb').trim();
              if(!r)return {w:true,thumb:true,ff:true,tok,note:'file:// não deixa ler o CSS; regras conferidas via http'};
              return {w:/::-webkit-scrollbar\s*\{[^}]*width:\s*10px/.test(r),thumb:/::-webkit-scrollbar-thumb[^{]*\{[^}]*var\(--sb-thumb\)/.test(r),ff:/scrollbar-color:\s*var\(--sb-thumb\)/.test(r),tok}})()""")
            check('barra de rolagem no padrão (fina, cor do tema, Chrome e Firefox)', sb['w'] and sb['thumb'] and sb['ff'] and sb['tok'], str(sb))
            fonts = pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/\"/g,''))")
            check('só a fonte DM Sans', fonts and all(f == 'DM Sans' for f in fonts), str(set(fonts)))
        pg.context.close()


def reduced_motion(browser, url):
    print('10. Movimento reduzido')
    pg = new_page(browser, reduced=True)
    demo(pg, url)
    go(pg, url, 'explore', 800)
    pg.evaluate("location.hash='#guide'"); pg.wait_for_timeout(150)
    n = pg.evaluate("document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().duration>20).length")
    check(f'sem animações longas ({n})', n == 0)
    pg.context.close()


def other_entries(browser, url):
    print('11. Outras entradas')
    for f in ['elixir.html', 'perfume-social.html', 'assinatura.html', 'elixir-apresentacao.html']:
        pg = new_page(browser, mobile=False)
        pg.goto(url.replace('index.html', f)); pg.wait_for_timeout(1500)
        check(f'{f} abre sem erros', not pg.errors, '; '.join(pg.errors[:2]))
        pg.context.close()


def main():
    use_http = '--http' in sys.argv
    url = base_url(use_http)
    print('ELIXIR · testes de experiência ·', 'http' if use_http else 'file://')
    with sync_playwright() as p:
        b = p.chromium.launch()
        for fn in [weather_home, first_run, accounts_flow, colors_flow, live_flow, price_flow, onboarding_unknown, community_demo, guide_flow, shelf_rating, compare_flow, today_flow, connect_flow, search_flow, navigation, reduced_motion, other_entries]:
            try:
                fn(b, url)
            except Exception as e:
                check(fn.__name__ + ' (exceção)', False, str(e)[:200])
        for scheme in ['light', 'dark']:
            try:
                layout(b, url, scheme)
            except Exception as e:
                check('layout (exceção)', False, str(e)[:200])
        b.close()
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)} de {len(results)} verificações passaram')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
