/* Duas identidades sobre o mesmo produto. Preferências pessoais são preservadas. */
const BRAND = document.documentElement.dataset.brand === 'assinatura'
  ? {id:'assinatura',name:'ASSINATURA',monogram:'a.',accent:'#b79b73',tagline:'SEU GOSTO, POR EXTENSO.',app:'assinatura.html',presentation:'assinatura-apresentacao.html'}
  : {id:'elixir',name:'ELIXIR',monogram:'e.',accent:'#8ea58c',tagline:'A ESSÊNCIA DAS AFINIDADES',app:'elixir.html',presentation:'elixir-apresentacao.html'};
document.documentElement.dataset.brand=BRAND.id;
