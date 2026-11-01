# Verificação final — 1 de novembro de 2026

`npm run check` e `npm test`: **38 cenários aprovados**, zero erros de execução no JSDOM. Inclui renderização dos 280 detalhes de perfumes, navegação por todas as 321 notas agrupadas, preferências, pessoas, prateleiras, diário, presentes, consentimento, importação, busca, alquimia e foco após atualizações.

**405 nomes e variações de notas declaradas, sem imagem ausente.** Biblioteca com 261 ilustrações em alta definição e 783 arquivos WebP responsivos, todos decodificados e verificados com transparência. Tamanhos reais: 256, 640 e 1254 px; miniaturas nas pílulas, arquivos maiores nos detalhes. Recuperados 42 originais que haviam sido reduzidos, sem ampliar os arquivos pequenos e sem apagar os PNGs originais.

O lote principal de 154 pedidos foi concluído; quatro referências de folhas/flores e uma correção de Ishipink foram geradas adicionalmente. Plumeria e jasmim-manga compartilham a referência aprovada. Variantes relacionadas podem compartilhar ilustração.

Revisão no navegador: 17 telas e exemplos de detalhes, dois temas e larguras de 312, 390 e 1280 px, totalizando 102 verificações sem transbordamento horizontal ou ocorrência de baixo contraste no cálculo dos textos elegíveis. Janela de notas a 312 px sem rolagem horizontal; Escape devolve o foco ao acionador. Densidade 3× a 390 px confirmou o carregamento da versão de 1254 px. Testados também acordeões por Enter, estados vazios, limpeza com retorno do foco, notas clicáveis do radar e janela de fragrância nos dois temas.

Limites e método estão em [qa-polish.md](qa-polish.md). Testes anteriores de cliques e fluxos estão em [qa-pills.md](qa-pills.md). A seleção de arquivo pelo diálogo nativo e leitores de tela NVDA/VoiceOver não foram automatizados. Aplicação demonstrativa com dados pessoais salvos neste navegador.

Relatórios: [imagens](qa-note-images.json), [matriz de telas](qa-polish-matrix.json), [prompts](note-art-generation.json) e [correções visuais](note-art-corrections.md).
