## Catálogo v4

[Abrir catálogo publicado](https://gabrielkopi.github.io/elixir-perfumes/elixir.html?v=catalog4#explore)

280 registros no aplicativo: 106 WePink, 37 O Boticário, 26 Guerlain, 22 Rabanne, 6 Natura, Vibrato da Sospiro e outras marcas. A edição adiciona 179 registros aos 101 existentes (catálogo anterior e Exclusivo da comunidade).

As notas possuem referências individuais. Foram recuperadas 94 pirâmides da aba oficial WePink; os outros 12 registros usam apenas destaques efetivamente citados na descrição oficial. A cobertura de 106 corresponde à categoria de perfumes individuais consultada em 31/10/2026, sem kits, roll-ons e body splashes; não afirma cobrir todos os lançamentos históricos. As fotos WePink são oficiais. Material O Boticário sem data não confirma disponibilidade atual. Classificações Scento são identificadas como classificação de catálogo, e famílias ausentes não são deduzidas como fatos.

A nova página oferece notas ilustradas, filtros por camada, gráfico de barras/radar editorial, comparação, favoritos, prateleira e percepção pessoal de 0 a 5. O gráfico não mede intensidade na pele nem percentuais de ingredientes. Símbolos são ilustrativos e fotos indisponíveis permanecem identificadas. Percepções ficam no navegador e são preservadas na exportação/importação.

Fontes: [WePink](https://www.wepink.com.br/), [O Boticário](https://static-cms.internacional.grupoboticario.digital/SEGREDINHO_Perfumaria_completa_2ff6b13fd2.pdf), [Natura](https://static.rede.natura.net/html/br/site_cf/10_2023/FAQs/FAQ-homem2.html), [Sospiro](https://sospirointernational.com/products/vibrato), [Scento CC BY 4.0](https://github.com/Scento-com/perfume-dataset). Dados por produto em `assets/catalog-expanded.json`.

Validação: `npm run check` e `npm test`, incluindo filtros, paginação, fontes, arquivos de imagem, camadas, radar, percepção, importação e renderização de todos os perfumes.

---

# ELIXIR

**Site:** https://gabrielkopi.github.io/elixir-perfumes/

**Laboratório da edição Studio v3:** https://gabrielkopi.github.io/elixir-perfumes/elixir.html#lab

Um espaço de descoberta olfativa, com catálogo de fragrâncias, 44 notas e acordes ilustrados, assinatura pessoal e comunidade demonstrativa.

A edição ampliada acrescenta prateleiras com seleção múltipla, 12 perfis de exemplo e criação de pessoas fictícias, círculo privado, ideias de presentes, diário de uso, sugestões para hoje, descobertas fora da bolha e simulação local do ELIXIR Connect. Os cenários de teste são opcionais e guardam uma cópia anterior antes da troca.

Consulte [o roteiro de testes e os limites da simulação](STUDIO-V3.md). Para testar com exemplos, abra o laboratório e escolha um cenário.

## Executar

O site é estático: sirva esta pasta por HTTP ou use o GitHub Pages. O aplicativo está em `elixir.html`; a página inicial está em `index.html`. As identidades e apresentações anteriores continuam incluídas.

O container e a implantação futura no servidor da Prakyer estão documentados em [deploy/PRAKYER.md](deploy/PRAKYER.md).

## Verificar

Com Node 24.15 ou superior:

```sh
npm ci
npm run check
npm test
```

A dependência JSDOM serve apenas aos testes locais; o site e o container não dependem de Node em execução.

## Dados e simulações

Preferências, coleções, pessoas criadas, círculo e diário ficam somente neste navegador. Não há conta real nem sincronização entre aparelhos. O Connect é uma simulação no mesmo dispositivo, sem segurança de autorização no servidor ou integração de estoque. Perfis, relatos e métricas sociais de exemplo são fictícios.

As imagens novas são ilustrações geradas com IA; prompts, dimensões e exportações estão em [assets/studio/generation.json](assets/studio/generation.json). As oito imagens WebP preservam transparência e somam aproximadamente 580 KB.

## Fontes e atribuição

Fotografias de produtos: `assets/products/catalog-images.json` e `assets/research/social-product-sources.json`. Produtos e marcas pertencem aos respectivos titulares. Retratos anteriores, famílias e notas ilustradas têm proveniência nos manifests das pastas correspondentes.

Catálogo Scento adaptado sob CC BY 4.0, com tradução, normalização e pesos editoriais, preservando atribuição nas páginas e em `assets/catalog-source/LICENSE`. Notas são referências de catálogo, não comprovação de percepção ou proporção de ingredientes. As novas descrições educativas remetem ao [guia de ingredientes da The Perfume Society](https://perfumesociety.org/discover-perfume/an-introduction/ingredients/).
