'use strict';
/* Clima real (intel, §4.11): Open-Meteo, só depois de um toque do usuário (localização ou cidade).
   Único arquivo que chama fetch ou navigator.geolocation. Cache de 30 min na chave própria; nada na carga da página. */
const Weather={
 TTL:30*60*1000,TIMEOUT:6000,
 state:'idle',inflight:null,
 LABELS:[[[0],'Céu limpo'],[[1],'Poucas nuvens'],[[2],'Parcialmente nublado'],[[3],'Nublado'],[[45,48],'Neblina'],[[51,53,55,56,57],'Garoa'],
  [[61,63,65,66,67],'Chuva'],[[71,73,75,77,85,86],'Neve'],[[80,81,82],'Pancadas de chuva'],[[95,96,99],'Trovoadas']],
 /* Arte animada do tempo (SVG, 64×64). Sol, nuvens, chuva, tempestade, neblina, neve; lua e estrelas à noite. */
 kind(code){const c=Number(code);if(c===0)return 'clear';if(c===1||c===2)return 'partly';if(c===3)return 'cloudy';if(c===45||c===48)return 'fog';
  if([71,73,75,77,85,86].includes(c))return 'snow';if([95,96,99].includes(c))return 'storm';if(c>=51&&c<=82)return 'rain';return 'cloudy';},
 art(code,isDay=true){const k=this.kind(code);
  const cloud=(x,y,s,cls='')=>`<path class="cloud ${cls}" transform="translate(${x} ${y}) scale(${s})" d="M10 26h24a8 8 0 0 0 0-16 11 11 0 0 0-21-3A8.5 8.5 0 0 0 10 26z"/>`;
  const sun=`<circle class="sun-glow" cx="32" cy="32" r="17"/><g class="rays">${[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180,x1=32+Math.cos(r)*17,y1=32+Math.sin(r)*17,x2=32+Math.cos(r)*22,y2=32+Math.sin(r)*22;return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;}).join('')}</g><circle class="sun-core" cx="32" cy="32" r="11"/>`;
  const moon=`<path class="moon" d="M38 14a16 16 0 1 0 12 26A13 13 0 0 1 38 14z"/><circle class="star" cx="14" cy="16" r="1.4"/><circle class="star" cx="22" cy="8" r="1" style="animation-delay:1s"/><circle class="star" cx="10" cy="30" r="1" style="animation-delay:2s"/>`;
  const sky=isDay?sun:moon;
  let body='';
  if(k==='clear')body=sky;
  else if(k==='partly')body=`<g transform="translate(-6 -6) scale(.8)">${sky}</g><g class="drift">${cloud(14,24,1)}</g>`;
  else if(k==='cloudy')body=`<g class="drift slow">${cloud(2,12,.85,'back')}</g><g class="drift">${cloud(12,22,1)}</g>`;
  else if(k==='rain'||k==='storm')body=`<g class="drift">${cloud(6,6,1.05)}</g>${[18,28,38,48].map((x,i)=>`<line class="drop" x1="${x}" y1="42" x2="${x-2}" y2="49" style="animation-delay:${i*.27}s"/>`).join('')}${k==='storm'?'<path class="bolt" d="M33 36l-6 10h5l-3 9 9-12h-5l3-7z"/>':''}`;
  else if(k==='snow')body=`<g class="drift">${cloud(6,6,1.05)}</g>${[18,30,42,24,36].map((x,i)=>`<circle class="flake" cx="${x}" cy="${44+(i%2)*4}" r="1.8" style="animation-delay:${i*.6}s"/>`).join('')}`;
  else if(k==='fog')body=`<g class="drift slow">${cloud(8,4,.9,'back')}</g>${[38,45,52].map((y,i)=>`<line class="fog" x1="${12+i*3}" y1="${y}" x2="${50-i*2}" y2="${y}" style="animation-delay:${i*.8}s"/>`).join('')}`;
  return `<svg class="wx-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;},
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
