# Verificação final — 1 de novembro de 2026

`npm run check` e `npm test`: 30 cenários aprovados, zero erros de execução no JSDOM. Cobertura inclui todos os 280 detalhes de perfumes, 267 recortes e miniaturas, 62 artes de notas, rotas, preferências, pessoas, prateleiras, diário, presentes, consentimento, importação, busca e alquimia.

Correção adicional: correspondências exatas de imagens têm prioridade sobre nomes genéricos; variantes botânicas distintas não usam imagens incorretas. Integração das 12 imagens já geradas e verificadas, preservando PNGs originais fora do repositório.

Testes anteriores por cliques e mobile estão registrados em qa-pills.md. Nesta etapa final a conexão do Chrome não estava disponível para repetir os cliques ou mesclar a publicação. A revisão será entregue em PR. A geração completa das notas restantes permanece pendente.
