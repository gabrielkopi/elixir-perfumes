'use strict';
/* Regras de personalização do perfil (§6): a pessoa escolhe entre tokens, nunca define um token. */
const PROFILE_RULES={
 giftSite:'https://gabrielkopi.github.io/presente/',
 limits:{name:[2,32],handle:[3,20],bio:150,bioLines:3,link:100,pinned:5,families:3,tags:3,photoKB:200},
 covers:Object.fromEntries([['forest','Floresta'],['sea','Mar'],['night','Noite'],['flowers','Flores'],['city','Cidade'],['pool','Piscina'],['jazz','Jazz'],['woody','Madeira'],['citrus','Cítrico'],['floral','Floral'],['aquatic','Aquático'],['rain','Chuva']]
  .map(([id,label])=>[id,{id,label,src:'assets/img/covers/'+id+'.webp',src800:'assets/img/covers/'+id+'-800.webp'}])),
 /* Tons: só --card, --card-2 e --signal mudam (valores claros e escuros em base.css). */
 tones:[
  {id:'papel',label:'Papel',light:'#EAEAE6',dark:'#1E1E1E'},
  {id:'grafite',label:'Grafite',light:'#E1E1DE',dark:'#1A1A1A'},
  {id:'marinho',label:'Marinho',light:'#E1E6EC',dark:'#1A2027'},
  {id:'herbal',label:'Herbal',light:'#E2E7DD',dark:'#1C211A'},
  {id:'ambar',label:'Âmbar',light:'#EBE3D6',dark:'#231F1A'},
  {id:'rose',label:'Rosé',light:'#EBE2DF',dark:'#231D1C'}
 ],
 legacyTones:{pedra:'marinho',areia:'ambar',musgo:'herbal',onix:'grafite'},
 styleTags:['Essencial','Clássico','Minimalista','Alfaiataria','Streetwear','Esportivo','Boêmio','Vintage','Romântico','Utilitário'],
 musicTags:['Jazz','MPB','Bossa nova','Samba','Eletrônica','Indie','Rock','Pop','Hip-hop','Soul','Clássica','Lo-fi'],
 sections:['collection','want','reviews','dna','diary']
};

const ProfileRules={
 defaults(){return {name:'Gabriel',handle:'gabriel',bio:'',photo:'',photoBW:false,avatarVibe:'',cover:'none',tone:'papel',signature:null,pinned:[],families:[],
  styleTags:[],musicTags:[],link:'',sections:{collection:true,want:true,reviews:true,dna:true,diary:true}};},
 fold(s){return String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();},
 /* Nome: NFC, sem emoji, símbolos ou controles, espaços colapsados, 2–32 caracteres. */
 cleanName(s){let v=String(s??'').normalize('NFC');try{v=v.replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu,'');}catch(e){}
  return v.replace(/[\u0000-\u001F\u007F-\u009F<>{}[\]\\|^~`$#@*_=+]/g,'').replace(/\s+/g,' ').trim().slice(0,PROFILE_RULES.limits.name[1]).trim();},
 cleanHandle(s){return String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/^@/,'').replace(/[^a-z0-9._]/g,'').slice(0,PROFILE_RULES.limits.handle[1]);},
 validHandle(h){return /^[a-z0-9._]{3,20}$/.test(h)&&!/^\.|\.$/.test(h);},
 /* Bio: texto puro, ≤150 caracteres e ≤3 linhas. */
 cleanBio(s){const lines=String(s??'').normalize('NFC').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g,'').split('\n');
  return (lines.slice(0,PROFILE_RULES.limits.bioLines).join('\n')).slice(0,PROFILE_RULES.limits.bio).trim();},
 cleanLink(s){const v=String(s??'').trim();if(!v)return '';if(v.length>PROFILE_RULES.limits.link)return '';
  try{const u=new URL(v);return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password?v:'';}catch(e){return '';}},
 handleTaken(h,own=''){if(!h||h===own)return false;try{return typeof People!=='undefined'&&People.handles?People.handles().map(x=>String(x).toLowerCase()).includes(h):false;}catch(e){return false;}},
 tone(id){return PROFILE_RULES.tones.find(t=>t.id===id)||PROFILE_RULES.tones[0];},
 cleanTone(id){const v=PROFILE_RULES.legacyTones[id]||id;return PROFILE_RULES.tones.some(t=>t.id===v)?v:'papel';},
 /* Capa resolvida para desenhar: none, image (uma das 12) ou signature (plate do perfume assinatura). */
 coverOf(p){const c=p&&p.cover;if(c==='signature'&&p.signature&&typeof byId==='function'&&byId(p.signature))return {kind:'signature',perfume:byId(p.signature)};
  if(c&&PROFILE_RULES.covers[c])return {kind:'image',...PROFILE_RULES.covers[c]};return {kind:'none'};},
 /* Erros de edição por campo (texto pt-BR), validados no blur e ao salvar. */
 validate(d,{ownHandle=''}={}){const e={},L=PROFILE_RULES.limits;
  const name=this.cleanName(d.name);if(name.length<L.name[0])e.name='Use de 2 a 32 caracteres.';
  const h=String(d.handle??'');if(!this.validHandle(h))e.handle='Use de 3 a 20 letras minúsculas, números, ponto ou _.';else if(this.handleTaken(h,ownHandle))e.handle='Este @ já está em uso';
  const bio=String(d.bio??'');if(bio.length>L.bio)e.bio='Use até 150 caracteres.';else if(bio.split('\n').length>L.bioLines)e.bio='Use até 3 linhas.';
  if(d.link&&!this.cleanLink(d.link))e.link='Use um endereço que comece com https://';
  return e;},
 /* Toda leitura e gravação passa por aqui: valores fora das regras voltam ao padrão. */
 sanitize(p){const d=this.defaults(),o=p&&typeof p==='object'?p:{},L=PROFILE_RULES.limits;
  const name=this.cleanName(o.name);d.name=name.length>=L.name[0]?name:'Gabriel';
  const h=this.cleanHandle(o.handle);d.handle=this.validHandle(h)?h:'gabriel';
  if(d.name==='Você'&&(d.handle==='voce'||d.handle==='gabriel')){d.name='Gabriel';d.handle='gabriel';}
  if(d.handle==='voce'&&d.name==='Gabriel')d.handle='gabriel';
  d.bio=this.cleanBio(o.bio);d.link=this.cleanLink(o.link);
  d.photo=typeof o.photo==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(o.photo)&&o.photo.length<=L.photoKB*1024*1.37?o.photo:'';
  d.photoBW=o.photoBW===true;
  d.avatarVibe=PROFILE_RULES.covers[o.avatarVibe]?o.avatarVibe:'';
  d.tone=this.cleanTone(o.tone);
  const valid=id=>typeof id==='string'&&typeof byId==='function'&&!!byId(id);
  d.signature=valid(o.signature)?byId(o.signature).id:null;
  d.cover=o.cover==='signature'?(d.signature?'signature':'none'):(PROFILE_RULES.covers[o.cover]?o.cover:'none');
  d.pinned=[...new Set((Array.isArray(o.pinned)?o.pinned:[]).filter(valid).map(id=>byId(id).id))].slice(0,L.pinned);
  const fam=typeof FAMILIES!=='undefined'?FAMILIES.map(f=>f[0]):[];
  d.families=[...new Set((Array.isArray(o.families)?o.families:[]).filter(id=>fam.includes(id)))].slice(0,L.families);
  d.styleTags=[...new Set((Array.isArray(o.styleTags)?o.styleTags:[]).filter(t=>PROFILE_RULES.styleTags.includes(t)))].slice(0,L.tags);
  d.musicTags=[...new Set((Array.isArray(o.musicTags)?o.musicTags:[]).filter(t=>PROFILE_RULES.musicTags.includes(t)))].slice(0,L.tags);
  const sec=o.sections&&typeof o.sections==='object'?o.sections:{};for(const k of PROFILE_RULES.sections)d.sections[k]=sec[k]!==false;
  return d;},
 /* Converte texto livre (ex.: 'Jazz & MPB') nas tags conhecidas, sem acento e sem caixa. */
 matchTags(text,list){const f=this.fold(text);if(!f)return [];return list.filter(t=>f.includes(this.fold(t))).slice(0,PROFILE_RULES.limits.tags);}
};
