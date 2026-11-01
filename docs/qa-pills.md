# Testes da edição Pílulas

Verificações automatizadas: 30 cenários com JSDOM, incluindo 280 detalhes, arquivos de 267 recortes e respectivas miniaturas, fontes e imagens da biblioteca, preferências, criação de pessoas, círculo, presentes, diário, consentimento/escopo/revogação Connect, cenários com backup, importação/exportação, filtros, paginação e descoberta guiada.

Navegação por cliques no Chrome, usando o armazenamento separado `sandbox=1`: busca, marcas, ordenação, catálogo sem resultados, favoritos, camadas, radar, percepção salva e recarregada, frascos, prateleira personalizada, lote, criação de pessoa com gostos, seguir, círculo, presentes, diário, curtidas, comentário reaberto, salvos, Connect, notas, alquimia, contexto de uso, comparação, edição de perfil e cinco etapas da descoberta. Nenhuma mensagem foi enviada a pessoas reais.

Mobile: nove áreas verificadas em viewport efetivo de 312 px, sem rolagem horizontal. Seleção de nota testada com Enter e pílula de 66 px de altura. Verificação de tema claro/escuro e ações de 44 px ou mais. Movimento reduzido exercitado na suíte automatizada.

Correções: paginação para alcançar todos os resultados da alquimia e da janela de notas; resultados quando há somente exclusões; remoção de contradição ao escolher uma nota antes excluída; pílulas em ações, filtros e descoberta; notas em pílulas horizontais responsivas.

Limites: aplicação local demonstrativa, sem backend ou contas reais. Testes de arquivos de importação e round trip feitos na suíte; seleção de arquivo pelo diálogo nativo não foi automatizada. Incluídas 12 ilustrações adicionais verificadas, totalizando 62 artes de notas em alta definição. A geração das demais notas ainda está incompleta. A prioridade de imagens exatas sobre aproximações foi corrigida; jasmim-manga e âmbar cinzento não reutilizam imagens de manga e resina de âmbar. A busca por figo da WePink e suas variantes tem cobertura de regressão.
