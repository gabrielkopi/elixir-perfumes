# ELIXIR

Uma rede social minimalista sobre perfumes: feed, stories, perfis, um catálogo com perfumes nacionais e importados, notas olfativas, o Guia para saber qual perfume comprar e um mapa olfativo pessoal que explica cada recomendação.

**Site:** https://gabrielkopi.github.io/elixir-perfumes/

## O que tem

- **Feed** em coluna única com stories, duplo toque para curtir, comentários, salvos e compartilhamento.
- **Stories** em tela cheia com barra de progresso, toque para avançar, segurar para pausar e arrastar para fechar.
- **Busca rápida** (tecla `/` ou `Ctrl+K`) por perfumes, pessoas e notas, com recentes.
- **Atividade** com notificações do que acontece no seu perfil.
- **Explorar** com busca instantânea, filtros e rolagem contínua.
- **Perfume**: afinidade, notas, acordes, desempenho, quem também usa e parecidos.
- **Perfil** com publicações, favoritos, assinatura olfativa (radar) e avaliações.
- **Descoberta guiada** em cinco passos para montar a assinatura.
- **Tema claro e escuro** que segue o sistema, com troca animada.
- Transições entre telas (View Transitions), revelação ao rolar, imagens com carregamento suave. Tudo respeita *reduzir movimento*.

Os dados ficam no navegador (`localStorage`). Não há servidor nem sincronização entre aparelhos.

## Apresentação

`elixir-apresentacao.html`: apresentação em movimento, 14 cenas que tocam sozinhas (cerca de 3 min 40 s). Setas avançam e voltam, espaço pausa, F abre em tela cheia. Os números e imagens vêm do catálogo real do app.

## Estrutura (v3 "Ink & Paper")

```
index.html, elixir.html, assinatura.html, perfume-social.html   Entradas (mesma lista de scripts, ?v=91)
assets/css/fonts.css        DM Sans 400/500/600/700 (única fonte)
assets/css/base.css         Tokens, tema claro/escuro, componentes globais, shell, blur e barras de rolagem
assets/css/views/*.css      Uma folha por tela, só com seletores do próprio namespace (.v-*, .sh-*)
assets/js/
  data/      Catálogo, notas, ingredientes, comunidade demonstrativa (sem lógica de tela)
  engine/    Motores puros (afinidade, Guia, mapa olfativo)
  core/      dom, profile-rules, store (v3 + migração), catalog, router, motion (Motion/Sheet/Theme),
             components (UI.*), actions (despachante), weather
  views/     Uma tela por arquivo; cada uma registra as próprias rotas com Router.add
  actions.js Ações globais do core (Actions.add)
  main.js    App.boot / App.render
docs/        Especificação (redesign-spec.md), requisitos e contratos do core (contracts-core.md)
tests/       Verificações em Node (npm test) e cenários de UX em Python Playwright (npm run test:ux)
```

Fluxo: uma ação altera o estado com `Store.update()`, que saneia, salva e redesenha sem transição. Trocas de rota usam View Transitions com blur (ou a animação equivalente quando o navegador não tem a API). Segmentos, curtidas, seguir e estantes atualizam no lugar.

## Rodar

Abra `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 5178
```

Testes:

```bash
npm test
```

## Créditos

Perfis, métricas, selo de verificação e gostos são demonstrações. Retratos da comunidade e ilustrações de famílias foram gerados com IA; prompts nos manifests. Fotos de produtos e marcas pertencem aos seus titulares (fontes em `assets/products/catalog-images.json` e `assets/research/social-product-sources.json`). Base Scento adaptada sob CC BY 4.0, com atribuição nas páginas e em `assets/catalog-source/LICENSE`. Fontes DM Sans e Italiana sob OFL (`assets/LICENSE-*.txt`).

## Testes

```bash
npm test          # sintaxe + verificações (motor, store v3, globais, CSS, catálogo, privacidade, Guia, intel)
npm run test:ux   # cenários de interface com Python Playwright (Chromium headless)
```

Verificações de outros grupos que ainda não existem aparecem como PULADO, nunca como aprovadas.

## Privacidade

Tudo fica no navegador (`localStorage`). Em Ajustes › Privacidade e dados dá para exportar um JSON com tudo o que está salvo ou apagar os dados deste aparelho. O clima real só é buscado no Open-Meteo depois que você escolhe uma cidade ou permite a localização.

