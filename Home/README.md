# Home do elixir

A experiência React é a entrada do GitHub Pages. Identidade, catálogo, comunidade, conversas, biblioteca e coleção usam a mesma navegação. A aba Ferramentas incorpora as rotas clássicas para descoberta, assinatura, comparação, perfil pessoal, indicações e listas. A entrada clássica `elixir.html` ainda atende links externos legados.

```sh
cd Home
npm ci
npm run dev
```

Seguir, curtir, comentar, conversar, avaliar e salvar na interface React grava dados de demonstração no navegador. A área Ferramentas mantém a conta e as listas do aplicativo clássico. O modo claro ou escuro acompanha a navegação.

Para preparar o GitHub Pages no mesmo checkout:

```sh
cd Home
npm run build:pages
```

Isso gera `index.html` e `studio/` na raiz. A compilação é versionada porque o Pages serve diretamente a branch `main`. Teste o conjunto com `npm start` na raiz, que também serve os ícones do acervo e as rotas clássicas.

Os produtos e as ilustrações do acervo estão documentados em [CATALOG.md](src/data/CATALOG.md). Os recortes usados nos perfis fictícios estão em [PORTRAITS.md](src/data/PORTRAITS.md).
