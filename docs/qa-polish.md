# Revisão visual e de acessibilidade — ELIXIR

Data: 1 de novembro de 2026. Referência: WCAG 2.1 AA, com alvos de 44 px como prática adicional. Revisão de engenharia e design, sem certificação de conformidade.

## Impressão e prioridades de design

A tipografia editorial, a paleta natural e as pílulas sustentam a identidade. Os maiores problemas eram cartões claros no tema escuro, texto secundário apagado e a galeria de famílias antes da busca de notas. Foram corrigidos preservando a estrutura e os dados existentes.

| Dimensão | Achado | Ajuste realizado |
|---|---|---|
| Hierarquia | A busca ficava depois de sete cartões de famílias | Busca e título primeiro; famílias em acordeão nativo |
| Consistência | Fundos brancos em notas e fotografias sobre o tema escuro | Superfícies semânticas, cantos suaves e frascos/ingredientes transparentes |
| Nitidez | Fontes antigas de 256 px ampliadas nos detalhes | Originais recuperados, miniaturas e versões responsivas de até 1254 px |
| Usabilidade | Busca vazia sem saída clara e botão de paginação sem resultados restantes | Contagem anunciada, estado vazio e ações para limpar |
| Dados visuais | Radar montava caminhos de imagem a partir do ID | Usa o caminho real do ativo; notas recorrentes em pílulas clicáveis |

## Auditoria: achados agrupados

Oito grupos tratados: dois críticos de contraste, quatro relevantes de legibilidade/operação/estado e dois menores de feedback/toque.

| Grupo | Critério | Gravidade | Correção |
|---|---|---|---|
| Texto claro sobre cartões claros no dark | 1.4.3 | Crítico | Superfícies escuras coerentes em Pessoas, Círculo, Connect, cenários e janelas |
| Estado selecionado e navegação escura ilegíveis | 1.4.3 | Crítico | Contraste de abas, ações, rótulos e navegação |
| Legendas apagadas no claro | 1.4.3 | Relevante | Cores secundárias com contraste adequado em fundos medidos |
| Foco perdido após renderização | 2.4.3, 2.4.7 | Relevante | Preserva controle por seus atributos; foco no título ao mudar de rota; indicador visível |
| Seção anterior marcada na navegação | 4.1.2 | Relevante | Atualização de aria-current nas rotas, incluindo Alquimia |
| Modo do radar apenas visual | 4.1.2 | Relevante | aria-pressed informa o modo; imagens apontam para arquivos reais |
| Busca sem retorno anunciado | 4.1.3 | Menor | Contagem em status e limpeza com retorno do foco |
| Controles desconfortáveis no mobile | Boa prática; 2.5.5 é AAA | Menor | Alvos principais de 44 px, entradas de 16 px e ações que se acomodam na largura |

## Contraste representativo

| Elemento | Primeiro plano | Fundo | Razão | Referência | Resultado |
|---|---|---|---|---|---|
| Texto claro | #56654f | #fcfcfb | 6.07:1 | 4.5:1 | Passa |
| Texto em cartão escuro | #b2bdaf | #1d2922 | 7.75:1 | 4.5:1 | Passa |
| Controle selecionado escuro | #17251c | #c0d1b1 | 9.86:1 | 4.5:1 | Passa |
| Foco no claro | #426142 | #fcfcfb | 6.77:1 | 3:1 | Passa |

A matriz final contém 102 verificações: 17 telas/exemplos × 2 temas × 3 larguras (312, 390 e 1280 px). Nenhuma ocorrência de baixo contraste nos textos elegíveis nem transbordamento horizontal foi detectada na última rodada. Fundos de fotografias/gradientes e opacidades intermediárias de animação não entram no cálculo automático. Legendas sobre fotos receberam fundo suficientemente opaco e foram inspecionadas separadamente.

## Teclado e componentes

| Componente | Verificação |
|---|---|
| Busca | Limpar devolve o foco ao campo e preserva a mistura |
| Acordeão de famílias | Enter abre/fecha; foco visível |
| Janela de notas | Escape fecha e restaura o acionador; largura de 312 px sem estouro |
| Navegação | Título recebe foco ao mudar de rota; seção atual exposta |
| Favorito e tema | Atualização na mesma página preserva o controle focado |
| Notas do radar | Pílulas abrem os perfumes com a nota |
| Imagens | Miniatura confirmada na lista; versão de 1254 px confirmada com densidade 3× |

## Limites

A árvore acessível, nomes/estados de controles e navegação por teclado foram inspecionados. Não foi executada uma sessão com NVDA ou VoiceOver; não se afirma teste de fala desses leitores. A seleção de arquivos pelo diálogo nativo permanece fora da automação. Os testes exercitam os fluxos descritos, sem garantir todas as combinações possíveis de dados importados ou navegadores.

Implementação: [polish.css](../assets/polish.css), [motion.js](../assets/motion.js), [families.js](../assets/families.js), [atelier.js](../assets/atelier.js). Relatórios: [matriz](qa-polish-matrix.json), [imagens](qa-note-images.json).
