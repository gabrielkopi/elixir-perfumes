export const media = (file) => `./studio/media/${file}`;

export const profiles = {
  vincenzo: {
    name: 'Vincenzo Saggio', handle: 'vincenzosaggio', image: 'vincenzo.webp',
    role: 'Estilo & perfumaria', bio: 'Alfaiataria de outra época. Discos que ficam. Perfumes com história.',
    notes: [['Whiskey', 'whiskey.webp'], ['Tabaco', 'tabaco.webp'], ['Noz-moscada', 'noz-moscada.webp']],
    picks: ['tom-ford-tobacco-vanille', 'maison-margiela-jazz-club', 'tom-ford-oud-wood'],
  },
  sofia: {
    name: 'Sofia Almeida', handle: 'sofia.almeida', image: 'sofia.webp',
    role: 'Verde & botânico', bio: 'Chá sem pressa, janelas abertas e o cheiro da mata depois da chuva.',
    notes: [['Folhas verdes', 'family-green.webp'], ['Bergamota', 'family-citrus.webp'], ['Notas aquosas', 'family-aquatic.webp']],
    picks: ['arbo-atlantica', 'arbo', 'o-boticario-arbo-botanic-deo-colonia'],
  },
  mateo: {
    name: 'Mateo Reis', handle: 'mateo.reis', image: 'mateo.webp',
    role: 'Madeiras & especiarias', bio: 'Gosto de perfumes que parecem habitar o tecido de um casaco.',
    notes: [['Sândalo', 'family-woody.webp'], ['Tabaco', 'tabaco.webp'], ['Cardamomo', 'family-spicy.webp']],
    picks: ['boticario-zaad-santal', 'tom-ford-oud-wood', 'maison-margiela-jazz-club'],
  },
  clara: {
    name: 'Clara Azevedo', handle: 'clara.azevedo', image: 'clara.webp',
    role: 'Cítricos & florais', bio: 'Na dúvida, bergamota. De manhã, de tarde e antes de sair.',
    notes: [['Bergamota', 'family-citrus.webp'], ['Jasmim', 'family-floral.webp'], ['Chá verde', 'family-green.webp']],
    picks: ['insensatez', 'clash', 'o-boticario-arbo-puro-deo-colonia'],
  },
};

export const posts = [
  { id: 'mata', author: 'sofia', image: 'arbo-editorial.webp', perfume: 'arbo', title: 'O verde tem muitas formas.', text: 'Abri a janela depois da chuva e lembrei do Arbo. Tem algo nesse encontro de folhas e ar frio que me faz voltar a ele.', tone: '#27372c' },
  { id: 'santal', author: 'mateo', image: 'santal-editorial.webp', perfume: 'santal', title: 'Madeira para dias lentos.', text: 'Sândalo me chama a atenção quando aparece desse jeito, macio, aos poucos. É o tipo de perfume que prefiro descobrir na pele.', tone: '#85735e' },
  { id: 'clash', author: 'clara', image: 'clash-editorial.webp', perfume: 'clash', title: 'Um jeito de começar de novo.', text: 'Clash é o que pego quando quero sair cedo e deixar o resto do dia em aberto.', tone: '#546069' },
];

export const featured = [
  'arbo-atlantica', 'insensatez', 'boticario-zaad-santal',
  'tom-ford-tobacco-vanille', 'maison-margiela-jazz-club', 'tom-ford-oud-wood',
];

export const families = [
  { id: 'aquatic', name: 'Aquática', color: '#dbe4e5', words: 'Mar, brisa e frescor', search: 'aquático', notes: ['Notas aquosas', 'Notas marinhas'] },
  { id: 'green', name: 'Verde', color: '#dfe5d9', words: 'Folhas e ervas frescas', search: 'verde', notes: ['Chá verde', 'Gálbano', 'Hortelã', 'Sálvia'] },
  { id: 'woody', name: 'Amadeirada', color: '#e8ded3', words: 'Madeiras e raízes', search: 'amadeirado', notes: ['Cedro', 'Sândalo', 'Vetiver', 'Oud'] },
  { id: 'citrus', name: 'Cítrica', color: '#f2e8c9', words: 'Cascas e sumos', search: 'cítrico', notes: ['Bergamota', 'Limão', 'Mandarina', 'Tangerina'] },
  { id: 'floral', name: 'Floral', color: '#eddee2', words: 'Pétalas e buquês', search: 'floral', notes: ['Jasmim', 'Rosa', 'Violeta', 'Lírio-do-vale'] },
  { id: 'gourmand', name: 'Gourmand', color: '#eddecd', words: 'Conforto e doçura', search: 'gourmand', notes: ['Baunilha', 'Café', 'Caramelo', 'Fava tonka'] },
  { id: 'spicy', name: 'Especiada', color: '#eddfce', words: 'Calor e contraste', search: 'especiado', notes: ['Cardamomo', 'Canela', 'Noz-moscada', 'Pimenta'] },
];

export const tour = [
  { title: 'Seja bem-vindo ao elixir.', text: 'Um espaço para descobrir o que você gosta de sentir.', page: 'inicio', link: 'Ir para o início' },
  { title: 'Descubra pelo cheiro.', text: 'Busque por perfume, marca, nota ou acorde e abra a ficha para explorar a composição.', page: 'explorar', link: 'Abrir o catálogo' },
  { title: 'Encontre novas referências.', text: 'Veja o que cada perfil está usando e salve as descobertas que chamarem sua atenção.', page: 'comunidade', link: 'Ver a comunidade' },
  { title: 'Monte sua própria estante.', text: 'Toque no ícone de salvar de qualquer perfume para reencontrá-lo na sua coleção.', page: 'colecao', link: 'Abrir minha coleção' },
];

export const normalize = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\bwhiskey\b/g, 'whisky').trim();
