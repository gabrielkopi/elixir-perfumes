# ELIXIR — edição de testes ampliada

Aplicativo: https://gabrielkopi.github.io/elixir-perfumes/elixir.html#lab

Esta edição mantém o catálogo e a identidade visual existentes e acrescenta experiências locais interativas. Ela não cria contas reais, não envia mensagens e não sincroniza dispositivos.

## O que mudou

- **44 notas e acordes**: oito novas ilustrações geradas com IA — íris, figo, coco, café, chá verde, musgo de carvalho, pera e cassis. Os arquivos WebP têm transparência e somam aproximadamente 580 KB. Prompts e metadados estão em `assets/studio/generation.json`.
- **Prateleira**: seleção de vários perfumes, listas próprias, criação, renomeação e exclusão de prateleiras; registro independente de possuir, ter tido, experimentar, desejar e favoritar. Anotações privadas, tamanho do frasco e quantidade restante são opcionais.
- **Pessoas**: 12 perfis demonstrativos; seguir, visitar e criar novos perfis fictícios com perfumes e notas escolhidos. Os oito novos avatares usam iniciais ilustradas.
- **Meu círculo**: adicionar, editar e remover pessoas próximas; registrar referências, notas, aniversário opcional, orçamento e observações privadas. Ideias de presentes podem ser guardadas sem revelar uma surpresa a ninguém.
- **Fora da bolha**: sugestões familiares, de transição e mais diferentes, com metodologia explícita e feedback que atualiza as próximas descobertas.
- **Usar hoje**: sugestões entre os perfumes marcados como possuídos, com ocasião, horário e presença escolhidos manualmente.
- **Diário olfativo**: registros de uso com data, momento e observações; edição e exclusão. Usar um perfume marca experimentação, sem presumir posse ou gosto positivo.
- **Connect**: simulação no mesmo aparelho das visões Cliente e Atendente; autorização explícita por campo, catálogos O Boticário/Natura/multimarcas, expiração em cinco minutos e revogação. Não há QR Code, conexão entre contas ou autorização no servidor nesta edição.
- **Laboratório**: três cenários opcionais, cópia anterior à troca, restauração, exportação e importação de dados validados. É possível desfazer a última alteração durante a sessão.
- **Mobile**: navegação inferior com cinco destinos, atalhos horizontais, formulários com controles maiores, grades adaptadas, modais com altura limitada à tela e respeito à área segura do aparelho.

## Roteiro de testes

1. Abra **Mais → Laboratório** e escolha um cenário. Confirme a troca depois de ler o aviso sobre a cópia anterior.
2. Na prateleira, marque um perfume como **Possuo** e depois **Não gostei**. Verifique que a posse continua marcada.
3. Selecione dois perfumes, crie uma prateleira e adicione a seleção a ela. Edite uma anotação e a quantidade restante.
4. Em **Pessoas**, siga um perfil e crie outro com perfumes escolhidos. Volte à comunidade e teste curtidas, comentários e publicações salvas.
5. No círculo, adicione uma pessoa com preferências próprias. Guarde uma ideia de presente; preço e disponibilidade precisam ser confirmados fora do aplicativo.
6. Em **Fora da bolha**, alterne os três níveis e registre feedback. A rejeição retira a fragrância das próximas sugestões desse painel.
7. Em **Usar hoje**, mude ocasião e horário; registre o uso de uma das opções. Confira o diário e edite essa memória.
8. No Connect, inicie uma sessão e mude para Atendente antes de autorizar. Nenhuma preferência deve aparecer. Volte ao Cliente, autorize somente notas favoritas e selecione Natura. Apenas essas notas e esse catálogo devem aparecer.
9. Encerre a sessão: a visão compartilhada deve desaparecer. Uma sessão vencida também não retorna dados.
10. Exporte seus dados, teste outro cenário e restaure a cópia anterior. Na importação, autorizações Connect são descartadas; fotos externas e publicações antigas não são importadas.

## Limites importantes do teste

Os dados ficam no LocalStorage da origem atual. Meu círculo, anotações e diário não entram na visão Connect. A exportação pessoal pode conter informações privadas: guarde o arquivo de forma apropriada.

Os perfis e relatos da comunidade são fictícios. Os catálogos demonstrativos não indicam parceria, preço, estoque ou tester. Recomendações são regras editoriais explicáveis, sem promessa de satisfação. As imagens representam notas, sem comprovar composição ou identificação botânica.

## Verificação técnica

Com Node 24.15 ou superior:

```sh
npm ci
npm run check
npm test
```

Os 13 testes exercitam os eventos dos formulários e botões com o renderer real de navegação. Verificam independência entre posse e gosto, seleção em lote, perfis editáveis, círculo privado, diário, consentimento e escopo do Connect, expiração e revogação, feedback, cópia/restauração de cenários e importação sem autorizações herdadas. O ambiente DOM de teste não comprova layout visual; a revisão móvel em navegador é uma etapa separada.

O site continua estático. JSDOM é dependência apenas de desenvolvimento, sem uso no navegador nem na imagem de produção.
