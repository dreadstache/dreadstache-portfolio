import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { applyModelOrder, validModelOrder } from '../app/model-order.ts';

const models = [{id:'a',uploadedAt:'2026-01-01'}, {id:'b',uploadedAt:'2026-02-01'}, {id:'c',uploadedAt:'2026-03-01'}];
test('saved order wins; deleted entries are ignored and new uploads follow saved models',()=>{
 assert.deepEqual(applyModelOrder(models,['b','deleted','a']).map(m=>m.id),['b','a','c']);
 assert.deepEqual(applyModelOrder(models,[]).map(m=>m.id),['c','b','a']);
 assert.deepEqual(models.map(m=>m.id),['a','b','c']);
});
test('order must include every existing model exactly once',()=>{
 assert.equal(validModelOrder(['c','b','a'],models),true);
 for(const ids of [['a','a','c'],['a','b'],['a','b','unknown'],[null,'a','b'],null])assert.equal(validModelOrder(ids,models),false);
});

function setup(){
 let owner=true,ids=null,revision=null,conflict=false,writes=0;
 const objects=models.map(m=>({key:'models/'+m.id,size:100,uploaded:new Date(m.uploadedAt),customMetadata:{name:m.id+'.glb',uploadedAt:m.uploadedAt}}));
 const storage={
  list:async({cursor})=>cursor?{objects:objects.slice(2),truncated:false}:{objects:objects.slice(0,2),truncated:true,cursor:'next'},
  get:async()=>ids?{etag:revision,json:async()=>({ids})}:null,
  put:async(key,value,options)=>{
   assert.equal(key,'metadata/model-order.json');
   assert.deepEqual(options.onlyIf,revision?{etagMatches:revision}:{etagDoesNotMatch:'*'});
   if(conflict)return null;
   ids=JSON.parse(value).ids;revision='revision-'+(++writes);return {etag:revision};
  }
 };
 const source=readFileSync(new URL('../app/api/models/route.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 const require=name=>name==='cloudflare:workers'?{env:{MODELS:storage}}:name.includes('chatgpt-auth')?{getChatGPTUser:async()=>owner?{email:'lucmcote@gmail.com'}:null}:{applyModelOrder,validModelOrder};
 new Function('require','module','exports',compiled)(require,module,module.exports);
 return {...module.exports,setOwner:v=>owner=v,setConflict:v=>conflict=v,getWrites:()=>writes};
}
const request=(ids,revision)=>new Request('https://example.com/api/models',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({ids,revision})});
test('owner save persists order across reload; paginated listing includes the entire collection',async()=>{
 const api=setup();const first=await api.GET();assert.equal(first.headers.get('cache-control'),'no-store');assert.deepEqual((await first.json()).models.map(m=>m.id),['c','b','a']);
 const saved=await api.PATCH(request(['a','c','b'],null));assert.equal(saved.status,200);
 const reloaded=await (await api.GET()).json();assert.deepEqual(reloaded.models.map(m=>m.id),['a','c','b']);assert.equal(reloaded.orderRevision,'revision-1');
 assert.equal((await api.PATCH(request(['b','a','c'],null))).status,409);assert.equal(api.getWrites(),1);
});
test('non-owner, malformed, incomplete and concurrent saves cannot change the order',async()=>{
 const api=setup();api.setOwner(false);assert.equal((await api.PATCH(request(['a','b','c'],null))).status,403);
 api.setOwner(true);assert.equal((await api.PATCH(new Request('https://example.com',{method:'PATCH',body:'bad-json'}))).status,400);
 assert.equal((await api.PATCH(request(['a','b'],null))).status,409);
 api.setConflict(true);assert.equal((await api.PATCH(request(['a','b','c'],null))).status,409);assert.equal(api.getWrites(),0);
});
