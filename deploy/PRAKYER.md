# ELIXIR — publicação e container

O ELIXIR é um consultor olfativo pessoal: ajuda a conhecer o próprio gosto, registrar experiências e descobrir fragrâncias. A proposta é evoluir por etapas, preservando a identidade visual atual.

## Publicação atual

Este repositório é uma cópia do projeto existente, criada na conta gabrielkopi. Inclui o simulador completo, catálogo, imagens e configurações de container. Por decisão do proprietário, a implantação no servidor da Prakyer foi adiada. Nenhuma alteração de DNS ou de servidor foi realizada.

O protótipo usa HTML, CSS e JavaScript, com armazenamento local no navegador. Não há contas reais ou sincronização entre aparelhos. ELIXIR Connect, QR Code autorizado e demais recursos do plano mestre continuam sendo evoluções futuras.

## Executar o container

Na raiz do repositório, em um computador ou servidor com Docker Compose:

```sh
docker compose -p elixir-prakyer config
docker compose -p elixir-prakyer build --pull
docker compose -p elixir-prakyer run --rm --no-deps elixir -t
docker compose -p elixir-prakyer up -d --wait
curl --fail http://127.0.0.1:8087/healthz
curl --fail --output /dev/null http://127.0.0.1:8087/
```

A aplicação fica disponível no próprio servidor em http://127.0.0.1:8087. Se a porta estiver ocupada, definir ELIXIR_PORT e ajustar o proxy para a mesma porta. O container usa usuário sem privilégios, sistema de arquivos somente leitura, diretório temporário em memória e verificação de saúde. Não precisa de banco de dados nesta etapa.

Os arquivos foram conferidos após o envio. A imagem ainda precisa ser construída e executada em um ambiente com Docker; isso não foi validado no ambiente de preparação.

## Futuro domínio da Prakyer

Quando a implantação for retomada, criar um container independente no servidor da Prakyer e publicar em https://elixir.prakyer.com.br, com HTTPS. Apontar o DNS para o servidor e configurar o proxy existente com destino HTTP 127.0.0.1:8087, se ele roda diretamente no host. Se o proxy também roda em Docker, adaptar o Compose à rede compartilhada real e usar elixir:8080 como destino; nesse caso, dispensar a porta publicada no host.

Copiar o código não transfere o LocalStorage entre domínios. Preservar o endereço anterior até tratar uma eventual exportação e importação das preferências.

## Mensagem para o responsável pela implantação futura

O ELIXIR está em https://github.com/gabrielkopi/elixir-perfumes. A ideia é um consultor olfativo pessoal para conhecer preferências e descobrir perfumes. Quando a migração for retomada, copie a versão atual para um container próprio no servidor da Prakyer e publique em https://elixir.prakyer.com.br, com HTTPS. O repositório contém Dockerfile e Compose. Preserve a interface atual e implemente as funcionalidades futuras por etapas.
