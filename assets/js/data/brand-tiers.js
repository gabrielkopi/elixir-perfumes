'use strict';
/* Faixas de marca (editorial, por marca, não por preço): 1 Acessível · 2 Intermediária · 3 Premium · 4 Nicho.
   Sem dependências e sem trabalho no carregamento além de declarar (compatível com a apresentação e os testes VM). */
const TIER_LABELS=['','Acessível','Intermediária','Premium','Nicho'];
const NATIONAL_BRANDS=['Natura','O Boticário','Granado','Eudora','Jequiti'];
const BRAND_TIERS=(()=>{const out={},put=(t,list)=>{for(const b of list)out[b]=t;};
 put(1,['Natura','O Boticário','Eudora','Jequiti','Avon','Paris Elysees']);
 put(2,['Granado','Lattafa','Armaf','Afnan','Al Wataniah','Rayhaan','Bidaya','Mawwal','Primacial','French Avenue','Khadlaj','LAB 8','Rasasi','Banderas',
  'Paris Corner','Maison Asrar','Ferassa','Aurora','Davidoff','Nautica','Benetton','Joop!','Tommy Hilfiger']);
 put(3,['Carolina Herrera','Jean Paul Gaultier','Rabanne','Paco Rabanne','Giorgio Armani','Armani','Versace','Dolce & Gabbana','Ralph Lauren','Hugo Boss','Azzaro','Prada',
  'Calvin Klein','Lancôme','Yves Saint Laurent','Montblanc','Issey Miyake','Bvlgari','Viktor&Rolf','Guerlain','Dior','Chanel','Hermès','Marc Jacobs','Chloé','Mugler',
  'Gucci','Lacoste','Moschino','Mercedes-Benz','Givenchy','Burberry']);
 put(4,['Le Labo','Byredo','Diptyque','Aesop','Tom Ford Private','Tom Ford','Maison Francis Kurkdjian','Parfums de Marly','Creed','Xerjoff','Sospiro','Hermessence']);
 return out;})();
