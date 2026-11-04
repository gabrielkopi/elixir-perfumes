'use strict';
/* Notas olfativas (matérias-primas e acordes) e famílias. */
const INGREDIENTS=[
['bergamota','Bergamota','Cítrica, fresca e levemente floral.'],['limao-siciliano','Limão-siciliano','Cítrico, vibrante e ácido.'],['laranja-doce','Laranja-doce','Cítrica, doce e suculenta.'],['grapefruit','Grapefruit','Cítrico, amargo e refrescante.'],['mandarina','Mandarina','Cítrica, doce e delicada.'],['petitgrain','Petitgrain','Verde, cítrico e amadeirado.'],
['rosa','Rosa','Floral, romântica e levemente adocicada.'],['jasmim','Jasmim','Floral branco, intenso e sensual.'],['ylang-ylang','Ylang-ylang','Floral, cremoso e exótico.'],['neroli','Neroli','Floral cítrico, fresco e elegante.'],['lavanda','Lavanda','Aromática, limpa e herbal.'],['geranio','Gerânio','Floral verde, com nuances de rosa.'],
['sandalo','Sândalo','Amadeirado, cremoso e suave.'],['cedro','Cedro','Seco, amadeirado e elegante.'],['vetiver','Vetiver','Terroso, amadeirado e esfumaçado.'],['patchouli','Patchouli','Terroso, úmido e amadeirado.'],['oud','Oud','Amadeirado, resinoso e animalizado.'],['guaiaco','Guaiaco','Amadeirado, esfumaçado e balsâmico.'],
['baunilha','Baunilha','Doce, cremosa e aconchegante.'],['fava-tonka','Fava-tonka','Amendoada, doce e semelhante à baunilha.'],['benjoim','Benjoim','Balsâmico, adocicado e resinoso.'],['cacau','Cacau','Achocolatado, amargo e gourmand.'],['caramelo','Caramelo','Doce, açucarado e cremoso.'],['mel','Mel','Doce, quente e encorpado.'],
['canela','Canela','Quente, doce e especiada.'],['cardamomo','Cardamomo','Especiado, fresco e aromático.'],['pimenta-rosa','Pimenta-rosa','Especiada, fresca e levemente frutada.'],['acafrao','Açafrão','Especiado, seco e sofisticado.'],['olibano','Olíbano','Resinoso, incensado e levemente cítrico.'],['mirra','Mirra','Resinoso, balsâmico e amargo.']
].map(([id,name,description],i)=>({id,name,description,family:Math.floor(i/6),image:'assets/ingredients/'+id+'.png'}));
INGREDIENTS.push(...[
 ['whiskey','Whiskey','Licoroso, amadeirado e quente, com nuances de carvalho.',5],
 ['tabaco','Tabaco','Seco, quente e levemente adocicado.',5],
 ['noz-moscada','Noz-moscada','Quente, seca e especiada.',4],
 ['terroso','Terroso','Terra úmida, húmus e nuances minerais.',6]
].map(([id,name,description,family])=>({id,name,description,family,image:'assets/ingredients/'+id+'.png'})));
INGREDIENTS.push({id:'ice',name:'Gelo',description:'Acorde imaginativo: frescor gelado, transparente e mineral.',family:7,image:'assets/families/ice.png'},{id:'rain',name:'Chuva',description:'Acorde imaginativo: água sobre pedra e terra molhada.',family:7,image:'assets/families/rain.png'});
const NOTE_GROUPS=['Cítricas e frescas','Florais','Amadeiradas','Doces e balsâmicas','Especiadas e resinosas','Bebidas e tabaco','Terrosas','Acordes imaginativos'];
/* [id, nome, descrição, dimensão do vetor] */
const FAMILIES=[['aquatic','Aquática','Mar, brisa e acordes marinhos.',8],['green','Verde','Folhas, solo e madeira fresca.',1],['citrus','Cítrica','Cascas, sumo e frescor.',0],['floral','Floral','Flores, pétalas e transparência.',5],['woody','Amadeirada','Madeiras, raízes e floresta.',3],['gourmand','Doce','Baunilha, cacau e conforto.',7],['spicy','Especiada','Especiarias quentes e frescas.',10]];
NOTE_CHOICES.push('Gelo','Chuva');
STYLE_CHOICES.push({id:'spicy',label:'Especiados',sub:'Especiarias e calor',d:10});
const noteImage=id=>['whiskey','tabaco','noz-moscada'].includes(id)?'assets/profiles/'+id+'.png':INGREDIENTS.find(n=>n.id===id)?.image;
