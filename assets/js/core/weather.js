'use strict';
/* Clima real (intel, §4.11): Open-Meteo, só depois de um toque do usuário (localização ou cidade).
   Único arquivo que chama fetch ou navigator.geolocation. Cache de 30 min na chave própria; nada na carga da página. */
const Weather={
 TTL:30*60*1000,TIMEOUT:6000,
 state:'idle',inflight:null,
 LABELS:[[[0],'Céu limpo'],[[1],'Poucas nuvens'],[[2],'Parcialmente nublado'],[[3],'Nublado'],[[45,48],'Neblina'],[[51,53,55,56,57],'Garoa'],
  [[61,63,65,66,67],'Chuva'],[[71,73,75,77,85,86],'Neve'],[[80,81,82],'Pancadas de chuva'],[[95,96,99],'Trovoadas']],
 label(code){const c=Number(code);for(const [list,l] of this.LABELS)if(list.includes(c))return l;return 'Tempo variável';},
 key(){return typeof Store!=='undefined'&&Store.weatherKey?Store.weatherKey:'elixir-weather-v1';},
 loc(){return typeof state!=='undefined'&&state&&state.location?state.location:{mode:'none'};},
 read(){try{const raw=localStorage.getItem(this.key());if(!raw)return null;const o=JSON.parse(raw);return o&&typeof o==='object'&&o.data?o:null;}catch(e){return null;}},
 write(o){try{localStorage.setItem(this.key(),JSON.stringify(o));}catch(e){}},
 drop(){try{localStorage.removeItem(this.key());}catch(e){}},
 same(o,L){return !!o&&Number(o.lat).toFixed(2)===Number(L.lat).toFixed(2)&&Number(o.lon).toFixed(2)===Number(L.lon).toFixed(2);},
 /* Leitura atual (mesmo velha: stale:true depois de 30 min). Síncrono. */
 cached(){const L=this.loc();if(!L||L.mode==='none')return null;const o=this.read();if(!o||!this.same(o,L))return null;
  const r={...o.data,name:L.name||o.data.name||'',at:Number(o.at)||0};if(Date.now()-r.at>this.TTL)r.stale=true;return r;},
 status(){const L=this.loc();if(!L||L.mode==='none')return this.state==='denied'?'denied':'none';
  if(this.state==='loading')return 'loading';const c=this.cached();
  if(this.state==='offline')return c?'stale':'offline';if(this.state==='error')return c?'stale':'error';
  if(!c)return 'none';if(c.stale)return 'stale';return this.state==='live'?'live':'cached';},
 online(){return typeof navigator==='undefined'||navigator.onLine!==false;},
 async fetchJSON(url){const ctl=typeof AbortController!=='undefined'?new AbortController():null;const t=setTimeout(()=>ctl&&ctl.abort(),this.TIMEOUT);
  try{const r=await fetch(url,{signal:ctl?ctl.signal:undefined,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw new Error('http '+r.status);return await r.json();}finally{clearTimeout(t);}},
 /* Validação: números finitos e faixas plausíveis; qualquer outra coisa é erro. */
 parse(j){const c=j&&j.current,d=j&&j.daily;const num=(v,a,b)=>{const n=Number(v);return Number.isFinite(n)&&n>=a&&n<=b?n:null;};
  if(!c)return null;const temp=num(c.temperature_2m,-60,60),feels=num(c.apparent_temperature,-70,70),hum=num(c.relative_humidity_2m,0,100),code=num(c.weather_code,0,99);
  if(temp===null||hum===null||code===null)return null;
  const first=a=>Array.isArray(a)?a[0]:undefined;
  return {temp,feels:feels===null?temp:feels,humidity:hum,code,label:this.label(code),isDay:Number(c.is_day)===1,
   max:num(first(d&&d.temperature_2m_max),-60,60),min:num(first(d&&d.temperature_2m_min),-60,60),rain:num(first(d&&d.precipitation_probability_max),0,100)};},
 after(render){try{if(typeof Select!=='undefined'&&Select.bump)Select.bump();}catch(e){}
  if(render&&typeof route!=='undefined'&&typeof App!=='undefined'&&['today','home'].includes(route.page)){try{App.render();}catch(e){console.warn(e);}}},
 /* Busca o tempo (no máximo uma requisição em voo). null sem local escolhido: nenhuma requisição. */
 get({force=false,render=true}={}){
  const L=this.loc();if(!L||L.mode==='none'||!Number.isFinite(Number(L.lat))||!Number.isFinite(Number(L.lon))){return Promise.resolve(null);}
  const c=this.cached();if(!force&&c&&!c.stale){if(this.state!=='live')this.state='cached';return Promise.resolve(c);}
  if(!this.online()){this.state='offline';return Promise.resolve(null);}
  if(this.inflight)return this.inflight;
  const lat=Number(L.lat).toFixed(2),lon=Number(L.lon).toFixed(2);
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`;
  this.state='loading';
  this.inflight=this.fetchJSON(url).then(j=>{const data=this.parse(j);if(!data){this.state='error';return null;}
    const at=Date.now();this.write({at,lat:Number(lat),lon:Number(lon),data:{...data,name:L.name||''}});this.state='live';this.after(render);return {...data,name:L.name||'',at};})
   .catch(()=>{this.state=this.online()?'error':'offline';return null;})
   .finally(()=>{this.inflight=null;});
  return this.inflight;},
 /* Só a partir de um toque: posição aproximada (2 casas, cerca de 1 km), nunca repetida sozinha. */
 locate(){return new Promise(resolve=>{
  const deny=()=>{this.state='denied';if(typeof toast==='function')toast('Sem acesso à localização. Escolha uma cidade.');resolve(false);};
  if(typeof navigator==='undefined'||!navigator.geolocation){deny();return;}
  try{navigator.geolocation.getCurrentPosition(pos=>{const lat=Math.round(pos.coords.latitude*100)/100,lon=Math.round(pos.coords.longitude*100)/100;
    this.drop();this.state='idle';
    Store.update(s=>{s.location={mode:'geo',name:'Sua localização',lat,lon,consentAt:Date.now()};},{silent:true});
    resolve(true);},()=>deny(),{enableHighAccuracy:false,timeout:8000,maximumAge:1800000});}catch(e){deny();}});},
 /* Busca de cidades (≥2 letras; o chamador espera 300 ms). Rejeita com 'offline' ou 'error'. */
 async search(q){const s=String(q||'').trim();if(s.length<2)return [];
  if(!this.online())throw new Error('offline');
  let j;try{j=await this.fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(s)}&count=5&language=pt&format=json`);}
  catch(e){throw new Error(this.online()?'error':'offline');}
  const list=Array.isArray(j&&j.results)?j.results:[];
  return list.map(r=>({name:String(r.name||'').slice(0,60),region:String(r.admin1||'').slice(0,60),country:String(r.country||'').slice(0,60),lat:Number(r.latitude),lon:Number(r.longitude)}))
   .filter(r=>r.name&&Number.isFinite(r.lat)&&Number.isFinite(r.lon)&&Math.abs(r.lat)<=90&&Math.abs(r.lon)<=180);},
 setCity({name,lat,lon}={},{render=true}={}){const la=Math.round(Number(lat)*100)/100,lo=Math.round(Number(lon)*100)/100;if(!Number.isFinite(la)||!Number.isFinite(lo))return Promise.resolve(null);
  this.drop();this.state='idle';
  Store.update(s=>{s.location={mode:'city',name:String(name||'').slice(0,60),lat:la,lon:lo,consentAt:Date.now()};s.context.city=String(name||s.context.city).slice(0,60);},{silent:true});
  return this.get({force:true,render});},
 forget(){this.drop();this.state='idle';this.inflight=null;
  if(typeof Store!=='undefined')Store.update(s=>{s.location={mode:'none',name:'',lat:null,lon:null,consentAt:0};},{silent:true});
  try{if(typeof Select!=='undefined')Select.bump();}catch(e){}}
};
