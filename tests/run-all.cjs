/* Roda as verificações em ordem. Um teste de outro grupo que ainda não existe aparece como PULADO (nunca como aprovado). */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const TESTS=['verify-engine','verify-discovery','verify-store','verify-globals','verify-css','verify-catalog','verify-privacy','verify-advisor','verify-intel'];
let failed=0;
for(const t of TESTS){const f=path.join(__dirname,t+'.cjs');
 if(!fs.existsSync(f)){console.log(`PULADO ${t} (arquivo ainda não existe)`);continue;}
 const r=cp.spawnSync(process.execPath,[f],{encoding:'utf8'});
 if(r.status===0){console.log(`OK     ${t}`);}else{failed++;console.log(`FALHOU ${t}\n${(r.stdout||'').split('\n').slice(-25).join('\n')}${r.stderr||''}`);}}
if(failed){console.log(`${failed} verificação(ões) falharam`);process.exit(1);}
console.log('Todas as verificações passaram');
