# ELIXIR

Uma rede social minimalista sobre perfumes: feed, stories, perfis, catálogo de 101 fragrâncias, notas olfativas e uma assinatura pessoal calculada a partir do seu gosto.

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

## Estrutura

```
index.html, elixir.html, assinatura.html   Entradas (ELIXIR e a variante ASSINATURA)
assets/css/app.css                          Folha de estilo única, com tokens de tema
assets/js/
  data/      Catálogo, notas, comunidade demonstrativa (sem lógica de tela)
  engine/    Motor de afinidade e identidade olfativa
  core/      dom (utilitários), store (estado + migração), router, motion (tema, animações, modal), components
  views/     Uma tela por arquivo: feed, stories, profile, explore, perfume, notes, collection, discovery, search, activity, compose, shell
  actions.js Todas as interações: data-action="nome" chama Actions.nome
  main.js    Ponto de entrada
tests/       Verificações do motor e da descoberta
```

Fluxo: uma ação altera o estado com `Store.update()`, que salva e avisa o `App.render()`. As telas são funções puras que devolvem HTML. Curtir, salvar e favoritar atualizam só os botões afetados, sem redesenhar a página.

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
