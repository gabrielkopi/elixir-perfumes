const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx=vm.createContext({console});
vm.runInContext(['data.js','catalog-100.js','notes.js','engine.js','taste-engine.js'].map(f=>fs.readFileSync(require('path').join(__dirname,'..','assets','js',/engine/.test(f)?'engine':'data',f),'utf8')).join('\n')+`
const ratings={vetiver:10,polo:9,arbo:9,clash:9,malbec:2};
const actual=PERFUMES.map(p=>Engine.recommend(p,ratings));
globalThis.results={
 dimensions:PERFUMES.every(p=>p.vector.length===24&&p.vector.every(v=>v>=0&&v<=1)),
 deterministic:JSON.stringify(actual)===JSON.stringify(PERFUMES.map(p=>Engine.recommend(p,ratings))),
 bounded:actual.every(r=>Number.isFinite(r.score)&&r.score>=0&&r.score<=100),
 coldStart:Engine.recommend(byId('polo'),{}).confidence,
 signed:Engine.recommend(byId('hwyl'),{vetiver:10,polo:10,arbo:10}).score>Engine.recommend(byId('hwyl'),{vetiver:0,polo:0,arbo:0}).score,
 contextual:Engine.compatibility(ratings,PEOPLE[0],null,1).score>Engine.compatibility(ratings,PEOPLE[0],null,3).score,
 noFakeCertainty:actual.every(r=>r.confidence!=='Alta'),
 noObservations:Engine.performance('clash','Nonexistent').count===0,
 size:[PERFUMES.length,PEOPLE.length,POSTS.length]
};`,ctx);
const r=ctx.results;
for(const k of ['dimensions','deterministic','bounded','signed','contextual','noFakeCertainty','noObservations'])assert.equal(r[k],true,k);
assert.equal(r.coldStart,'Dados insuficientes');
assert.equal(r.size[0],100);assert.equal(r.size[1],10);assert.equal(r.size[2],18);
console.log(JSON.stringify(r,null,2));
