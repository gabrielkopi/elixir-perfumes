# Ateliê de perfil · Elixir

Editor React para criar um card com retrato, identidade visual e as três notas olfativas mais usadas.

## Rodar localmente

    npm ci
    npm run dev

Use Node.js 22.12 ou mais recente. Execute **npm run build** para gerar a versão estática. O GitHub Pages do Elixir serve o build em **Perfil/dist/**.

## Dados e imagens

- **Neste ateliê** usa os registros de uso editados no próprio card. A família aplica uma combinação inicial de notas e uma paleta.
- **Meu Elixir** acompanha as notas da conta aberta no Elixir. Prioriza as notas dos perfumes usados no diário e complementa com o mapa, as avaliações e as preferências. Funciona quando o editor e o Elixir estão na mesma origem.
- Retratos e rascunhos ficam no navegador. O recorte automático usa o modelo Selfie Segmenter do MediaPipe, carregado ao usar a ferramenta pela primeira vez. O pincel refina o recorte manualmente.
- O selo é um elemento gráfico do card. A exportação gera um PNG com 1.800 px de largura, no formato selecionado.
- Os seis retratos de exemplo vieram do portfólio fornecido. As nove gravuras foram criadas com ImageGen a partir do pedido de uma folha 3 × 3 de desenhos botânicos a tinta sobre branco, sem letras. Cada desenho foi recortado como PNG transparente em **public/notes/**.
