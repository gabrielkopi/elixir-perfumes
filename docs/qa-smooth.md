# Fluidez e padronização visual — ELIXIR

Data: 1 de novembro de 2026. Implementação sobre a edição publicada, sem migração de framework ou dependências novas em execução.

## Auditoria inicial e arquitetura

Aplicação estática em HTML, CSS e JavaScript. `app.js` fornece roteamento por hash, persistência local, formulários e diálogo nativo; os módulos `minimal`, `social`, `studio`, `catalog-experience` e `atelier` estendem as mesmas funções de renderização. A navegação compartilhada fica montada em `Motion.paint`. JSDOM é usado somente nos testes.

Foram examinados os três pontos de entrada do aplicativo, a página inicial e as três apresentações. As 17 telas/exemplos principais estão na [matriz](qa-smooth-matrix.json): comunidade, catálogo, prateleira, pessoas, círculo, usar hoje, diário, Connect, Alquimia, biblioteca, perfil, laboratório, descoberta, perfume, nota, família e perfil público. O fluxo inicial tem cinco etapas. Notas, perfumes, organização da prateleira, criação de pessoas, círculo, publicação, preferências e consentimento compartilham o diálogo nativo.

| Problema encontrado | Implementação |
| --- | --- |
| Fontes editoriais, serifas avulsas e quatro arquivos TTF separados dos padrões globais | Uma família principal, DM Sans local, pesos 400–700, WOFF2 e tokens de tipografia compartilhados |
| Busca do catálogo atualizava a grade duas vezes por evento | Um único responsável por atualizar a busca, com resposta imediata e cursor preservado |
| Trocar tema reconstruía toda a página | Atualiza somente tema, controle e cor da interface do navegador |
| Cada nota da Alquimia reconstruía busca, seletor e painel inteiro | Mantém os controles; atualiza seleção, mistura, exclusões e resultados necessários |
| Seleções repetidas recriavam todo o fluxo inicial e perdiam foco | Mantém sua estrutura, altera as partes necessárias e restaura o controle |
| Animações longas e sobrepostas, inclusive blur em janelas | Um efeito por elemento, cancelável; movimentos de poucos pixels e tempos curtos |
| Fechamento antigo podia concorrer com uma janela nova | Cancelamento e verificação de identidade da animação antes de fechar |
| Filtros ocupavam a primeira tela no celular | Painel nativo recolhível; busca sempre visível, resumo dos filtros ativos e estado aberto preservado |
| Carrossel da comunidade excedia a tela em 6 px | Margem final limitada ao contêiner, com rolagem apenas dentro do carrossel |
| Uma regra antiga sobrescrevia o espaço abaixo do conteúdo no mobile | Espaço reservado para a barra fixa e a área segura |
| Contraste baixo em “Seguindo” e nas legendas da apresentação | Cores secundárias legíveis, controles e contadores padronizados |

## Padrões e decisões

`assets/ui-system.css` concentra família, escala tipográfica, espaçamentos, raios, alturas e intensidade do vidro. Preserva a paleta natural, frascos transparentes e pílulas. O token antigo `--serif` permanece como compatibilidade para os componentes existentes e aponta para a família principal. Códigos de sessão mantêm sua apresentação de código.

As fontes referenciadas antes somavam 219.752 bytes (cinco TTF); os quatro WOFF2 atuais somam 77.116 bytes. Os originais foram preservados. O peso regular é pré-carregado nos pontos de entrada do aplicativo. Não foi adicionada uma segunda biblioteca de fontes.

| Uso | Tempo configurado |
| --- | --- |
| Cor, fundo e borda de um controle | 120 ms |
| Resposta de favorito/seguir e pressão | 160 ms |
| Atualização de resultados e conteúdo local | 180 ms |
| Entrada de página ou janela | 240 ms |
| Fechamento de janela | 140 ms |
| Barras do gráfico | 280 ms, atraso limitado a 75 ms |

Animações usam opacidade e transformações. O vidro é estático: 16 px no desktop e 12 px no mobile; a janela usa uma camada de fundo sem animar blur. Não há observador de revelação para dezenas de cartões nem `will-change` permanente. Digitar não reinicia uma animação de página. Imagens mantêm seus contêineres reservados e versões responsivas; não foi adicionado carregamento artificial a operações locais imediatas.

`prefers-reduced-motion` desativa efeitos e transições. A alteração dessa preferência cancela animações ativas e conclui um fechamento pendente com segurança. Rolagem suave é aplicada aos links de seção; foco, retorno e histórico usam posicionamento imediato.

## Componentes e estados

| Componente | Estados e comportamento |
| --- | --- |
| Ações em pílulas | Normal, hover apenas em ponteiro adequado, pressão, foco visível e desabilitado; sem mudar largura da borda ao selecionar |
| Busca | Campo de 16 px, foco preservado e nenhuma espera artificial |
| Filtros | `details/summary`, acionável por Enter; resumo dos filtros ativos; preferência de abertura mantida durante a sessão |
| Mistura | `aria-pressed` nos seletores; resultados anunciados como status; retirar uma nota retorna foco ao seletor correspondente |
| Janela | Nome derivado do título, Escape, foco no acionador ao fechar, bloqueio da rolagem de fundo e paginação sem voltar ao topo |
| Navegação | Barra mantida; foco no título ao trocar de rota; animação anterior cancelada |
| Fluxo inicial | Foco preservado nas escolhas; título recebe foco ao mudar de etapa; regra das três experiências mantida |

## Verificação

- `npm run check`: sintaxe dos módulos e do novo teste aprovada.
- Suíte existente: 38 cenários aprovados, incluindo os 280 detalhes de perfumes, notas, importação/exportação, prateleira, pessoas, círculo, diário, descoberta e consentimento do Connect.
- `npm run test:motion`: 10 cenários aprovados; uma atualização por busca, identidade dos nós, cursor/foco, filtros, seleção, concorrência de animações, reabertura de janela, movimento reduzido e fluxo inicial.
- [Matriz principal](qa-smooth-matrix.json): 102 verificações, 17 telas × 2 temas × larguras CSS de 312, 390 e 1280 px. Zero transbordamentos na comparação de `scrollWidth` com `clientWidth`, zero fontes antigas nos controles/títulos examinados e zero ocorrências de baixo contraste nos textos elegíveis da última rodada.
- [Apresentação](qa-smooth-presentation.json): 16 verificações, oito cenas × 390/1280 px, sem os problemas verificados acima. Página inicial adicionalmente conferida em 390 px.
- Chrome renderizado: cliques no catálogo/Alquimia e troca de tema, busca de gengibre, combinação com resultados, filtros por Enter, janela de Yuzu, Escape com devolução de foco e movimento reduzido com transições em `0s`.

O zoom existente do navegador foi compensado no viewport de teste; as larguras registradas são as larguras CSS observadas. Os ajustes temporários de viewport e preferência de movimento foram removidos ao concluir.

Os testes de concorrência usam animações controladas no JSDOM, complementados por uso da interface renderizada. Não se afirma uma medição de FPS em aparelhos físicos. A análise automática de contraste exclui fotografias, gradientes e opacidades intermediárias. Não foi executado NVDA/VoiceOver nem o seletor nativo de arquivos; permanecem como validações manuais. Não houve alteração de dados olfativos, autenticação, consentimento ou formato de persistência.

## Arquivos principais

`motion.js/css`: ciclo de movimento e cancelamento. `ui-system.css`: padrões compartilhados. `atelier.js`: tema e Alquimia. `app.js`: busca e diálogo. `catalog-experience.js`: filtros e efeitos locais. `minimal.js`: fluxo inicial. `fonts.css` e quatro WOFF2: tipografia. Pontos de entrada e estilos das apresentações: integração e remoção das fontes conflitantes. `verify-motion.cjs`: regressões de interação.
